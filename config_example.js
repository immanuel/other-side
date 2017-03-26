var config = {};

config.db = {
    host     : 'localhost',
    user     : 'user',
    password : 'pwd',
    database : 'db'
};

// TODO: Create log folder using some startup script
config.logFile = './log/app.log';
config.logLevel = 'info';

module.exports = config;
