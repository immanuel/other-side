var request = require('request');
var parseString = require('xml2js').parseString;
var mysql = require('mysql');
var config = require('./config');
var sites = require('./sites');
var winston = require('winston');

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
                winston.error('[parseString]', {site:, site.name, error: err});
                return;
            }

            var numItems = result.rss.channel.item.length;
            var connection = mysql.createConnection(config.db);
            connection.connect(function(err){
                if (err) { winston.error('[mysql.connect]', {site: site.name, error:err}); }
            });

            for (var i = 0; i <  numItems; i++) {
                var item = result.rss.channel.item[i];

                // Store item only if it has guid, title and link
                if (item.hasOwnProperty('guid') && item.hasOwnProperty('title') && item.hasOwnProperty('link')) {

                    // If time of publishing is not present, use current time
                    var date;
                    if (item.hasOwnProperty('pubDate')) {
                        date = new Date(item.pubDate);
                    }
                    else {
                        date = new Date();
                    }

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
                                winston.error('[mysql.insert]', {
                                    site:site.name, 
                                    guid: item.guid, 
                                    link: site.getLink(item),
                                    error:error
                                });
                            }
                    });
                }
            }

            connection.end();
        });

    });

    // TODO: What if processing feed takes more than 1 hour??
    // Fetch the feed again after an hour
    setTimeout(parseAndStoreFeed, 1000*60*60, site);
};

sites.forEach(function(site) {
    parseAndStoreFeed(site);
});
