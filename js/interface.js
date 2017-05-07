var appRoot = require('app-root-path');
var leapjs      = require('leapjs');
var controller  = new leapjs.Controller({enableGestures: true});

// When page ready load interface
$(document).ready( function() {
    // deprecated function fix for jfeed
    jQuery.browser = {};
    (function () {
        jQuery.browser.msie = false;
        jQuery.browser.version = 0;
        if (navigator.userAgent.match(/MSIE ([0-9]+)\./)) {
            jQuery.browser.msie = true;
            jQuery.browser.version = RegExp.$1;
        }
    })();
    
    // Retrieve RSS feed
    getRSS('http://www.delfi.lv/rss.php');
//    getRSS('http://newsrss.bbc.co.uk/rss/newsonline_world_edition/front_page/rss.xml');
    
    // Get weather
    getWeather(456173);
    
    // Make popups dissapear when click on size/"blank" space
    $('#overlay').click(function(){
        console.debug('click');
        hideOverlay();
    });
    $("#overlay *").click(function(e) {
        e.stopPropagation();
    });
    
    // Debug buttons
    // Sphinx test page
    $('#show-sphinx-test').click(function(){
        showOverlay();
        $('#overlay *').hide();
        $('#sphinx-wrap').append('<iframe class="web-page" src="sphinx-test/live.html"></iframe>');
        $('#sphinx-wrap').show();
        
    });
    
    // Anayng test page
    $('#show-anyang-test').click(function(){
        showOverlay();
        $('#overlay *').hide();
        $('#sphinx-wrap').append('<iframe class="web-page" src="anyangTest/TestAnnayang.html"></iframe>');
        $('#sphinx-wrap').show();
        
    });
    
    // Reload mirror page
    $('#reload-button').click(function(){
        location.reload();        
    });
    
    // Sphinx debug frame
    // Start Sphinx listening
    $('#start-sphinx-button').click(function(){
        startRecording('Base Commands');
    });
    // Stop Sphinx listening
    $('#stop-sphinx-button').click(function(){
        stopRecording();
    });
    
    // Make frames draggable
    $('.draggable').draggable({
        start: function(event, ui){
            ui.helper.bind("click.prevent",
                function(event){ 
                    event.preventDefault(); 
                });
        },
        stop: function(event, ui){
            setTimeout(function(){
                ui.helper.unbind("click.prevent");
            }, 300);
        },
//        containment: "#mirrortop", 
        scroll: false
    });
    
    // Load voice recignition
//    initializeVoice();
    
    // Load Reddit feed
    getReddit('videos');
    
});
    
controller.on('deviceFrame', function(frame) {
    // loop through available gestures
    for(var i = 0; i < frame.gestures.length; i++){
      var gesture = frame.gestures[i];
      var type    = gesture.type;          

      switch( type ){

        case "circle":
          if (gesture.state == "stop") {
            console.log('circle');
          }
          break;

        case "swipe":
          if (gesture.state == "stop") {
            console.log('swipe');
          }
          break;

        case "screenTap":
          if (gesture.state == "stop") {
            console.log('screenTap');
          }
          break;

        case "keyTap":
          if (gesture.state == "stop") {
            console.log('keyTap');
          }
          break;

        }
      }
});

leapjs.loop({

  hand: function(hand){
    console.log( hand.screenPosition() );
  }

}).use('screenPosition');

controller.connect();

function initializeVoice(system){
    if (system === undefined){
        system = 'sphinx';
    }
    if (system === 'sphinx'){
        var startTime = new Date();
        console.debug('Starting Sphinx');
        // Start listening as sphinx is ready
        $(document).on("sphinxReady", function(){
            console.debug('Event Sphinx ready');
//            startRecording('Base Commands Keywords');
            var endTime = new Date();
            console.debug('Sphinx Startup time: ',endTime-startTime+'ms');
        });
        // initialize sphinx
        startSphinx();
    }
}

function getRSS(rssUrl){
    $.getFeed({
        url: rssUrl,
        success: function(feed) {
//            console.debug("RSS: " + feed.title);
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

function getReddit(sub){
    
    $.get('https://www.reddit.com/r/'+ sub +'.json',function(res){
//        console.debug(sub);
        $('.reddit-content').empty();
        var res = res.data.children;
        for (var i = 0; i < res.length; i++){
//            console.debug(res[i]);
            appendRedditItem('.reddit-content',res[i],i);
        }
    });
}

function appendRedditItem(elem,item,nr){
    if (nr === undefined){
        nr = 0;
    }
    var html = '';
    
    html += '<div class="reddit-entry">'
    + '<img class="thumbnail" src="'
    + item.data.thumbnail
    + '"/>'
    + '<h3>'
    + item.data.title
    + '</h3>'
    + '<p>'
    + 'comments'
    + '</p>'
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
//        console.debug(res);
        var html = ''
        html += res.name + ' '
        + res.main.temp + ' '
        + res.weather[0].description;
        $('#weather-current').append(html);
//        console.debug(html);
    });
    $.getJSON('http://api.openweathermap.org/data/2.5/forecast?id=' + cityID + '&appid=e7bd0ec8e9425f345f1215e18dcf4871&units=metric',function(res){
        $('#weather-forcast').empty();
//        console.debug(res);
        
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
    $('#overlay').hide();
    $('#news-wrap').empty();
    
    getArticle(url,function(response){
        console.debug(response);
        $('#news-wrap').html(response);
        showOverlay();
        $('#news-wrap').show();
    })
    
}

function setVoiceStatus(status){
    switch (status){
        case 'initializing':
            $('#voice-status').html('<div class="spinner"></div>');
            break;
        case 'ready':
            $('#voice-status').html('Ready');
            break;
        case 'listening':
            $('#voice-status').html('Listening');
            break;
        case 'error':
            $('#voice-status').html('Error');
            break;
        case 'Procesing':
            $('#voice-status').html('Procesing');
            break;
        default:
            $('#voice-status').html('Error');
            console.error('setVoiceStatus',status,'not recognized');
            break;
    }
}