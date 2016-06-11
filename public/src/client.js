(function (exports) {
  'use strict';

  var socket = io('http://' + location.host);

  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  var transform = {x: 0, y: 0, rotate: 0};

  var width = canvas.width = window.innerWidth;
  var height = canvas.height = window.innerHeight;

  socket.emit('resize', {width: width, height: height});

  swip.gestures.onSwipe(canvas, function (direction, position) {

    console.log(direction, position);

    socket.emit('swipe', {direction: direction, position: position});
  });

  socket.on('joined', function (data) {
    transform = data.transform;
  });

  socket.on('connect', function () {
    console.log('connected');
  });


  function loop (timestamp) {

    ctx.save();
    ctx.fillStyle = 'red';
    ctx.clearRect(0, 0, width, height);
    ctx.translate(-transform.x, -transform.y);


    var image = document.getElementById('image');

    ctx.drawImage(image, -200, -200);



    ctx.restore();


    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);

}(window.swip || (window.swip = {})));