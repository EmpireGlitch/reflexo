var leapjs = require('leapjs');
var controller = new leapjs.Controller({enableGestures: true});

var calibration = {};
var configuration = {activeDistance: 50, pinchDistance: 25, tapTime: 2000, downSwipeSize: 0.5};
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

// Debug leapframe
var TestFrame;
// Debug frames on page
var leapDebug;
var gestureDebug;
var fingersDebug;

var currentTwoFingers;

// for leap tapping elements
var focusElement;
var tapTimeout;

// for 2 finger scrolling
var scrollStart;
var articleScrollStart;

// For pinching object
var pinchedFrame;
var currentPinched;
var pinchPointStart;
var pinchFrameStart;


function initLeap() {

    leapDebug = new debugFrame('Leap');
    gestureDebug = new debugFrame('Gestures');
    fingersDebug = new debugFrame('Fingers');

    currentTwoFingers = false;

    // Add hand/finger cursors to html
    var cursorsHtml = '<div class="cursor-hand" id="right-hand">'+
            '<div class="cursor-finger" id="right-finger-1"></div>'+
            '<div class="cursor-finger" id="right-finger-2"></div>'+
            '<div class="cursor-finger" id="right-finger-3"></div>'+
            '<div class="cursor-finger" id="right-finger-4"></div>'+
            '<div class="cursor-finger" id="right-finger-5"></div>'+
        '</div>'+
        '<div class="cursor-hand" id="left-hand">'+
            '<div class="cursor-finger" id="left-finger-1"></div>'+
            '<div class="cursor-finger" id="left-finger-2"></div>'+
            '<div class="cursor-finger" id="left-finger-3"></div>'+
            '<div class="cursor-finger" id="left-finger-4"></div>'+
            '<div class="cursor-finger" id="left-finger-5"></div>'+
        '</div>';
    $('body').append($(cursorsHtml));


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

        // Active zone events, extended fingers
        for (var i = 0; i < hands.length; i++) {
            if (hands[i].type === 'left') {
                var hand = 'l';
            } else if (hands[i].type === 'right') {
                var hand = 'r';
            }

            for (var j = 0; j < hands[i].fingers.length; j++) {
                finger = hand + (j + 1);
                //extendd fingers
                fingersExtended[finger] = frame.hands[i].fingers[j].extended;

                if (isActiveMode(hands[i].fingers[j]) && fingersExtended[finger] && !fingersActive[finger]) {
//                    fingersExtended[finger] = true;
                    var point = {x: hands[i].fingers[j].stabilizedTipPosition[0], y: hands[i].fingers[j].stabilizedTipPosition[1]};
                    $(controller).trigger('inActive', [finger, point]);
                } else if ((!isActiveMode(hands[i].fingers[j]) || !fingersExtended[finger]) && fingersActive[finger]) {
//                    fingersExtended[finger] = false;
                    $(controller).trigger('outActive', [finger]);
                }

            }
        }

        // If finger above element for set time, tap it
        if (fingersActive.r2) {
            if (frame.hands[0] !== undefined) {
                var hands = frame.hands;
                var point = {x: hands[0].fingers[1].stabilizedTipPosition[0], y: hands[0].fingers[1].stabilizedTipPosition[1]};
                var aPoint = screen(point);
                var currentHoverElement = getElementFromPoint(aPoint);

                if (currentHoverElement !== focusElement) {
                    if (tapTimeout !== undefined) {
//                    console.debug('timer destroyed::', focusElement, '!=', currentHoverElement);
                        clearTimeout(tapTimeout);
                        tapTimeout = undefined;
                    } else if (tapTimeout === undefined) {
                        focusElement = currentHoverElement;
//                    console.debug('timer started',focusElement);
                        tapTimeout = setTimeout(function () {
                            $(controller).trigger('leapTap', [finger, point]);
                        }, configuration.tapTime);
                    }
                }
            }
        } else if (!fingersActive.r2 && tapTimeout !== undefined) {
            clearTimeout(tapTimeout);
            tapTimeout = undefined;
            focusElement = undefined;
//            console.debug('timer destroyed');
        } else {
            focusElement = undefined;
        }

        //Trigger startTwoFingers
        if (twoFingers() !== currentTwoFingers) {
            if (twoFingers()) {
                $(controller).trigger('startTwoFingers', [frame]);
            } else {
                currentTwoFingers = false;
            }
        }

        //Scroll article
        if (twoFingers() && $('#news-wrap').children().length !== 0) {
            if (frame.hands[0] !== undefined) {
                var point = {x: frame.hands[0].fingers[1].stabilizedTipPosition[0], y: frame.hands[0].fingers[1].stabilizedTipPosition[1]};
                var aPoint = screen(point);
                var currentPos = aPoint.y;
                var scrollDistance = currentPos - scrollStart;
//            console.debug(articleScrollStart,currentPos,scrollStart,scrollDistance);
                $('#news-wrap').scrollTop(articleScrollStart - scrollDistance);
            }
        }

        //Trigger startPinch
        if (isPinched(frame) !== currentPinched) {
            if (isPinched(frame)) {
                $(controller).trigger('startPinch', [frame]);
            } else {
                currentPinched = false;
                $(controller).trigger('endPinch',[]);
            }
        }

        //Pich frames
        if (isPinched(frame) && pinchedFrame !== undefined) {
            if (pinchedFrame[0] !== undefined && frame.hands[0] !== undefined) {
                var point = {
                    x: (frame.hands[0].fingers[1].stabilizedTipPosition[0] + frame.hands[0].fingers[0].stabilizedTipPosition[0]) / 2,
                    y: (frame.hands[0].fingers[1].stabilizedTipPosition[1] + frame.hands[0].fingers[0].stabilizedTipPosition[1]) / 2
                };
                var aPoint = screen(point);
                var currentPos = {
                    top: pinchFrameStart.top + aPoint.y - pinchPointStart.y,
                    left: pinchFrameStart.left + aPoint.x - pinchPointStart.x
                };
//                console.debug(currentPos);
                pinchedFrame.offset(currentPos);
            }
        }

        doOutput = false;
    }); // Controller frame ends





    controller.on('gesture', function (gesture) {
        gestureDebug.setValue('Gesture', gesture.type);
        // Detect downSwipe
        if (gesture.type === 'swipe' && gesture.state === 'stop') {
            var direction;
            if (gesture.direction[1] < 0) {
                direction = 1;
            } else {
                direction = -1;
            }
            // get distance and angle
            var normalDistance = direction * (gesture.startPosition[1] - gesture.position[0]) / calibration.vRange;
            gestureDebug.setValue('swipe length', gesture.startPosition[1] - gesture.position[0]);
            gestureDebug.setValue('swipe normal', normalDistance);
            if (normalDistance > 0.5 && fingersExtended.r1 && fingersExtended.r2 && fingersExtended.r3 && fingersExtended.r4 && fingersExtended.r5) {
                $(controller).trigger('downSwipe', []);
                console.debug('downSwipe');
            }
//            console.debug(gesture);
        }
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
                var aPoint = screen(point);
                focusElement = getElementFromPoint(aPoint);
                ;
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
        hideOverlay();
    });

    $(controller).on('startTwoFingers', function (e, frame) {
        currentTwoFingers = true;
        console.debug('Two fingers');
        var point = {x: frame.hands[0].fingers[1].stabilizedTipPosition[0], y: frame.hands[0].fingers[1].stabilizedTipPosition[1]};
        var aPoint = screen(point);
        scrollStart = point.y;
        articleScrollStart = $('#news-wrap').scrollTop();
    });

    $(controller).on('stopTwoFingers', function () {

    });

    $(controller).on('startPinch', function (e, frame) {
        currentPinched = true;

        // get middle point between thumb and index
        var point = {
            x: (frame.hands[0].fingers[1].stabilizedTipPosition[0] + frame.hands[0].fingers[0].stabilizedTipPosition[0]) / 2,
            y: (frame.hands[0].fingers[1].stabilizedTipPosition[1] + frame.hands[0].fingers[0].stabilizedTipPosition[1]) / 2
        };
        var aPoint = screen(point);
        pinchedFrame = $(getElementFromPoint(aPoint,'draggable'));
//        console.debug('Pinch', pinchedFrame);
        pinchPointStart = aPoint;
        pinchFrameStart = pinchedFrame.offset();

    });

    $(controller).on('stopPinch', function () {
        console.debug('Stop Pinch');
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
//    return !fingersExtended.r1 && fingersExtended.r2 && fingersExtended.r3 && !fingersExtended.r4 && !fingersExtended.r5;
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
function getElementFromPoint(point, gotClass) {
    var elements = document.elementsFromPoint(point.x, point.y);
    for (var i = 0; i < elements.length; i++) {
        if (!$(elements[i]).parent().hasClass('cursor-hand')) {
            if (gotClass !== undefined) {
                if ($(elements[i]).hasClass(gotClass)){
                    return elements[i];
                }
            } else {
                return elements[i];
            }
        }
    }
}