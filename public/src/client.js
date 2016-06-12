(function (exports) {
  'use strict';

  var socket = io('http://' + location.host);

  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  var transform = {x: 0, y: 0, rotate: 0};
  var joined = false;

  var mergeAnimation = true;
  var mergeAnimationOut = true;
  var circleRadius = 1;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  var side = null;
  var ratio = location.hash.slice(1) || devicePixelRatio;
  var width = canvas.width * (ratio/2);
  var height = canvas.height * (ratio/2);
  var paddleY = height / 2;

  var ball = null;
  var PADDLE_HEIGHT = 50;

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
  });

  var prevUpdateTimestamp = Date.now();

  socket.on('ball', function (data) {
    ball = data;
  });

  socket.on('connect', function () {
    console.log('connected');
  });

  function loop (timestamp) {
    ctx.save();
    ctx.fillStyle = 'red';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(2/ratio, 2/ratio);


    if(mergeAnimation) {

      ctx.fillStyle = (ratio === 2) ? "blue" : "green";

      if(circleRadius <= 1.5 * width && mergeAnimationOut) {
        ctx.beginPath();
        ctx.arc(width, height / 2, circleRadius, 0, 2 * Math.PI);
        ctx.fill();

        circleRadius += 100;

      } else if(circleRadius >= 0 && !mergeAnimationOut) {
        ctx.beginPath();
        ctx.arc(0, 0, circleRadius, 0, 2 * Math.PI);
        ctx.fill();

        circleRadius -= 100;

      } else if(circleRadius >= (1.5 * width)) {
        ctx.fillStyle = "blue";
        ctx.fillRect(0, 0, width, height);
        mergeAnimation = false;

      } else if(circleRadius < 0) {
        ctx.fillRect(0, 0, width, height);
        mergeAnimation = false;
      }
    }


    if (ball && joined) {

      if (side === 'LEFT') {
        ctx.fillRect(20, paddleY - (PADDLE_HEIGHT / 2), 20, PADDLE_HEIGHT);

      } else {
        ctx.fillRect(width - 40, paddleY - (PADDLE_HEIGHT / 2), 20, PADDLE_HEIGHT);
      }

      ctx.translate(-transform.x, -transform.y);

      // ball
      ctx.fillRect(ball.x - 10, ball.y - 10, 20, 20);

      // paddle
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

  document.addEventListener('touchmove', function (evt) {
    paddleY = clamp(PADDLE_HEIGHT/2, height - (PADDLE_HEIGHT/2),  evt.changedTouches[0].clientY);
  });

  swip.gestures.onMove(function (callback) {

    if (joined) {
      socket.emit('unjoin');
      joined = false;
    }

  });

  requestAnimationFrame(loop);


}(window.swip || (window.swip = {})));