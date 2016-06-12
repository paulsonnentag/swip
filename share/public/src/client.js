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
  var images;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  var side = null;
  var ratio = location.hash.slice(1) || devicePixelRatio;
  var COLOR1 = "yellow";
  var COLOR2 = "green";
  var COLOR_JOINED = "blue";
  var backgroundColor = (ratio === 2) ? COLOR1 : COLOR2;
  var width = canvas.width * (ratio / 2);
  var height = canvas.height * (ratio / 2);


  socket.emit('resize', {width: width, height: height});

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
    backgroundColor = (ratio === 2) ? COLOR1 : COLOR2;
  });

  var prevUpdateTimestamp = Date.now();

  socket.on('connect', function () {
    console.log('connected');
  });

  //socket.on('imagesAdded',
  (function (data) {

    images = [{x: 0, y: 0}] //data.images;
    var image;

    document.getElementById('images').innerHTML = '';

    console.log(images.length);

    for (var i = 0; i < images.length; i++) {
      image = images[i];

      document.getElementById('images').innerHTML +=
        '<div class="image" style="transform: ' + getTranslate(image) + '" data-id="' + i + '">'
    }

  }());

  function getTranslate (image) {
    return 'translate(' + (transform.x + image.x) * (2 / ratio) + 'px,  ' + (transform.y + image.y) * (2 / ratio) + 'px)';
  }

  $('.images')
    .on('touchmove', '.image', function (evt) {
      var $el = $(this);
      var image = images[$(this).data('id')];
      var x = evt.changedTouches[0].clientX * (ratio / 2);
      var y = evt.changedTouches[0].clientY * (ratio / 2);

      console.log(x, y);

      image.prev = {
        x: x,
        y: y
      };

      image.x = x;
      image.y = y;


      $el.css({
        'transform': getTranslate(image)
      });


      evt.preventDefault();
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