function startSpeakable() {
    setVoiceStatus('initializing');
    var Speakable = require('speakable');
    var API_KEY = process.env.GOOGLE_API_KEY;
    // Setup google speech
    var speakable = new Speakable({key: API_KEY}, {lang: 'en-US', threshold: 0.9, sox_path: 'C:/Program Files (x86)/sox-14-4-1/sox'});
    speakable.one('speechStart', function () {
        setVoiceStatus('ready');
    });
    speakable.on('speechStart', function () {
        console.debug('Google Speech Start');
    });
    speakable.on('speechStop', function () {
        console.debug('Google Speech Stop');
        // Tturn sphinx back on
//        speakable.recordVoice();
    });
    speakable.on('speechReady', function () {
        console.debug('onSpeechReady');
    });
    speakable.on('error', function (err) {
        console.debug('Google Speech Error:');
        console.error(err);
        setVoiceStatus('error');
    });
    speakable.on('speechResult', function (spokenWords) {
        console.log('onSpeechResult:');
        console.log('Google Speech:',spokenWords);
        voice(spokenWords);
    });
    
    // Start listening
    speakable.recordVoice();
}

function startGoogleMic(){
    
    var speech = require('google-speech-microphone');
    
    speech.getSpeechService({
        GOOGLE_APPLICATION_CREDENTIALS: 'D:/client_secret.json',
        GCLOUD_PROJECT: 'reflexo'
    })
    .then(speechService => {
        return speech.sync({ speechService });
    })
    .then(res => {
        console.log(JSON.stringify(res));
    })
    .catch(err => {
        console.log(err);
    });
}