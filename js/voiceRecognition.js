// These will be initialized later
var recognizer, recorder, callbackManager, audioContext, outputContainer;
// Only when both recorder and recognizer do we have a ready application
        var isRecorderReady = isRecognizerReady = false;
// A convenience function to post a message to the recognizer and associate
// a callback to its response
        function postRecognizerJob(message, callback) {
        var msg = message || {};
                if (callbackManager)
                msg.callbackId = callbackManager.add(callback);
                if (recognizer)
                recognizer.postMessage(msg);
        }
;
// This function initializes an instance of the recorder
// it posts a message right away and calls onReady when it
// is ready so that onmessage can be properly set
        function spawnWorker(workerURL, onReady) {
        recognizer = new Worker(workerURL);
                recognizer.onmessage = function (event) {
                onReady(recognizer);
                };
                recognizer.postMessage('');
        }
;
// To display the hypothesis sent by the recognizer
        function updateHyp(hyp) {
        if (outputContainer)
                outputContainer.innerHTML = hyp;
        }
;
// This updates the UI when the app might get ready
// Only when both recorder and recognizer are ready do we enable the buttons
        function updateUI() {
        if (isRecorderReady && isRecognizerReady) {
        updateStatus('Can start');
        }
        ;
        }
;
// This is just a logging window where we display the status
        function updateStatus(newStatus) {
//  document.getElementById('current-status').innerHTML += "<br/>" + newStatus;
        console.debug(newStatus);
        }
;
// A not-so-great recording indicator
        function displayRecording(display) {

        if (display) {
        setVoiceStatus('listening');
        } else {
        setVoiceStatus('ready');
        }
        }
;
// Callback function once the user authorises access to the microphone
// in it, we instanciate the recorder
        function startUserMedia(stream) {
        var input = audioContext.createMediaStreamSource(stream);
                // Firefox hack https://support.mozilla.org/en-US/questions/984179
                window.firefox_audio_hack = input;
                var audioRecorderConfig = {errorCallback: function (x) {
                updateStatus("Error from recorder: " + x);
                }};
                recorder = new AudioRecorder(input, audioRecorderConfig);
                // If a recognizer is ready, we pass it to the recorder
                if (recognizer)
                recorder.consumers = [recognizer];
                isRecorderReady = true;
                updateUI();
                updateStatus("Audio recorder ready");
        }
;
// This starts recording. We first need to get the id of the grammar to use
        var startRecording = function (grammarTitle) {
        console.debug('Starting Recording');
                for (var i = 0; i < grammarIds.length; i++) {
        if (grammarIds[i].title === grammarTitle) {
        id = grammarIds[i].id;
                break;
        }
        }
        ;
                if (recorder && recorder.start(id))
                displayRecording(true);
        };
// Stops recording
        var stopRecording = function () {
        console.debug('Stop Recording');
                recorder && recorder.stop();
                displayRecording(false);
        };
// Called once the recognizer is ready
// We then add the grammars to the input select tag and update the UI
        var recognizerReady = function () {
        updateGrammars();
                isRecognizerReady = true;
                updateUI();
                updateStatus("Recognizer ready");
                setVoiceStatus('ready');
                $.event.trigger({
                type: "sphinxReady",
                        message: "Spinx voice recognition is ready",
                        time: new Date()
                });
//     startRecording(currentGrammar);
        };
// generate grammar list
        var updateGrammars = function () {
        console.debug('update Grammars::', grammarIds);
        };
// This adds a grammar from the grammars array
// We add them one by one and call it again as
// a callback.
// Once we are done adding all grammars, we can call
// recognizerReady()
        var feedGrammar = function (g, index, id) {
        if (id && (grammarIds.length > 0))
                grammarIds[0].id = id.id;
                if (index < g.length) {
        console.debug('add grammar', g[index].title)
                grammarIds.unshift({title: g[index].title});
                postRecognizerJob({command: 'addGrammar', data: g[index].g},
                        function (id) {
                        feedGrammar(grammars, index + 1, {id: id});
                        });
        } else {
        grammarIds.push({"id": 0, "title": "Base Commands Keywords"});
                recognizerReady();
        }
        };
