var appRoot = require('app-root-path');
var leapjs = require('leapjs');
var controller = new leapjs.Controller({enableGestures: true});

// When page ready load interface
$(document).ready(function () {
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
    
    // Debug buttons
    var mainDebug = new debugFrame('Debug')

    // Reload mirror page
    mainDebug.addButton('Reload', function () {
        location.reload();
    });

    // Sphinx test page
    mainDebug.addButton('Sphinx', function () {
        showOverlay();
        $('#overlay *').hide();
        $('#sphinx-wrap').append('<iframe class="web-page" src="sphinx-test/live.html"></iframe>');
        $('#sphinx-wrap').show();
    });

    // Anayng test page
    mainDebug.addButton('Anyang', function () {
        showOverlay();
        $('#overlay *').hide();
        $('#sphinx-wrap').append('<iframe class="web-page" src="anyangTest/TestAnnayang.html"></iframe>');
        $('#sphinx-wrap').show();
    });

    // Recorder test page
    mainDebug.addButton('Recorder', function () {
        showOverlay();
        $('#overlay *').hide();
        $('#sphinx-wrap').append('<iframe class="web-page" src="recorder/index.html"></iframe>');
        $('#sphinx-wrap').show();
    });

    // Sphinx debug frame
    var sphinxDebug = new debugFrame('Sphinx');

    sphinxDebug.addButton('Start', function () {
//        startRecording('EnglishCMU');
        startRecording('Base Offline Commands');
    });
    sphinxDebug.addButton('Stop', function () {
        stopRecording();
    });

    // Retrieve RSS feed
    getRSS('http://www.delfi.lv/rss.php');
//    getRSS('http://newsrss.bbc.co.uk/rss/newsonline_world_edition/front_page/rss.xml');

    // Get weather
    getWeather(456173);

    // Load Reddit feed
    getReddit('videos');


    // Make popups dissapear when click on size/"blank" space
    $('#overlay').click(function () {
//        console.debug('click');
        hideOverlay();
    });
    $("#overlay *").click(function (e) {
        e.stopPropagation();
    });

    // Make frames draggable
    $('.draggable').draggable({
        start: function (event, ui) {
            ui.helper.bind("click.prevent",
                    function (event) {
                        event.preventDefault();
                    });
        },
        stop: function (event, ui) {
            setTimeout(function () {
                ui.helper.unbind("click.prevent");
            }, 300);
        },
//        containment: "#mirrortop", 
        scroll: false
    });



    // Load voice recignition
    initializeVoice('speakable');

    // Load gesture controll
    initLeap();

    var child_process = require('child_process');

    var py = child_process.spawn('python', [appRoot + 'py-test\hello.py', 'me']);
    py.on('close', function () {
        console.debug('python done');
    });

    $(document).click(function (e) {
        clickRipple({x:e.pageX, y:e.pageY});
    });
});

controller.connect();

function initializeVoice(system) {
    if (system === undefined) {
        system = 'speakable';
    }
    // Start sphinx for offline wakeup
    var startTime = new Date();
    console.debug('Starting Sphinx');
    // Start listening as sphinx is ready
    $(document).on("sphinxReady", function () {
        console.debug('Event Sphinx ready');
//            startRecording('EnglishCMU');
        var endTime = new Date();
        console.debug('Sphinx Startup time: ', endTime - startTime + 'ms');
    });
    // initialize sphinx
//    startSphinx();
    
    if (system === 'speakable'){
//        console.debug('Starting speakable');
//        startSpeakable();
    }
    
}

function getRSS(rssUrl) {
    $.getFeed({
        url: rssUrl,
        success: function (feed) {
//            console.debug("RSS: " + feed.title);
            $('#rss-content').empty();
            $('#rss-content').append('<h2>' + feed.title + '</h2>');
            for (var i = 0; i < feed.items.length && i < 8; i++) {
                appendRSSItem('#rss-content', feed.items[i], i);
            }
//            console.debug(feed);
        }
    });
}

