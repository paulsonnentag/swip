var uid = require('uid');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(3000);

app.use(express.static(__dirname + '/public'));

console.log('started server on http://localhost:3000');

var ALLOWED_DELAY = 50;

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
  var leftLower = leftDevice.transform.y + leftDevice.size.height;
  var rightLower = rightDevice.transform.y + rightDevice.size.height;
  var leftUpper = leftDevice.transform.y;
  var rightUpper = rightDevice.transform.y;

  leftDevice.opening = {
    side: 'RIGHT',
    top: leftUpper < rightUpper ? rightUpper : leftUpper,
    bottom: leftLower < rightLower ? leftLower: rightLower
  };

  rightDevice.opening = {
    side: 'LEFT',
    top: leftUpper < rightUpper ? rightUpper : leftUpper,
    bottom: leftLower < rightLower ? leftLower: rightLower
  };

  var ball = {
    x: leftDevice.transform.x + (leftDevice.size.width / 2),
    y: leftDevice.transform.y + (leftDevice.size.height / 2)
  };


  var interval = setInterval(function () {

    ball.x += 5;

    io.emit('ball', ball);

  }, 100);

  return function () {
    clearInterval(interval);
  };
}