// This adds words to the recognizer. When it calls back, we add grammars
        var feedWords = function (words) {
        updateStatus('Adding words');
                postRecognizerJob({command: 'addWords', data: words},
                        function () {
                        feedGrammar(grammars, 0);
                        });
        };
// This initializes the recognizer. When it calls back, we add words
        var initRecognizer = function () {
        // You can pass parameters to the recognizer, such as : {command: 'initialize', data: [["-hmm", "my_model"], ["-fwdflat", "no"]]}
        postRecognizerJob({command: 'initialize', data: [["-kws", "commands.txt"], ["-dict", "dictionary.dict"]]},
                function () {
                if (recorder)
                        recorder.consumers = [recognizer];
                        feedWords(wordList);
                });
        };
// When the page is loaded, we spawn a new recognizer worker and call getUserMedia to
// request access to the microphone
//window.onload = function() {
        function startSphinx() {
        outputContainer = document.getElementById("voice-command");
                updateStatus("Initializing web audio and speech recognizer, waiting for approval to access the microphone");
                callbackManager = new CallbackManager();
                spawnWorker("js/sphinx/recognizer.js", function (worker) {
                // This is the onmessage function, once the worker is fully loaded
                worker.onmessage = function (e) {
                // This is the case when we have a callback id to be called
                if (e.data.hasOwnProperty('id')) {
                var clb = callbackManager.get(e.data['id']);
                        var data = {};
                        if (e.data.hasOwnProperty('data'))
                        data = e.data.data;
                        if (clb)
                        clb(data);
                }
                // This is a case when the recognizer has a new hypothesis
                if (e.data.hasOwnProperty('hyp')) {
                var newHyp = e.data.hyp;
                        if (e.data.hasOwnProperty('final') && e.data.final)
                        newHyp = "Final: " + newHyp;
                        updateHyp(newHyp);
                }
                // This is the case when we have an error
                if (e.data.hasOwnProperty('status') && (e.data.status == "error")) {
                updateStatus("Error in " + e.data.command + " with code " + e.data.code);
                        console.debug(e.data.code);
                        console.debug(e.data);
                }
                };
                        // Once the worker is fully loaded, we can call the initialize function
                        // but before that we lazy-load two files for keyword spoting (key phrase
                        // file plus associated dictionary.

//      postRecognizerJob({command: 'lazyLoad',
//                         data: {folders: [], files: [["/", "kws.txt", appRoot + "/kws.txt"],
//                                                     ["/", "kws.dict", appRoot + "/kws.dict"]]}
//                        }, initRecognizer);
                        postRecognizerJob({command: 'lazyLoad',
                                data: {folders: [], files: [["/", "commands.txt", appRoot + "/sphinxCommands/commands.txt"],
                                ["/", "dictionary.dict", appRoot + "/sphinxCommands/dictionary.dict"]]}
                        }, initRecognizer);
                });
                // The following is to initialize Web Audio
                try {
                window.AudioContext = window.AudioContext || window.webkitAudioContext;
                        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
                        window.URL = window.URL || window.webkitURL;
                        audioContext = new AudioContext();
                } catch (e) {
        updateStatus("Error initializing Web Audio browser");
        }
        if (navigator.getUserMedia)
                navigator.getUserMedia({audio: true}, startUserMedia, function (e) {
                updateStatus("No live audio input in this browser");
                });
                else
                updateStatus("No web audio support in this browser");
        }
