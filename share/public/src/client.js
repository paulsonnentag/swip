(function (exports) {
  'use strict';

  var socket = io('http://' + location.host);

  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  var transform = {x: 0, y: 0, rotate: 0};
  var joined = false;

  var mergeAnimation = false;
  var mergeAnimationOut = false;
  var mergeAnimationSpeed = 25;
  var circleOriginX = 0;
  var circleRadius = 1;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  var side = null;
  var ratio = location.hash.slice(1) || devicePixelRatio;
  var COLOR1 = "yellow";
  var COLOR2 = "green";
  var COLOR_JOINED = "blue";
  var COLOR_PADDLE = "red";
  var backgroundColor = (ratio === 2) ? COLOR1 : COLOR2;
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
    side = data.side;
    transform = data.transform;
    joined = true;
    mergeAnimation = true;
    mergeAnimationOut = true;
  });

  socket.on("unjoined", function (data) {
    mergeAnimation = true;
    mergeAnimationOut = false;
    joined = false;
    backgroundColor = (ratio === 2) ? COLOR1 : COLOR2;
  });

  var prevUpdateTimestamp = Date.now();

  socket.on('connect', function () {
    console.log('connected');
  });

  function loop (timestamp) {
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(2/ratio, 2/ratio);

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    if(mergeAnimation) {

      ctx.fillStyle = COLOR_JOINED;
      circleOriginX = (side === "RIGHT") ? 0 : width;

      if (circleRadius <= 1.5 * width && mergeAnimationOut) {
        ctx.beginPath();
        ctx.arc(circleOriginX, height / 2, circleRadius, 0, 2 * Math.PI);
        ctx.fill();

        circleRadius += mergeAnimationSpeed;

      } else if(circleRadius >= 0 && !mergeAnimationOut) {
        ctx.beginPath();
        ctx.arc(circleOriginX, height / 2, circleRadius, 0, 2 * Math.PI);
        ctx.fill();

        circleRadius -= mergeAnimationSpeed;

      } else if(circleRadius >= (1.5 * width)) {
        backgroundColor = COLOR_JOINED;
        mergeAnimation = false;

      } else if(circleRadius < 0) {
        mergeAnimation = false;
      }

    }


    if (joined) {


      // do here fancy shit

    }

    ctx.restore();

    requestAnimationFrame(loop);
  }

  function clamp (min, max, x) {
    if (x > max) {
      return max;

    } else if (x < min) {
      return min;
    }
    return x;
  }

  swip.gestures.onMove(function (callback) {

    if (joined) {
      socket.emit('unjoin');
      joined = false;
    }

  });

  requestAnimationFrame(loop);


}(window.swip || (window.swip = {})));