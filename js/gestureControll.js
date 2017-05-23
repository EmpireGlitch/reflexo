var leapjs = require('leapjs');
var controller = new leapjs.Controller({enableGestures: true});

var calibration = {};
var configuration = {activeDistance: 50, pinchDistance: 20, tapTime: 2000, downSwipeSize: 0.5};
var fingersExtended = {
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

var focusElement;
var tapTimer;
var tapTimeout;

var leapTapTimer = 0;

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
        gestureDebug.setValue('twoFingers', twoFingers());

        leapDebug.setValue('Frame', frame.timestamp, false);
        if (frame.hands.length > 0) {
            leapDebug.setValue('Hands', frame.hands.length);
            leapDebug.setValue('index', frame.hands[0].fingers[1].stabilizedTipPosition);
            fingersDebug.setValue('1', frame.hands[0].fingers[0].extended);
            fingersDebug.setValue('2', frame.hands[0].fingers[1].extended);
            fingersDebug.setValue('3', frame.hands[0].fingers[2].extended);
            fingersDebug.setValue('4', frame.hands[0].fingers[3].extended);
            fingersDebug.setValue('5', frame.hands[0].fingers[4].extended);
            gestureDebug.setValue('PDistance', fingerDistance(frame.hands[0].fingers[0].stabilizedTipPosition, frame.hands[0].fingers[1].stabilizedTipPosition));
        } else {
            leapDebug.setValue('Hands', 0);
        }

        // Show hand cursors if hand is detected
        var hands = frame.hands;
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
                finger = hand + (j + 1);
//                if (isActiveZone(hands[i].fingers[j].stabilizedTipPosition)){
//                    console.debug(finger,'active');
//                }
                if (isActiveMode(hands[i].fingers[j]) && !fingersExtended[finger]) {
                    fingersExtended[finger] = true;
                    var point = {x: hands[i].fingers[j].stabilizedTipPosition[0], y: hands[i].fingers[j].stabilizedTipPosition[1]}
                    $(controller).trigger('inActive', [finger, point]);
                } else if (!isActiveMode(hands[i].fingers[j]) && fingersExtended[finger]) {
                    fingersExtended[finger] = false;
                    $(controller).trigger('outActive', [finger]);
                }

            }
        }

        // If finger above element for set time, tap it
        if (fingersActive.r2) {
            var hands = frame.hands;
            var point = {x: hands[0].fingers[1].stabilizedTipPosition[0], y: hands[0].fingers[1].stabilizedTipPosition[1]};
            var aPoint = screen(point);
            var currentHoverElement = getElementFromPoint(aPoint);
            
            if (currentHoverElement !== focusElement) {
                if (tapTimeout !== undefined) {
//                    console.debug('timer destroyed::', focusElement, '!=', currentHoverElement);
                    clearTimeout(tapTimeout);
                    tapTimeout = undefined;
//                    focusElement = currentHoverElement;
                } else if (tapTimeout === undefined) {
                    focusElement = currentHoverElement;
//                    console.debug('timer started');
                    tapTimeout = setTimeout(function () {
                        $(controller).trigger('leapTap', [finger, point]);
                    },configuration.tapTime);
                }
            }
        } else if (!fingersActive.r2 && tapTimeout !== undefined) {
            clearTimeout(tapTimeout);
            tapTimeout = undefined;
//            console.debug('timer destroyed');
        }

        doOutput = false;
    }); //Controller frame ends

    controller.on('gesture', function (gesture) {
        gestureDebug.setValue('Gesture', gesture.type);
        // Detect downSwipe
        if (gesture.type === 'swipe' && gesture.state === 'stop') {
            // get sistance and angle
            var normalDistance = (gesture.startPosition[1] - gesture.position[0]) / calibration.vRange;
            gestureDebug.setValue('swipe length', gesture.startPosition[1] - gesture.position[0]);
            gestureDebug.setValue('swipe normal', normalDistance);


        }
//        console.debug(gesture);
    });

    $(controller).on('leapTap', function (e, finger, point) {
        var aPoint = screen(point);
        leapClick(aPoint);
        gestureDebug.setValue('clickPoint', aPoint.x + ';' + aPoint.y);
    });

    $(controller).on('inActive', function (e, finger, point) {
        gestureDebug.setValue('Zone', finger + ' Active');
        fingersActive[finger] = true;
        switch (finger) {
            case 'r1':
                $('#right-finger-1').addClass('active-cursor');
                break;
            case 'r2':
                focusElement = getElementFromPoint(point);;
                var aPoint = screen(point);
//                leapClick(aPoint);
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
    $(controller).on('outActive', function (e, finger) {
        gestureDebug.setValue('Zone', finger + ' Inactive');
        fingersActive[finger] = false;
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

    $(controller).on('downSwipe', function () {
        // Close all popups        
    });
}

function getFrame() {
    doOutput = true;
}

function isPinched(frame) {
    // Calculate distance between index and thumb
    if (frame.hands[0] !== undefined) {
        var distance = fingerDistance(frame.hands[0].fingers[0].stabilizedTipPosition, frame.hands[0].fingers[1].stabilizedTipPosition);
        if (distance < configuration.pinchDistance) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

function twoFingers() {
    // Are index and middle fingers extended
    return fingersExtended.r2 && fingersExtended.r3;
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

    console.debug('Calibration:', calibration);
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
function leapClick(point) {
    $(getElementFromPoint(point)).click();
    gestureDebug.setValue('clickPoint', point.x + ';' + point.y);
    clickRipple(point);
}

// Calculate distance between two fingrtips
function fingerDistance(finger1, finger2) {
    var delta = [];
    delta.push(finger1[0] - finger2[0]);
    delta.push(finger1[1] - finger2[1]);
    delta.push(finger1[2] - finger2[2]);

    return Math.sqrt(Math.pow(delta[0], 2) + Math.pow(delta[1], 2) + Math.pow(delta[2], 2));

}

// Check if element is tapable/ allowed to click on
function isTapable(element) {
    return element.tagName === 'H3' || element.hasClass('tapable') || element.tagName === 'A';
}

// get topmost element at coordinates that is not leap cursor
function getElementFromPoint(point) {
    var elements = document.elementsFromPoint(point.x, point.y);
    for (var i = 0; i < elements.length; i++){
        if (!$(elements[i]).parent().hasClass('cursor-hand')){
            return elements[i];
        }
    }
}