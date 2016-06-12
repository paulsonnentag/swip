(function (exports) {
  'use strict';

  var socket = io('http://' + location.host);

  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  var transform = {x: 0, y: 0, speedX: 0, speedY: 0, rotate: 0};
  var joined = false;

  var mergeAnimation = false;
  var mergeAnimationOut = false;
  var mergeAnimationSpeed = 25;
  var circleOriginX = 0;
  var circleRadius = 1;
  var images = [];

  var DAMPING = 0.9;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  var side = null;
  var ratio = location.hash.slice(1) || devicePixelRatio;
  var COLOR1 = "#ffb428";
  var COLOR2 = "#38a6f4";
  var COLOR_JOINED = "#666666";
  var backgroundColor = (ratio === 2) ? COLOR1 : COLOR2;
  var width = canvas.width * (ratio / 2);
  var height = canvas.height * (ratio / 2);


  socket.emit('resize', {width: width, height: height, ratio: ratio});

  swip.gestures.onSwipe(canvas, function (direction, position) {

    socket.emit('swipe', {
      direction: direction,
      position: {
        x: position.x * (ratio / 2),
        y: position.y * (ratio / 2)
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
    images = [];
    document.getElementBy Id('images').innerHTML = "";

    backgroundColor = (ratio === 2) ? COLOR1 : COLOR2;
  });

  var prevUpdateTimestamp = Date.now();

  socket.on('connect', function () {
    console.log('connected');
  });

  socket.on('imagesAdded', function (data) {

    images = data.images;
    var image;

    document.getElementById('images').innerHTML = '';

    for (var i = 0; i < images.length; i++) {
      image = images[i];

      document.getElementById('images').innerHTML +=
        '<div class=("image" + i % 2) style="transform: ' + getTranslate(image) + '" data-id="' + i + '">'
    }
  });

  function getTranslate (image) {
    return 'translate(' +  (-transform.x + image.x) * (2 / ratio) + 'px,  ' + (-transform.y + image.y) * (2 / ratio) + 'px)';
  }

  $('.images')
    .on('touchmove', '.image', function (evt) {
      var $el = $(this);
      var image = images[$(this).data('id')];
      var x = evt.changedTouches[0].clientX * (ratio / 2);
      var y = evt.changedTouches[0].clientY * (ratio / 2);

      image.speedX = 0;
      image.speedY = 0;

      image.prev.push({
        x: x,
        y: y
      });

      image.prev = image.prev.slice(1);

      image.x = x + transform.x;
      image.y = y + transform.y;


      $el.css({
        'transform': getTranslate(image)
      });

      evt.preventDefault();
    })
    .on('touchend', '.image', function (evt) {
      var $el = $(this);
      var image = images[$(this).data('id')];

      var diffX = image.prev[1].x -image.prev[0].x;
      var diffY = image.prev[1].y -image.prev[0].y;

      image.speedX = diffX;
      image.speedY = diffY;

      socket.emit('moveImage', {
        ratio: ratio,
        id: $el.data('id'),
        speedX: image.speedX,
        speedY: image.speedY,
        x: image.x,
        y: image.y
      });

      $el.css({
        'transform': getTranslate(image)
      });

      evt.preventDefault();
    });


  socket.on('imageMoved', function (data) {

    if (data.ratio !== ratio) {
      images[data.id].speedX = data.speedX;
      images[data.id].speedY = data.speedY;
      images[data.id].x = data.x;
      images[data.id].y = data.y;
    }
  });


  function loop (timestamp) {
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(2 / ratio, 2 / ratio);

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    if (mergeAnimation) {

      ctx.fillStyle = COLOR_JOINED;
      circleOriginX = (side === "RIGHT") ? 0 : width;

      if (circleRadius <= 1.5 * width && mergeAnimationOut) {
        ctx.beginPath();
        ctx.arc(circleOriginX, height / 2, circleRadius, 0, 2 * Math.PI);
        ctx.fill();

        circleRadius += mergeAnimationSpeed;

      } else if (circleRadius >= 0 && !mergeAnimationOut) {
        ctx.beginPath();
        ctx.arc(circleOriginX, height / 2, circleRadius, 0, 2 * Math.PI);
        ctx.fill();

        circleRadius -= mergeAnimationSpeed;

      } else if (circleRadius >= (1.5 * width)) {
        backgroundColor = COLOR_JOINED;
        mergeAnimation = false;

      } else if (circleRadius < 0) {
        mergeAnimation = false;
      }

    }


    if (joined) {
      var image;

      for (var i = 0; i < images.length; i++) {
        image = images[i];

        image.x += image.speedX;
        image.y += image.speedY;

        image.speedX *= DAMPING;
        image.speedY *= DAMPING;

        document.getElementById('images').childNodes[i].style.transform = getTranslate(image);
      }
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