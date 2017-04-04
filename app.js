var winston = require('winston');
var config = require('./config');

// Setup logging
winston.configure({
    transports: [
        new (winston.transports.File)({ 
            name: 'info-file', 
            filename: config.appInfoFile, 
            level: 'info',
            handleExceptions: true,
            humanReadableUnhandledException: true,
            json: false,
            zippedArchive: true,
            tailable: true,
            maxsize: 10000000, // 10MB
            maxFiles: 100 //100*10MB = 1GB
        }),
        new (winston.transports.File)({ 
            name: 'error-file',
            filename: config.appErrorFile, 
            level: 'error',
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