;
// This is the list of words that need to be added to the recognizer
// This follows the CMU dictionary format
        var wordList = [
        ["ONE", "W AH N"],
        ["TWO", "T UW"],
        ["THREE", "TH R IY"],
        ["FOUR", "F AO R"],
        ["FIVE", "F AY V"],
        ["SIX", "S IH K S"],
        ["SEVEN", "S EH V AH N"],
        ["EIGHT", "EY T"],
        ["NINE", "N AY N"],
        ["ZERO", "Z IH R OW"],
        ["NEW-YORK", "N UW Y AO R K"],
        ["NEW-YORK-CITY", "N UW Y AO R K S IH T IY"],
        ["PARIS", "P AE R IH S"],
        ["PARIS(2)", "P EH R IH S"],
        ["SHANGHAI", "SH AE NG HH AY"],
        ["SAN-FRANCISCO", "S AE N F R AE N S IH S K OW"],
        ["LONDON", "L AH N D AH N"],
        ["BERLIN", "B ER L IH N"],
        ["SUCKS", "S AH K S"],
        ["ROCKS", "R AA K S"],
        ["IS", "IH Z"],
        ["NOT", "N AA T"],
        ["GOOD", "G IH D"],
        ["GOOD(2)", "G UH D"],
        ["GREAT", "G R EY T"],
        ["WINDOWS", "W IH N D OW Z"],
        ["LINUX", "L IH N AH K S"],
        ["UNIX", "Y UW N IH K S"],
        ["MAC", "M AE K"],
        ["AND", "AE N D"],
        ["AND(2)", "AH N D"],
        ["O", "OW"],
        ["S", "EH S"],
        ["X", "EH K S"],
        ["HELLO", "HH AH L OW"],
        ["HELLO(1)", "HH EH L OW"],
        ["THERE", "DH EH R"],
        ["OPEN", "OW P AH N"],
        ["ARTICLE", "AA R T AH K AH L"],
        ["ARTICLE(1)", "AA R T IH K AH L"],
        ["NEWS", "N UW Z"],
        ["NEWS(1)", "N Y UW Z"],
        ["NUMBER", "N AH M B ER"],
        ["START", "S T AA R T"],
        ["STOP", "S T AA P"],
        ["SHUT", "SH AH T"],
        ["UP", "AH P"]
        ];
        var wordList = [];
        var grammarCommands =
{numStates: 1, start: 0, end: 0, transitions: [
{from: 0, to: 0, word: "HELLO"},
{from: 0, to: 0, word: "THERE"},
{from: 0, to: 0, word: "OPEN"},
{from: 0, to: 0, word: "ARTICLE"},
{from: 0, to: 0, word: "NEWS"},
{from: 0, to: 0, word: "NUMBER"},
{from: 0, to: 0, word: "START"},
{from: 0, to: 0, word: "STOP"},
{from: 0, to: 0, word: "SHUT"},
{from: 0, to: 0, word: "UP"},
{from: 0, to: 0, word: "ONE"},
{from: 0, to: 0, word: "TWO"},
{from: 0, to: 0, word: "THREE"}
]};
// This grammar recognizes digits
        var grammarDigits =
{numStates: 1, start: 0, end: 0, transitions: [
{from: 0, to: 0, word: "ONE"},
{from: 0, to: 0, word: "TWO"},
{from: 0, to: 0, word: "THREE"},
{from: 0, to: 0, word: "FOUR"},
{from: 0, to: 0, word: "FIVE"},
{from: 0, to: 0, word: "SIX"},
{from: 0, to: 0, word: "SEVEN"},
{from: 0, to: 0, word: "EIGHT"},
{from: 0, to: 0, word: "NINE"},
{from: 0, to: 0, word: "ZERO"}
]};
// This grammar recognizes a few cities names
        var grammarCities =
{numStates: 1, start: 0, end: 0, transitions: [
{from: 0, to: 0, word: "NEW-YORK"},
{from: 0, to: 0, word: "NEW-YORK-CITY"},
{from: 0, to: 0, word: "PARIS"},
{from: 0, to: 0, word: "SHANGHAI"},
{from: 0, to: 0, word: "SAN-FRANCISCO"},
{from: 0, to: 0, word: "LONDON"},
{from: 0, to: 0, word: "BERLIN"}]};
// This is to play with beloved or belated OSes
        var grammarOses =
{numStates: 7, start: 0, end: 6, transitions: [
{from: 0, to: 1, word: "WINDOWS"},
{from: 0, to: 1, word: "LINUX"},
{from: 0, to: 1, word: "UNIX"},
{from: 1, to: 2, word: "IS"},
{from: 2, to: 2, word: "NOT"},
{from: 2, to: 6, word: "GOOD"},
{from: 2, to: 6, word: "GREAT"},
{from: 1, to: 6, word: "ROCKS"},
{from: 1, to: 6, word: "SUCKS"},
{from: 0, to: 4, word: "MAC"},
{from: 4, to: 5, word: "O"},
{from: 5, to: 3, word: "S"},
{from: 3, to: 1, word: "X"},
{from: 6, to: 0, word: "AND"}]};
        var grammars =
