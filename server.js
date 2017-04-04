var winston = require('winston');
var restify = require('restify');
var server = restify.createServer();

var config = require('./config');
var cache = require('./cache');

// Setup logging
winston.configure({
    transports: [
        new (winston.transports.File)({ 
            name: 'server-info-file', 
            filename: config.serverInfoFile, 
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
            name: 'server-error-file',
            filename: config.serverErrorFile, 
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

server.on('uncaughtException', function(req, res, route, error) {
    winston.error('[uncaught exception', error);
    res.send(new restify.InternalError());
});

server.use(restify.bodyParser({
    maxBodySize : 1024
}));

server.use(restify.throttle({
    burst: 100,
    rate: 50,
    ip: true
}));

server.post(config.apiURL, function (req, res) {

    if(!('link' in req.body)){
        res.send(new restify.UnprocessableEntityError("Missing property 'link'"));
    }
    else if (!(typeof req.body['link'] === 'string')){
        res.send(new restify.UnprocessableEntityError("'link' is not a string"));
    }
    else {
        articleIdByLink = cache.getArticleIdByLink();
        responseObject = {articles:[]};

        if(req.body['link'] in articleIdByLink) {
            requestArticleId = articleIdByLink[req.body['link']];
            relatedArticles = cache.getRelatedArticles();

            if(requestArticleId in relatedArticles){
                articleById = cache.getArticleById();
                relatedArticles[requestArticleId].forEach(function(relatedArticle){
                    relatedArticleId = relatedArticle[0];
                    if(relatedArticleId in articleById){
                        responseObject.articles.push(articleById[relatedArticleId]);
                    }
                });
                winston.debug('[related articles served]', {
                    requestArticleId: requestArticleId, 
                    responseArticles: relatedArticles[requestArticleId]
                });
            }
        }
        res.json(responseObject);
    }
})

server.listen(config.port, function () {
    winston.info('[server started]');
})

