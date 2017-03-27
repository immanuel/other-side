var config = {};

config.db = {
    host     : 'localhost',
    user     : 'user',
    password : 'pwd',
    database : 'db',
    flags    : '-FOUND_ROWS'
};

// TODO: Create log folder using some startup script
config.logFile = './log/app.log';
config.logLevel = 'info';

config.overlapScoreThreshold = 0;

module.exports = config;
