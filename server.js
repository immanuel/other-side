var winston = require('winston');
var restify = require('restify');
var server = restify.createServer();

var config = require('./config');

// Setup logging
winston.configure({
    transports: [
        new (winston.transports.File)(config.getTransportOptions(
            'server-info-file', config.serverInfoFile, 'info'),
        new (winston.transports.File)(config.getTransportOptions(
            'server-error-file', config.serverErrorFile, 'error')
    ]
});

var cache = require('./cache');

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

