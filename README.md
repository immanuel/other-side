# Other Side
Other Side provieds an HTTP API to find similar articles from different sides of the political spectrum

The app consists of two components:

- Feed Processor: Collects articles from pre-defined set of RSS feeds and stores the articles along with the similarity scores between them. 
- REST End Point: Given a link, returns the list of related articles

## Article Similarity
For two given articles, the similarity score is the [Jaccard Index](https://en.wikipedia.org/wiki/Jaccard_index) of the words from the articles' title and lede. 

Priori to the Jaccard Index calculation, a manual list of stop words is removed from the title and lede.
