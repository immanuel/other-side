var restify = require('restify');
var server = restify.createServer();

var config = require('./config');
var cache = require('./cache');

server.on('uncaughtException', function(req, res, route, error) {
    console.log(error);
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

        responseObject = {
            articles: []
        };

        if(req.body['link'] in articleIdByLink) {
            console.log('Found article by link');

            requestArticleId = articleIdByLink[req.body['link']];

            relatedArticles = cache.getRelatedArticles();

            if(requestArticleId in relatedArticles){
                console.log('Found related articles');

                articleById = cache.getArticleById();
                relatedArticles[requestArticleId].forEach(function(relatedArticle){
                    relatedArticleId = relatedArticle[0];
                    if(relatedArticleId in articleById){
                        console.log('returning article: ', relatedArticleId);
                        responseObject.articles.push(articleById[relatedArticleId]);
                    }
                });
            }

        }

        res.json(responseObject);
    }
   
})

server.listen(config.port, function () {
    console.log('Example app listening')
})

