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
    console.log(req.body);

    if(!('link' in req.body)){
        res.send(new restify.UnprocessableEntityError("Missing property 'link'"));
    }
    else if (!(typeof req.body['link'] === 'string')){
        res.send(new restify.UnprocessableEntityError("'link' is not a string"));
    }
    else {
        res.json({respose: "some other text"})
    }
   
})

server.listen(config.port, function () {
    console.log('Example app listening')
})

