// Return html article from input site url
function getArticle(sourceUrl,callback){
    sourceName = sourceUrl.replace('http://','').replace('http://www.','').split('.')[0];
    if (sourceName === "delfi"){
        parseDelfi(sourceUrl,callback);
    }
    else if (sourceName === "bbc"){
        parseBBC(sourceUrl,callback);
    }
    else{
        $.get(sourceUrl,function(response){
            article = $(response).find('p');
            callback(article);        
        });
    }
    
}

function parseDelfi(sourceUrl,callback){
    $.get(sourceUrl,function(response){
        article = $(response).find('#article-intext-wrapper').remove('div#relatedA');
        callback(article);
    });
}

function parseBBC(sourceUrl,callback){
    $.get(sourceUrl,function(response){
        article = $(response).find('div.story-body');
        callback(article);
    });
}