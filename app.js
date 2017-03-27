// Packages
var request = require('request');
var parseString = require('xml2js').parseString;
var mysql = require('mysql');
var winston = require('winston');
var async = require('async');

// Local files
var config = require('./config');
var sites = require('./sites');
var overlap = require('./overlap');

// Setup logging 
winston.configure({
    transports: [
        new (winston.transports.File)({ 
            filename: config.logFile, 
            level: config.logLevel,
            handleExceptions: true,
            humanReadableUnhandledException: true,
            json: false,
            zippedArchive: true,
            tailable: true,
            maxsize: 10000000, // 10MB
            maxFiles: 100 //100*10MB = 1GB
        })
    ]
});

// Connect to DB
// TODO: Is it OK to keep the connection alive throughout the app?
var connection = mysql.createConnection(config.db);

// Function to process a single news article
function processAndStoreArticle (article, callback) {
    var site = article.site;
    var item = article.item;


    // Store item only if it has guid, title and link
    if (item.hasOwnProperty('guid') && item.hasOwnProperty('title') && item.hasOwnProperty('link')) {

        winston.debug('[parseAndStoreArticle]', {site: site.name, article: item.title});

        // If time of publishing is not present, use current time
        var date = (item.hasOwnProperty('pubDate')) ? new Date(item.pubDate) : new Date();

        connection.query('insert into articles(pubID, guid, title, pubDate, description, link) ' +  
            'values (?, ?, ?, ?, ?, ?) on duplicate key ' + 
            'update title = values(title), pubDate = values(pubDate), description = values(description), link = values(link)', 
            [
                site.pubID, 
                item.guid, 
                item.title, 
                date.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                site.getDesc(item), 
                site.getLink(item) 
            ], 
            function (error, results, fields) {
                if (error) {
                    winston.error('[mysql.insert.article]', {
                        site: site.name, 
                        article: item.title, 
                        guid: item.guid,
                        date: date.toISOString().replace(/T/, ' ').replace(/\..+/, ''), 
                        link: site.getLink(item),
                        desc: site.getDesc(item),
                        error:error
                    });
                    // Indicate task completion after trying and failing to insert article
                    callback();
                }
                else {
                    // If the entry is new, calculate the similarty scores
                    if (results.affectedRows == 1) {
                        winston.info('[mysql.insert]', {
                            site:site.name, 
                            article: item.title 
                        });

                        // If the article doesn't exist, get the articles from last 7 days
                        // TODO: Cache the articles instead of fetching from DB
                        // for each new article
                        var newArticleID = results.insertId;
                        connection.query('select articleID, pubID, title, description from articles where pubDate >= (now() - interval 7 day);', function (error, results, fields){

                            if (error) {
                                winston.error('[mysql.select.articles]', {error:error});
                                return;
                            }

                            // Calculate the overlap between the new article and
                            // all of the other arricles and store in DB
                            results.forEach(function(existingItem) {
                                if(existingItem.pubID != site.pubID) {

                                    var overlapScore = overlap.getOverlapScore(
                                        item.title + " " + site.getDesc(item),
                                        existingItem.title + " " + existingItem.description
                                    );
                                    winston.debug('[overlap score]', {
                                        title1: item.title, 
                                        title2: existingItem.title, 
                                        score: overlapScore
                                    });

                                    // TODO: Only add if score above threshold
                                    if (overlapScore > config.overlapScoreThreshold) {
                                        connection.query('insert into overlap(pubID1, pubID2, score) ' +  
                                            'values (?, ?, ?) on duplicate key ' + 
                                            'update score = values(score)', 
                                            [
                                                (newArticleID > existingItem.articleID) ? existingItem.articleID : newArticleID, 
                                                (newArticleID > existingItem.articleID) ? newArticleID           : existingItem.articleID, 
                                                overlapScore
                                            ], 
                                            function (error, results, fields) {
                                                if(error) {
                                                    winston.error('[mysql.insert.overlap]', {
                                                        newArticleID: newArticleID, 
                                                        existingArticleID: existingItem.articleID, 
                                                        error: error
                                                    });
                                                }
                                        });
                                    }
                                }
                            });

                            // Indicate task completion after inserting new
                            // article
                            callback();
                        });
                    }
                    else {
                        // TODO: If the article exists, check that it hasn't changed much. If so, recompute
                        
                        // Indicate task completion after updating article
                        callback();
                    }
                }
            });
    }
    else {
        // Indicate task completion without inserting the article
        callback();
    }

}

// Setup a queue to process each news article sequentially
var articleQ = async.queue(processAndStoreArticle, 1);

// Function to process a site's feed and repeat after 1 hour
function parseAndStoreFeed (site) {

    winston.info('[parseAndStoreFeed]', {site: site.name});
    
    // Get the feed
    request(site.url, function (error, response, body) {

        // If unable to download feed, skip this processing round
        if (error) {
            winston.error('[request]', {site: site.name, error: error, response: response});
            return;
        }

        // Parse the XML feed
        parseString(body, {explicitArray: false, trim: true, ignoreAttrs: true}, function(err, result) {

            // If unable to parse feed, skip this processing round
            if (err) {
                winston.error('[parseString]', {site: site.name, error: err});
                return;
            }

            // TODO: check that the array and the path exists
            // Add each item to the queue for sequential processing
            result.rss.channel.item.forEach(function (item) {
                articleQ.push({site:site, item:item})
            });
        });
    });

    // TODO: What if processing feed takes more than 1 hour??
    // Fetch the feed again after an hour
    setTimeout(parseAndStoreFeed, 1000*60*60, site);
};

sites.forEach(function(site) {
    parseAndStoreFeed(site);
});
