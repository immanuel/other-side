var STOP_WORDS = new Set([
    'a', 
    'an', 
    'and', 
    'are', 
    'as', 
    'at', 
    'be', 
    'by', 
    'for', 
    'from', 
    'has', 
    'he', 
    'in', 
    'is', 
    'it', 
    'its', 
    'of', 
    'on', 
    'that', 
    'the', 
    'to', 
    'was', 
    'were', 
    'will', 
    'with']);

function tokenize(text) {

    text = text.toLowerCase();

    // Remove the 's at the end of words
    text = text.replace(/['\u2019\u2018\u201B][sS](?!\w)/g, '');

    // Remove '
    text = text.replace(/['\u2019\u2018\u201B]/g, '');

    // Remove periods in abbreviations
    text = text.replace(/\.(?=\w)/g, '');

    var words = new Set(text.match(/[\w]+/g));

    // Remove stop words
    for (var word of words) {
        if(STOP_WORDS.has(word)) {
            words.delete(word);
        }
    }

    return words;
}

function getOverlapScore(text1, text2) {
    var words1 = tokenize(text1);
    var words2 = tokenize(text2);

    // Calculate overlap between words and article.words
    var union = new Set(words1), intersection = new Set();
    for (var word of words2) {
        union.add(word);
        if(words1.has(word)) {
            intersection.add(word)
        }
    }

    return intersection.size / union.size;
}

module.exports.getOverlapScore = getOverlapScore;