[
//            {title: "OSes", g: grammarOses}, 
//            {title: "Digits", g: grammarDigits}, 
//            {title: "Cities", g: grammarCities},
//            {title: "Base Commands", g: grammarCommands}
];
        var grammarIds = [];
        /*
         var session = {
         audio: true,
         video: false
         };
         var recordRTC = null;
         navigator.getUserMedia(session, initializeRecorder, onError);
         
         function initializeRecorder(stream) {
         var audioContext = window.AudioContext;
         var context = new audioContext();
         var audioInput = context.createMediaStreamSource(stream);
         var bufferSize = 2048;
         // create a javascript node
         var recorder = context.createJavaScriptNode(bufferSize, 1, 1);
         // specify the processing function
         recorder.onaudioprocess = recorderProcess;
         // connect stream to our recorder
         audioInput.connect(recorder);
         // connect our recorder to the previous destination
         recorder.connect(context.destination);
         }
         function recorderProcess(e) {
         var left = e.inputBuffer.getChannelData(0);
         }
         */
                function listenGoogle(){
                console.debug('Listen-1');
                        const record = require('node-record-lpcm16');
                        // Imports the Google Cloud client library
                        const Speech = require('@google-cloud/speech')({
                projectId: 'reflexo',
                        keyFilename: 'D:\client_secret.json'
                });
                        console.debug('Listen-1.5');
                        // Instantiates a client
                        const speech = Speech();
// The encoding of the audio file, e.g. 'LINEAR16'
                        const encoding = 'LINEAR16';
// The sample rate of the audio file in hertz, e.g. 16000
                        const sampleRateHertz = 16000;
// The BCP-47 language code to use, e.g. 'en-US'
                        const languageCode = 'en-US';
                        console.debug('Listen-2')
                        const request = {
                        config: {
                        encoding: encoding,
                                sampleRateHertz: sampleRateHertz,
                                languageCode: languageCode
                        },
                                interimResults: true // If you want interim results, set this to true
                        };
                        console.debug('Listen-3')
// Create a recognize stream
                        const recognizeStream = speech.createRecognizeStream(request)
                        .on('error', function(e){
                        console.debug(e);
                        })
                        .on('data', function(e){
                        console.debug(e);
                        });
                        console.debug('to record')
// Start recording and send the microphone input to the Speech API
                        record
                        .start({
                        sampleRateHertz: sampleRateHertz,
                                threshold: 0,
                                // Other options, see https://www.npmjs.com/package/node-record-lpcm16#options
                                verbose: true,
                                recordProgram: 'sox', // Try also "arecord" or "sox"
                                silence: '100.0'
                        })
                        .on('error', function(e){
                        console.debug(e);
                        })
                        .pipe(recognizeStream);
                        console.log('Listening, press Ctrl+C to stop.');
                        }
                        
function startSpeakable(){
    setVoiceStatus('initializing');
    var Speakable = require('speakable');
    var API_KEY = process.env.GOOGLE_API_KEY;
    // Setup google speech
    var speakable = new Speakable({key: API_KEY}, {lang:'en-US', threshold:0.9, sox_path:'C:/Program Files (x86)/sox-14-4-1/sox'});
    speakable.on('speechStart', function() {
        console.log('onSpeechStart');
        setVoiceStatus('ready');
    });
    speakable.on('speechStop', function() {
        console.log('onSpeechStop');
        speakable.recordVoice();
    });
    speakable.on('speechReady', function() {
        console.log('onSpeechReady');
        
    });
    speakable.on('error', function(err) {
        console.log('onError:');
        console.log(err);
        setVoiceStatus('error');
//        speakable.recordVoice();
    });
    speakable.on('speechResult', function(spokenWords) {
        console.log('onSpeechResult:')
        console.log(spokenWords);
        voice(spokenWords);
    });
    speakable.recordVoice();
}
