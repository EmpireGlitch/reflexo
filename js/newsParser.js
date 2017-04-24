// Return html article from input site url
function getArticle(sourceUrl,callback){
    sourceName = sourceUrl.replace('http://','').replace('http://www.','').split('.')[0];
    console.debug('Name: ',sourceName);
    console.debug('Link: ',sourceUrl);
    if (sourceName === "delfi"){
        parseDelfi(sourceUrl,callback);
    }
    else if (sourceName === "bbc"){
        parseBBC(sourceUrl,callback);
    }
    else{
        $.get(sourceUrl,function(response){
            article = $(response).find('p');
            console.debug('Got: ',article);
            callback(article);        
        });
    }
    
}

function parseDelfi(sourceUrl,callback){
    console.debug('Recognised: Delfi')
    $.get(sourceUrl,function(response){
        article = $(response).find('#article-intext-wrapper').remove('div#relatedA');
        console.debug('Got: ',article);
        callback(article);
    });
}

function parseBBC(sourceUrl,callback){
    $.get(sourceUrl,function(response){
        article = $(response).find('div.story-body');
        console.debug('Got: ',article);
        callback(article);
    });
}