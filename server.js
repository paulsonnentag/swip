var uid = require('uid');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(3000);

app.use(express.static(__dirname + '/public'));

console.log('started server on http://localhost:3000');

var ALLOWED_DELAY = 50;
var BALL_SIZE = 10;

var devices = {};
var swipes = [];

var pongDestructor = function () {};

io.on('connection', function (socket) {
  var id = uid();
  var device = devices[id] = {
    id: id,
    referencedBy: [],
    joined: false,
    transform : {x: 0, y: 0, rotate: 0},
    socket: socket
  };

  socket.on('resize', function (size) {
    console.log('device', size);

    device.size = {
      width: size.width,
      height: size.height
    };
  });

  socket.on('unjoin', function () {
    device.joined = false;
  });

  socket.on('swipe', function (swipe) {
    var prevSwipe;

    swipes = swipes.filter(function (swipe) {
      return (Date.now() - swipe.timestamp) < 50;
    });

    if (swipes.length === 1) {
      prevSwipe = swipes[0];
      otherDevice = devices[prevSwipe.deviceId];

      if (otherDevice.id !== device.id) {

        if (device.joined) {
          joinToDevice(device, otherDevice, swipe, prevSwipe);

        } else {
          joinToDevice(otherDevice, device, prevSwipe, swipe);
        }

        pongDestructor();

        if (swipe.direction === 'LEFT') {
          pongDestructor = startPong(otherDevice, device);

        } else if (swipe.direction === 'RIGHT') {
          pongDestructor = startPong(device, otherDevice);
        }

      }

    } else {
      swipes.push({
        deviceId: id,
        direction: swipe.direction,
        position: swipe.position,
        timestamp: Date.now()
      });
    }
  });
});

function joinToDevice (origin, other, originSwipe, otherSwipe) {

  switch (originSwipe.direction) {
    case 'TOP':
      other.transform.x = origin.transform.x + (originSwipe.position.x - otherSwipe.position.x);
      other.transform.y = origin.transform.y - other.size.width;
      break;

    case 'BOTTOM':
      other.transform.x = origin.transform.x + (originSwipe.position.x - otherSwipe.position.x);
      other.transform.y = origin.transform.y + origin.size.width;
      break;

    case 'RIGHT':
      other.transform.x = origin.transform.x + origin.size.width;
      other.transform.y = origin.transform.y + (originSwipe.position.y - otherSwipe.position.y);
      break;

    case 'LEFT':
      other.transform.x = origin.transform.x - other.size.width;
      other.transform.y = origin.transform.y + (originSwipe.position.y - otherSwipe.position.y);
      break;
  }

  other.joined = true;
  other.socket.emit('joined', {transform: other.transform});

  if (!origin.joined) {
    origin.socket.emit('joined', {transform: origin.transform});
  }
}

function startPong (leftDevice, rightDevice) {
  var leftDeviceLower = leftDevice.transform.y + leftDevice.size.height;
  var rightDeviceLower = rightDevice.transform.y + rightDevice.size.height;
  var leftDeviceUpper = leftDevice.transform.y;
  var rightDeviceUpper = rightDevice.transform.y;
  var leftDeviceLeft = leftDevice.transform.x;
  var leftDeviceRight = leftDevice.transform.x + leftDevice.size.width;
  var rightDeviceLeft = rightDevice.transform.x;
  var rightDeviceRight = rightDevice.transform.x + rightDevice.size.width;


  var topOpening = leftDeviceUpper < rightDeviceUpper ? rightDeviceUpper : leftDeviceUpper;
  var bottomOpening = leftDeviceLower < rightDeviceLower ? leftDeviceLower: rightDeviceLower;

  var ball = {
    x: leftDevice.transform.x + (leftDevice.size.width / 2),
    y: leftDevice.transform.y + (leftDevice.size.height / 2),
    speedX: 5,
    speedY: 5
  };

  var interval = setInterval(function () {

    // inside left side
    if ((ball.x - BALL_SIZE) < leftDeviceRight &&
      (ball.x + BALL_SIZE) > leftDeviceLeft &&
      (ball.y + BALL_SIZE) > leftDeviceUpper &&
      (ball.y - BALL_SIZE) < leftDeviceLower) {

      ball.x += ball.speedX;
      ball.y += ball.speedY;

      // y
      if ((ball.y + BALL_SIZE) <= leftDeviceUpper) {
        ball.speedY *= -1;
        ball.y = leftDeviceUpper + BALL_SIZE;

      } else if ((ball.y - BALL_SIZE) >= leftDeviceLower) {
        ball.speedY *= -1;
        ball.y = leftDeviceLower - BALL_SIZE;
      }

      // x
      if ((ball.x + BALL_SIZE) <= leftDeviceLeft) {

        // reset ball
        ball.x = rightDeviceLeft + (rightDevice.size.width / 2);
        ball.y = rightDeviceUpper + (rightDevice.size.height / 2);
        ball.speedX = -5;
        ball.speedY = 5;


      } else if ((ball.x - BALL_SIZE) >= leftDeviceRight) {


        if ((ball.y + BALL_SIZE) > topOpening && (ball.y - BALL_SIZE) < bottomOpening) {
          //do nothing


        } else {
          ball.speedX *= -1;
          ball.x = leftDeviceRight - BALL_SIZE;
        }
      }


    // inside right side
    } else {
      ball.x += ball.speedX;
      ball.y += ball.speedY;

      // y
      if ((ball.y + BALL_SIZE) <= rightDeviceUpper) {
        ball.speedY *= -1;
        ball.y = rightDeviceUpper + BALL_SIZE;

      } else if ((ball.y - BALL_SIZE) >= rightDeviceLower) {
        ball.speedY *= -1;
        ball.y = rightDeviceLower - BALL_SIZE;
      }

      // x
      if ((ball.x - BALL_SIZE) >= rightDeviceRight) {

        // reset ball
        ball.x = leftDeviceLeft + (leftDevice.size.width / 2);
        ball.y = leftDeviceUpper + (leftDevice.size.height / 2);
        ball.speedX = 5;
        ball.speedY = 5;


      } else if ((ball.x + BALL_SIZE) <= rightDeviceLeft) {


        if ((ball.y + BALL_SIZE) > topOpening && (ball.y - BALL_SIZE) < bottomOpening) {
          //do nothing

        } else {
          ball.speedX *= -1;
          ball.x = rightDeviceLeft + BALL_SIZE;
        }
      }
    }


    io.emit('ball', ball);

  }, 50);

  return function () {
    clearInterval(interval);
  };
}