function appendRSSItem(elem, item, nr) {
    if (nr === undefined) {
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
    html.css('animation-delay', nr * 100 + 'ms');
    html.click(function () {
        showArticle(item.link);
    });
    $(elem).append(html);
}

function getReddit(sub) {

    $.get('https://www.reddit.com/r/' + sub + '.json', function (res) {
//        console.debug(sub);
        $('.reddit-content').empty();
        var res = res.data.children;
        for (var i = 0; i < res.length; i++) {
//            console.debug(res[i]);
            appendRedditItem('.reddit-content', res[i], i);
        }
    });
}

function appendRedditItem(elem, item, nr) {
    if (nr === undefined) {
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
    html.css('animation-delay', nr * 100 + 'ms');
    html.click(function () {
        showArticle(item.link);
    });
    $(elem).append(html);
}



function getWeather(cityID) {

    $.getJSON('http://api.openweathermap.org/data/2.5/weather?id=' + cityID + '&appid=e7bd0ec8e9425f345f1215e18dcf4871&units=metric', function (res) {
        $('#weather-current').empty();
//        console.debug(res);
        var html = ''
        html += res.name + ' '
                + res.main.temp + ' '
                + res.weather[0].description;
        $('#weather-current').append(html);
//        console.debug(html);
    });
    $.getJSON('http://api.openweathermap.org/data/2.5/forecast?id=' + cityID + '&appid=e7bd0ec8e9425f345f1215e18dcf4871&units=metric', function (res) {
        $('#weather-forcast').empty();
//        console.debug(res);

    });
}

function showOverlay() {
    $('#overlay').show();
    $('#mirrortop').removeClass('unblur');
    $('#mirrortop').addClass('blur');
}

function hideOverlay() {
    $('#overlay').hide();
    $('#mirrortop').removeClass('blur');
    $('#mirrortop').addClass('unblur');
    $('#overlay  > *').empty();

}

function showArticle(url) {
    $('#overlay').hide();
    $('#news-wrap').empty();

    getArticle(url, function (response) {
//        console.debug(response);
        $('#news-wrap').html(response);
        showOverlay();
        $('#news-wrap').show();
    });

}

function setVoiceStatus(status) {
    switch (status) {
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
            console.error('setVoiceStatus', status, 'not recognized');
            break;
    }
}

// Deprecated
function setHand(point) {
    var x = point.x + (window.innerWidth / 2);
    var y = -1 * point.y + (window.innerHeight);
    $('#left-hand').offset({left: x, top: y});
//    console.debug('Point:',x,y);
}

// Set finger(1-5, counting from thumb, 0 for palm) cursor position for each hand
// Hand - string 'left' or 'right'
// finger - integer
function setGestureCursor(hand, finger, point) {
    // Adjust leap real space coordinates top application coordinates
    appPoint = screen(point);
    var x = appPoint.x;
    var y = appPoint.y;
//    var x = point.x + (window.innerWidth / 2);
//    var y = -1 * point.y + (window.innerHeight);
    switch (hand) {
        case 'left':
            switch (finger) {
                case 0:
                    $('#left-hand').offset({left: x, top: y});
                    break;
                case 1:
                    $('#left-finger-1').offset({left: x, top: y});
                    break;
                case 2:
                    $('#left-finger-2').offset({left: x, top: y});
                    break;
                case 3:
                    $('#left-finger-3').offset({left: x, top: y});
                    break;
                case 4:
                    $('#left-finger-4').offset({left: x, top: y});
                    break;
                case 5:
                    $('#left-finger-5').offset({left: x, top: y});
                    break;
            }
            break;
        case 'right':
            switch (finger) {
                case 0:
                    $('#right-hand').offset({left: x, top: y});
                    break;
                case 1:
                    $('#right-finger-1').offset({left: x, top: y});
                    break;
                case 2:
                    $('#right-finger-2').offset({left: x, top: y});
                    var normalized = normalize(point);
                    // Debug code
                    leapDebug.setValue('nPoint', normalized.x + ';' + normalized.y);
                    leapDebug.setValue('aPoint', x + ';' + y);
//                    leapDebug.setValue('cursor',document.elementsFromPoint(x,y));
//                    console.debug(document.elementsFromPoint(x,y))
                    break;
                case 3:
                    $('#right-finger-3').offset({left: x, top: y});
                    break;
                case 4:
                    $('#right-finger-4').offset({left: x, top: y});
                    break;
                case 5:
                    $('#right-finger-5').offset({left: x, top: y});
                    break;
            }
            break;
    }
//    console.debug(cursor,x,y)
}

function updateLeapDebug(frame, data) {
    if (frame !== undefined) {
        $('#leap-timestamp').text(frame.timestamp);
        if (frame.hands !== undefined) {
            $('#leap-hand-count').text(frame.hands.length);
        } else {
            $('#leap-hand-count').text(0);
        }
        try {
            $('#finger-position').text(frame.hands[0].fingers[1].stabilizedTipPosition);
        } catch (error) {
        }

    }
    if (data != undefined) {
        if (data.waiting !== undefined) {
            $('#leap-calibration-waiting').text(data.waiting);
        }
    }
}

function showLeftHand() {
    $('#left-hand').show();
}

function hideLeftHand() {
    $('#left-hand').hide();
}

function showRightHand() {
    $('#right-hand').show();
}

function hideRightHand() {
    $('#right-hand').hide();
}

function clickRipple(point) {
    var ripple = $('<div class="click-ripple"></div>');
    ripple.offset({left: point.x, top: point.y});
    $('html').append(ripple);

    $('.click-ripple').on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function (e) {
        console.debug('done');
        $(this).remove();
        $(this).off(e);
    });
}
