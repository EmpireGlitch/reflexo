function showVideo(url){
    // Add iframe to #video-wrap
    var html = '<iframe><iframe>'
    $('#video-wrap').append(html);
    showOverlay();
        
}

function hideVideo(url){
    hideOverlay();
}