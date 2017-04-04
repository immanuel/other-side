var winston = require('winston'); // Will use default global settings

var mysql = require('mysql');
var config = require('./config');

var articleIdByLink = {}
var articleById = {}
var relatedArticles = {}

var MAX_MATCHES = 1;

var scoresQuery = `select o.pubID1, o.pubID2, o.score
                from overlap o
                join articles a1 on o.pubID1 = a1.articleID
                join articles a2 on o.pubID2 = a2.articleID
                where
                    a1.pubDate >= (now() - interval 7 day) and
                    a2.pubDate >= (now() - interval 7 day) and
                    score > 0.1;`;

var connection = mysql.createConnection(config.db)

function insertScore(articleID, newScore, scoreArray) {
    var targetIndex = 0;
    var foundIndex = false;
    scoreArray.forEach(function(score, i) {
        if((newScore > score[1]) && (!foundIndex)) {
            foundIndex = true;
        }

        if(newScore <= score[1]) {
            targetIndex = i+1;
        }
    });

    if(targetIndex < MAX_MATCHES) {
        scoreArray.splice(targetIndex, 0, [articleID, newScore])
        if(scoreArray.length > MAX_MATCHES) {
            scoreArray.pop();
        }
    }
}

// Refresh the articles cache
function refreshArticleCache() {

    // Get the list of articles in last 7 days
    connection.query(`select articleID, pubID, title, link, pubDate, description 
                        from articles where 
                        pubDate >= (now() - interval 7 day);`, function (error, results, fields){
        if (error) {
            winston.error('[cache.mysql.select.articles]', {error:error});
            return;
        }

        newArticleIdByLink = {};
        newArticleById = {}

        results.forEach(function(article) {
            newArticleById[article.articleID] = {
                link: article.link,
                pubId: article.pubdID, 
                title: article.title, 
                pubDate: article.pubDate, 
                description: article.description
            };
            newArticleIdByLink[article.link] = article.articleID;
        });

        connection.query(scoresQuery, function(error, results, fields) {
            if (error) {
                winston.error('[cache.mysql.select.scores]', {error:error});
                return;
            }

            newRelatedArticles = {};

            results.forEach(function(relation) {
                id1 = relation.pubID1;
                id2 = relation.pubID2;
                score = relation.score;

                if( !(id1 in newRelatedArticles) )
                    newRelatedArticles[id1] = [];
                if( !(id2 in newRelatedArticles) )
                    newRelatedArticles[id2] = [];

                insertScore(id1, score, newRelatedArticles[id2]);
                insertScore(id2, score, newRelatedArticles[id1]); 
            });

            articleIdByLink = newArticleIdByLink;
            articleById = newArticleById;
            relatedArticles = newRelatedArticles;
            winston.info('[cache.refresh.complete]');
        });
    });

    setTimeout(refreshArticleCache, 1000*60*60);
}

refreshArticleCache();

module.exports = {
    getArticleIdByLink: function(){ return articleIdByLink} ,
    getArticleById: function(){ return articleById} ,
    getRelatedArticles: function() {return relatedArticles}
};
