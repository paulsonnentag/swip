var uid = require('uid');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(8080);

app.use(express.static(__dirname + '/public'));

console.log('started server on http://localhost:3000');

var ALLOWED_DELAY = 50;

var devices = {};
var swipes = [];
var images = [];

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

    device.ratio = size.ratio;
  });

  socket.on('unjoin', function () {
    device.joined = false;
    io.emit("unjoined", {});
  });

  socket.on('moveImage', function (data) {
    console.log('movedImage', data.id);
    io.emit('imageMoved', data);
  });



  socket.on('swipe', function (swipe) {
    var prevSwipe;

    swipes = swipes.filter(function (swipe) {
      return (Date.now() - swipe.timestamp) < ALLOWED_DELAY;
    });

    if (swipes.length === 1) {
      prevSwipe = swipes[0];
      otherDevice = devices[prevSwipe.deviceId];

      if (otherDevice.id !== device.id) {

        //if (device.joined) {
          joinToDevice(device, otherDevice, swipe, prevSwipe);

        //} else {
          joinToDevice(otherDevice, device, prevSwipe, swipe);
        //}
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
  other.socket.emit('joined', {transform: other.transform, side: originSwipe.direction});

  if (!origin.joined) {
    origin.socket.emit('joined', {transform: origin.transform, side: otherSwipe.direction});
  }

  images = [];

  addImages(origin);
  addImages(other);

}


function addImages(device) {


  for (var x = 0; x < 2; x++) {
    for (var y = 0; y < 2; y++) {
      images.push({
        x: device.transform.x + (90 + (x * 130)) * (device.ratio / 2),
        y: device.transform.y + (90 + (y * 130)) * (device.ratio / 2),
        id:  images.length,
        prev: [null, null],
        speedX: 0,
        speedY: 0
      });
    }
  }

  console.log('images');

  io.emit('imagesAdded', {images: images});
}
