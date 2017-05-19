var leapjs = require('leapjs');
var controller = new leapjs.Controller({enableGestures: true});

var calibration = {};
var configuration = {activeDistance: 50};
var fingersActive = {
        l1: false,
        l2: false,
        l3: false,
        l4: false,
        l5: false,
        r1: false,
        r2: false,
        r3: false,
        r4: false,
        r5: false
    };
    
    var TestFrame;
    var leapDebug; 
    var gestureDebug;
    var fingersDebug;
    
function initLeap() {
    
    leapDebug = new debugFrame('Leap');
    gestureDebug = new debugFrame('Gestures');
    fingersDebug = new debugFrame('Fingers');
    
    var doOutput = true;
    //    calibrateScreen({x:-200,y:400},{x:163,y:364},{x:-178,y:100},{x:179,y:100}, -47);
    calibrateScreen({x: -170, y: 355}, {x: 185, y: 390}, {x: 200, y: 100}, {x: -180, y: 102}, -47);
    
    controller.on('deviceFrame', function (frame) {
//    controller.on('animationFrame', function (frame) {

        if (doOutput) {
            testFrame = frame;
            console.debug(frame);
        }

        // Show debug data
        gestureDebug.setValue('Pinched', isPinched(frame));
        leapDebug.setValue('Frame', frame.timestamp, false);
        if (frame.hands.length > 0) {
            leapDebug.setValue('Hands', frame.hands.length);
            leapDebug.setValue('index', frame.hands[0].fingers[1].stabilizedTipPosition);
            fingersDebug.setValue('1', frame.hands[0].fingers[0].extended);
            fingersDebug.setValue('2', frame.hands[0].fingers[1].extended);
            fingersDebug.setValue('3', frame.hands[0].fingers[2].extended);
            fingersDebug.setValue('4', frame.hands[0].fingers[3].extended);
            fingersDebug.setValue('5', frame.hands[0].fingers[4].extended);
        } else {
            leapDebug.setValue('Hands', 0);
        }

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

        // Active zone events
        for (var i = 0; i < hands.length; i++) {
            if (hands[i].type === 'left') {
                var hand = 'l';
            } else if (hands[i].type === 'right') {
                var hand = 'r';
            }

            for (var j = 0; j < hands[i].fingers.length; j++) {
                finger = hand + (j+1);
//                if (isActiveZone(hands[i].fingers[j].stabilizedTipPosition)){
//                    console.debug(finger,'active');
//                }
                if (isActiveMode(hands[i].fingers[j]) && !fingersActive[finger]) {
                    fingersActive[finger] = true;
                    var point = {x:hands[i].fingers[j].stabilizedTipPosition[0],y:hands[i].fingers[j].stabilizedTipPosition[1]}
                    $(controller).trigger('inActive',[finger,point]);
                }
                else if (!isActiveMode(hands[i].fingers[j]) && fingersActive[finger]){
                    fingersActive[finger] = false;
                    $(controller).trigger('outActive',[finger]);
                }

            }
        }

        doOutput = false;
    });
    controller.on('gesture', function (gesture) {
        gestureDebug.setValue('Gesture', gesture.type);
    });
    $(controller).on('inActive', function (e,finger, point) {
        var aPoint = screen(point);
//        console.debug(finger,point,aPoint)
        gestureDebug.setValue('Zone',finger + ' Active');
        switch (finger) {
            case 'r1':
                $('#right-finger-1').addClass('active-cursor');
                break;
            case 'r2':
//                $(document.elementFromPoint(aPoint.x, aPoint.y)).click();
                leapClick(aPoint);
                gestureDebug.setValue('clickPoint', aPoint.x + ';' + aPoint.y);
                $('#right-finger-2').addClass('active-cursor');
                break;
            case 'r3':
                $('#right-finger-3').addClass('active-cursor');
                break;
            case 'r4':
                $('#right-finger-4').addClass('active-cursor');
                break;
            case 'r5':
                $('#right-finger-5').addClass('active-cursor');
                break;
            case 'l1':
                break;
            case 'l2':
                break;
            case 'l3':
                break;
            case 'l4':
                break;
            case 'l5':
                break;

        }
    });
    $(controller).on('outActive', function (e,finger) {
        gestureDebug.setValue('Zone',finger + ' Inactive');
        switch (finger) {
            case 'r1':
                $('#right-finger-1').removeClass('active-cursor');
                break;
            case 'r2':
                $('#right-finger-2').removeClass('active-cursor');
                break;
            case 'r3':
                $('#right-finger-3').removeClass('active-cursor');
                break;
            case 'r4':
                $('#right-finger-4').removeClass('active-cursor');
                break;
            case 'r5':
                $('#right-finger-5').removeClass('active-cursor');
                break;
            case 'l1':
                break;
            case 'l2':
                break;
            case 'l3':
                break;
            case 'l4':
                break;
            case 'l5':
                break;

        }
    });
}

function getFrame() {
    doOutput = true;
}

function isPinched(frame) {
    return false;
}

function isActiveMode(finger) {
    return finger.stabilizedTipPosition[2] < calibration.screen + configuration.activeDistance && finger.extended;
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
        leapDebug('waiting', waiting);

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
function calibrateScreen(tl, tr, br, bl, screen) {
//    if (edge === undefined) {
//        edge = 5;
//    }

//    console.debug('calibrating');
    calibration.vStart = (bl.y + br.y) / 2;
    calibration.vEnd = (tl.y + tr.y) / 2;
    calibration.vRange = calibration.vEnd - calibration.vStart;
    calibration.hStart = (bl.x + tl.x) / 2;
    calibration.hEnd = (br.x + tr.x) / 2;
    calibration.hRange = calibration.hEnd - calibration.hStart;
    calibration.screen = screen;
//    calibration.sensitivity = (((window.innerHeight - edge) / calibration.vRange) + ((window.innerWidth - edge) / calibration.hRange)) / 2;

    console.debug('Calibration:',calibration);
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
    var x = Math.floor(nPoint.x * window.innerWidth);
    var y = Math.floor(nPoint.y * window.innerHeight);
    return {x: x, y: y};
}

// Click made from leap gesture
function leapClick(point){
    //hide hands to see element beneath;
    hideLeftHand();
    hideRightHand();
    $(document.elementFromPoint(point.x, point.y)).click();
    clickRipple(point);
    showLeftHand();
    showRightHand();
}