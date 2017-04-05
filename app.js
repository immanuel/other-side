var winston = require('winston');
var config = require('./config');

// Setup logging
winston.configure({
    transports: [
        new (winston.transports.File)(
            config.getTransportOptions('info-file', config.appInfoFile, 'info')),
        new (winston.transports.File)(
            config.getTransportOptions('error-file', config.appErrorFile, 'error'))
    ]
});

var feedProcessor = require('./feed_processor.js');
var sites = require('./sites');

sites.forEach(feedProcessor.parseAndStoreFeed);
