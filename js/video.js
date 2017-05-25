function showVideo(code){
    // Add iframe to #video-wrap
    var html = '<iframe width="750" height="550" src="https://www.youtube.com/embed/' + code + '"></iframe>'
    $('#video-wrap').append(html);
    $('#video-wrap').show();
    showOverlay();
        
}

function hideVideo(){
    hideOverlay();
}