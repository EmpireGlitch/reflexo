var leapjs = require('leapjs');
var controller = new leapjs.Controller({enableGestures: true});
var doOutput = true;
var TestFrame;
var calibration = {};

var leapDebug = new debugFrame('Leap');
var gestureDebug = new debugFrame('Gestures');

function initLeap() {
//    calibrateScreen({x:-200,y:400},{x:163,y:364},{x:-178,y:100},{x:179,y:100},5);
    calibrateScreen({x: -170, y: 355}, {x: 185, y: 390}, {x: 200, y: 100}, {x: -180, y: 102}, 5);
    controller.on('deviceFrame', function (frame) {
//    controller.on('animationFrame', function (frame) {

        if (doOutput) {
            testFrame = frame;
            console.debug(frame);
        }
        gestureDebug.setValue('Pinched',isPinched(frame));
        
        leapDebug.setValue('Frame',frame.timestamp,false);
        if (frame.hands.length > 0){
            leapDebug.setValue('Hands',frame.hands.length);
            leapDebug.setValue('index',frame.hands[0].fingers[1].stabilizedTipPosition);
        }
        else{
            leapDebug.setValue('Hands',0);
        }
        
        if (frame.valid && frame.gestures.length > 0) {
            frame.gestures.forEach(function (gesture) {
//                console.debug(gesture.type);
            gestureDebug.setValue('Gesture',gesture.type);
        /*
                switch (gesture.type) {
                    case "circle":
                        console.log("Circle Gesture");
                        break;
                    case "keyTap":
                        console.log("Key Tap Gesture");
                        break;
                    case "screenTap":
                        console.log("Screen Tap Gesture");
                        break;
                    case "swipe":
                        console.log("Swipe Gesture");
                        break;
                }
                */
            });
            
        }


        updateLeapDebug(frame);

        var hands = frame.hands;

        // Show hand cursors if hand is detected
        if (hands.length < 2) {
            if (hands.length === 0) {
                hideLeftHand();
                hideRightHand();
            } else if (hands.length === 1) {
                if (hands[0].type === 'left') {
                    showLeftHand();
                    hideRightHand();
                } else {
                    showRightHand();
                    hideLeftHand();
                }
            }
        } else if (hands.length === 2) {
            showRightHand();
            showLeftHand();
        }

        // Set finger and palm cursors
        for (var i = 0; i < hands.length; i++) {
            var hand = hands[i];
            var target = hand.stabilizedPalmPosition;
            setGestureCursor(hand.type, 0, {x: target[0], y: target[1]});
            for (var j = 0; j < hand.fingers.length; j++) {
                var finger = hand.fingers[j];
                var target = finger.stabilizedTipPosition;
                setGestureCursor(hand.type, j + 1, {x: target[0], y: target[1]});
            }
        }

        doOutput = false;
    });
    
    controller.on('gesture',function(gesture){
//        console.debug(gesture);
    });
    
    
    
}

function getFrame() {
    doOutput = true;
}

function isPinched(frame){
    return false;
}

function isActiveCursor(frame){
    
}

function startCalibration() {

    function isStill(frame) {
        return Math.abs(frame.hands[0].fingers[1].tipVelocity[0]) < deviation && Math.abs(frame.hands[0].fingers[1].tipVelocity[1]) < deviation;
    }

    function getCalibration(frame) {
        return frame.hands[0].fingers[1].stabilizedTipPosition;
    }

    var deviation = 10;
    var waitTime = 2000;
    var edge = 5;
    var corner = 1;
    var points = [];
    var waiting = false;
    var havePoints = false;
    $('.calibration-overlay').show();
    controller.on('deviceFrame', function (frame) {
        updateLeapDebug(frame, {waiting: waiting});
        leapDebug('waiting',waiting)
        
        if (corner <= 4) {
            if (frame.hands[0] !== undefined) {
                if (isStill(frame) && !waiting) {
                    //start timer
                    var currentPoints = getCalibration(frame);
                    waiting = true;
                    var timer = setTimeout(function () {
                        points.push(currentPoints);
                        console.debug(points);
                        corner++;
                        waiting = false;
                    }, waitTime);
                } else if (!isStill(frame) && waiting || frame.hands === undefined) {
                    //reset timer
                    console.debug('reset timer');
                    clearTimeout(timer);
                    waiting = false;
                }
            }
        } else {
            console.debug(points);
        }

    });

}

function endCalibration() {
    $('.calibration-overlay').hide();
}

// Calibrate real screen dimensions to onscreen pixels
function calibrateScreen(tl, tr, br, bl, edge) {
    if (edge === undefined) {
        edge = 5;
    }

    console.debug('calibrating');

    calibration.vStart = (bl.y + br.y) / 2;
    calibration.vEnd = (tl.y + tr.y) / 2;
    calibration.vRange = calibration.vEnd - calibration.vStart;

    calibration.hStart = (bl.x + tl.x) / 2;
    calibration.hEnd = (br.x + tr.x) / 2;
    calibration.hRange = calibration.hEnd - calibration.hStart;

    calibration.sensitivity = (((window.innerHeight - edge) / calibration.vRange) + ((window.innerWidth - edge) / calibration.hRange)) / 2;

    console.debug(calibration);

    endCalibration();


}

// Normalize point location in range [0;1]
function normalize(leapPoint) {
    if (calibration.vRange === undefined || calibration.hRange === undefined) {
        console.error('Incomplete calibration');
    }
    var x = (leapPoint.x + (calibration.hRange / 2)) / calibration.hRange;
    var y = 1 - (leapPoint.y - calibration.vStart) / calibration.vRange;

    return {x: x.toFixed(3), y: y.toFixed(3)};
}

// Get coresponding normalized point on screen
function screen(point) {
    nPoint = normalize(point);
    var x = nPoint.x * window.innerWidth;
    var y = nPoint.y * window.innerHeight;

    return {x: x.toFixed(1), y: y.toFixed(1)};
}