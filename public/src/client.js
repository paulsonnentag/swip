(function (exports) {
  'use strict';

  var socket = io('http://' + location.host);

  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  var timeOffset = 0;
  var transform = {x: 0, y: 0, rotate: 0};

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  var ratio = +location.hash.slice(1) || devicePixelRatio;
  var width = canvas.width * (ratio/2);
  var height = canvas.height * (ratio/2);

  socket.emit('resize', {width: width, height: height});

  swip.gestures.onSwipe(canvas, function (direction, position) {

    socket.emit('swipe', {
      direction: direction,
      position: {
        x: position.x * (ratio/2),
        y: position.y * (ratio/2)
      }
    });
  });

  socket.on('joined', function (data) {
    transform = data.transform;
  });

  socket.on('time', function (data) {
    timeOffset =  data.timestamp - Date.now();
  });

  socket.on('connect', function () {
    console.log('connected');
  });


  function loop (timestamp) {
    var t = timestamp + timeOffset;

    ctx.save();
    ctx.fillStyle = 'red';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(2/ratio, 2/ratio);
    ctx.translate(-transform.x, -transform.y);

    var image = document.getElementById('image');

    ctx.drawImage(image, 100 * Math.sin(t/1000), 0);
    ctx.restore();

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);

}(window.swip || (window.swip = {})));