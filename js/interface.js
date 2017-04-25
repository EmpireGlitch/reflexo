$(document).ready( function() {
    // Retrieve RSS feed
    getRSS('http://www.delfi.lv/rss.php');
//    getRSS('http://newsrss.bbc.co.uk/rss/newsonline_world_edition/front_page/rss.xml');
    
    getWeather(456173);
    
    $('#overlay').click(function(){
        console.debug('click');
        hideOverlay();
    });
    $("#overlay *").click(function(e) {
        e.stopPropagation();
    });
    $('.draggable').draggable();
    if (!('webkitSpeechRecognition' in window)) {
        upgrade();
    } else {
    var recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = function(){ 
        console.debug('voice-start'); 
    };
    recognition.onresult = function(event){ 
        console.debug(event,'voice-result'); 
    };
    recognition.onerror = function(event){ 
        console.debug(event,'voice-error');
    };
    recognition.onend = function(){
        console.debug('voice-end');
    };
    recognition.lang = 'en-US';
//    recognition.start();
    }
    
    setTimeout(function(){
//        showOverlay();
    },2000);
    
});

function getRSS(rssUrl){
    $.getFeed({
        url: rssUrl,
        success: function(feed) {
            console.debug("RSS: " + feed.title);
            $('#rss-content').empty();
            $('#rss-content').append('<h2>' + feed.title + '</h2>');
            for (var i = 0; i < feed.items.length && i < 8; i++){
                appendRSSItem('#rss-content',feed.items[i],i);
            }
//            console.debug(feed);
       }
    });
}

function appendRSSItem(elem,item,nr){
    if (nr === undefined){
        nr = 0;
    }
    var html = '';
    
    html += '<div class="rss-entry">'
    + '<h3>'
//    + '<a href="' + item.link + '">'
    + item.title
//    + '</a>'
    + '</h3>'
    + '</div>';
    html = $(html);
    html.css('animation-delay',nr*100+'ms');
    html.click(function(){
        showArticle(item.link);
    });
    $(elem).append(html);
}

// Generate random id
function rid(){
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var id = '';
    for (var i = 0; i < 16; i++){
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

function getWeather(cityID){
    
    $.getJSON('http://api.openweathermap.org/data/2.5/weather?id=' + cityID + '&appid=e7bd0ec8e9425f345f1215e18dcf4871&units=metric',function(res){
        $('#weather-current').empty();
        console.debug(res);
        var html = ''
        html += res.name + ' '
        + res.main.temp + ' '
        + res.weather[0].description;
        $('#weather-current').append(html);
        console.debug(html);
    });
    $.getJSON('http://api.openweathermap.org/data/2.5/forecast?id=' + cityID + '&appid=e7bd0ec8e9425f345f1215e18dcf4871&units=metric',function(res){
        $('#weather-forcast').empty();
        console.debug(res);
        
    });
}

function showOverlay(){
    $('#overlay').show();
    $('#mirrortop').removeClass('unblur');
    $('#mirrortop').addClass('blur');
}

function hideOverlay(){
    $('#overlay').hide();
    $('#mirrortop').removeClass('blur');
    $('#mirrortop').addClass('unblur');
    
}

function showArticle(url){
    $('#news-wrap').empty();
    
    getArticle(url,function(response){
        console.debug(response);
        $('#news-wrap').html(response);
        showOverlay();
        $('#news-wrap').show();
    })
    
}