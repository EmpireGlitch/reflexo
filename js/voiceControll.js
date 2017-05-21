var sleepMode = true;

function voice(transcriptArray){
    const wakeupPhrase = 'mirror mirror';
    const sleepPhrase = 'sleep';
    transcript = transcriptArray.join(' ');
    if (transcript === wakeupPhrase && sleepMode){
        voiceListen();
    }
    if (transcript === sleepPhrase && !sleepMode){
        voiceSleep();
    }
    if (!sleepMode){
        $('#voice-command').text(transcript);
    }
    
    
    
}

function voiceListen(){
    sleepMode = false;
    setVoiceStatus('listening');
}

function voiceSleep(){
    sleepMode = true;
    $('#voice-command').text('');
    setVoiceStatus('ready');
}