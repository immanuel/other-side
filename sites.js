const url = require('url');

function getDomainAndPath(rawURL) {
    var parsedURL = url.parse(rawURL);
    return (parsedURL.hostname.match(/[^\.]*\.[^\.]*$/)[0] + parsedURL.pathname);
}

function baseGetDesc (item) {
    return item.description;
}

function baseGetLink (item) {
    return getDomainAndPath(item.link);
}

var sites = {
    NYTimes: {
        pubID: 1,
        url : 'http://rss.nytimes.com/services/xml/rss/nyt/Politics.xml',
        getDesc : baseGetDesc,
        getLink: baseGetLink
    },
    FoxNews: {
        pubID: 2,
        url: 'http://feeds.foxnews.com/foxnews/politics?format=xml',
        getDesc : function(item) { return baseGetDesc(item).match('^(.*)<img')[1]} ,
        getLink: function(item) {return getDomainAndPath(item['feedburner:origLink'])}
        // No last built date
    },
    WSJ: {
        pubID: 3,
        // url: 'http://www.wsj.com/xml/rss/3_7055.xml',
        url: 'http://www.wsj.com/xml/rss/3_7046.xml',
        // getDesc: function(item) { return baseGetDesc(item)._.substring(0, 250)}
        getDesc: baseGetDesc,
        getLink: baseGetLink
    },
    CNN: {
        pubID: 4,
        url: 'http://rss.cnn.com/rss/cnn_allpolitics.rss',
        getDesc: function(item) {return baseGetDesc(item).match('^(.*)<div class="feedflare">')[1]},
        getLink: function(item) {return getDomainAndPath(item['feedburner:origLink'])}
    }
};

module.exports = sites;
