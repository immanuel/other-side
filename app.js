var request = require('request');
var parseString = require('xml2js').parseString;
var mysql = require('mysql');
var config = require('./config');
var sites = require('./sites');

function parseAndStoreFeed (site) {

    console.log((new Date()).toISOString() + ": Parsing: " + site.url);
    
    // Get the feed
    request(site.url, function (error, response, body) {

        // TODO: Handle error if get request fails
        if (error) {console.log('error:', error);} // Print the error if one occurred 

        // Parse the XML feed
        parseString(body, {explicitArray: false, trim: true, ignoreAttrs: true}, function(err, result) {

            // TODO: Handle error if parsing fails
            if (error) throw error;

            var numItems = result.rss.channel.item.length;
            var connection = mysql.createConnection(config.db);
            connection.connect();

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
                            // TODO: Handle error if MySQL insert fails
                            if (error) throw error;
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

for(var site in sites) { 
    parseAndStoreFeed(sites[site]);
}
