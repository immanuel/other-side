var winston = require('winston');
var config = require('./config');

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

var feedProcessor = require('./feed_processor.js');
var sites = require('./sites');

sites.forEach(feedProcessor.parseAndStoreFeed);
