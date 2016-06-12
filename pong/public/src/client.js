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
  var COLOR1 = "#ffb428";
  var COLOR2 = "#38a6f4";
  var COLOR_JOINED = "#666666";
  //var COLOR_PADDLE = "#4fe916";
  var COLOR_BALL = "#fb2534";
  var backgroundColor = (ratio === 2) ? COLOR1 : COLOR2;
  var width = canvas.width * (ratio/2);
  var height = canvas.height * (ratio/2);
  var paddleY = height / 2;

  var ball = null;
  var PADDLE_HEIGHT = 75;
  var PADDLE_WIDTH = 20;
  var BALL_WIDTH = 20;

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

  socket.on('ball', function (data) {
    ball = data;
  });

  socket.on('connect', function () {
    console.log('connected');
  });

  function loop (timestamp) {
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "white";
    ctx.scale(2/ratio, 2/ratio);

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    ctx.stroke();

    if(mergeAnimation) {

      ctx.fillStyle = COLOR_JOINED;
      circleOriginX = (side === "RIGHT") ? 0 : width;

      if(circleRadius <= 1.5 * width && mergeAnimationOut) {
        ctx.beginPath();
        ctx.arc(circleOriginX, height / 2, circleRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        circleRadius += mergeAnimationSpeed;

      } else if(circleRadius >= 0 && !mergeAnimationOut) {
        ctx.beginPath();
        ctx.arc(circleOriginX, height / 2, circleRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        circleRadius -= mergeAnimationSpeed;

      } else if(circleRadius >= (1.5 * width)) {
        backgroundColor = COLOR_JOINED;
        mergeAnimation = false;

      } else if(circleRadius < 0) {
        mergeAnimation = false;
      }

    }


    if (ball && joined) {

      ctx.fillStyle = (ratio === 2) ? COLOR1 : COLOR2;;

      if (side === 'LEFT') {
        ctx.beginPath()
        ctx.rect(PADDLE_WIDTH, paddleY - (PADDLE_HEIGHT / 2), PADDLE_WIDTH, PADDLE_HEIGHT);
        ctx.fill();
        ctx.stroke();

      } else {
        ctx.beginPath();
        ctx.rect(width - (PADDLE_WIDTH * 2), paddleY - (PADDLE_HEIGHT / 2), PADDLE_WIDTH, PADDLE_HEIGHT);
        ctx.stroke();
        ctx.fill();
      }

      ctx.translate(-transform.x, -transform.y);

      ctx.fillStyle = COLOR_BALL;

      // ball
      ctx.beginPath();
      ctx.rect(ball.x - (BALL_WIDTH/2), ball.y - (BALL_WIDTH/2), BALL_WIDTH, BALL_WIDTH);
      ctx.stroke();
      ctx.fill();
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
    paddleY = clamp(PADDLE_HEIGHT/2, height - (PADDLE_HEIGHT/2),  evt.changedTouches[0].clientY * (ratio/2));

    console.log(joined);

    if (joined) {
      socket.emit('movePaddle', paddleY);
    }
  });

  swip.gestures.onMove(function (callback) {

    if (joined) {
      socket.emit('unjoin');
      joined = false;
    }

  });

  requestAnimationFrame(loop);


}(window.swip || (window.swip = {})));