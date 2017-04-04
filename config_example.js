var config = {};

config.db = {
    host     : 'localhost',
    user     : 'user',
    password : 'pwd',
    database : 'db',
    flags    : '-FOUND_ROWS'
};

// TODO: Create log folder using some startup script
config.appInfoFile = './log/app_info.log';
config.appErrorFile = './log/app_error.log';
config.serverInfoFile = './log/server_info.log';
config.serverErrorFile = './log/server_error.log';

config.overlapScoreThreshold = 0.1;

config.port = 8080;
config.apiURL = '/';

config.cacheRefreshFreq = 60; // Minutes

module.exports = config;
