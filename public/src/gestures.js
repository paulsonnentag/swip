(function (exports) {

  var gestures = exports.gestures = {};

  var MIN_DISTANCE = 50;

  gestures.onSwipe = function (el, callback) {
    var startPoints = {};

    el.addEventListener('touchstart', function (evt) {
      var i, touch;
      for (i = 0; i < evt.changedTouches.length; i++) {
        touch = evt.changedTouches[i];
        startPoints[touch.identifier] = {x : touch.clientX, y : touch.clientY};
      }
    });

    el.addEventListener('touchmove', function (evt) {
      evt.preventDefault();
    });

    el.addEventListener('touchend', function (evt) {
      var size = el.getBoundingClientRect();
      var i, touch, start, end, diffX, diffY;

      for (i = 0; i < evt.changedTouches.length; i++) {
        touch = evt.changedTouches[i];

        start = startPoints[touch.identifier];
        end =  {x : touch.clientX, y : touch.clientY};

        diffX = Math.abs(end.x - start.x);
        diffY = Math.abs(end.y - start.y);


        if (diffX > diffY && diffX > MIN_DISTANCE) {

          if (end.x < start.x) {
            callback('LEFT', end);

          } else {
            callback('RIGHT', end);
          }

        } else if (diffY > diffX && diffY > MIN_DISTANCE) {

          if (end.y < start.y) {
            callback('TOP', end);

          } else {
            callback('BOTTOM', end);
          }
        }
      }
    });

    el.addEventListener('touchcancel', function () {
      console.log('cancel this');

      var i, touch;
      for (i = 0; i < evt.changedTouches.length; i++) {
        touch = evt.changedTouches[i];
        startPoints[touch.identifier] = {x : touch.clientX, y : touch.clientY};
      }
    });

  };

  gestures.onMove = function (callback) {
    window.addEventListener('devicemotion', function (evt) {

      var x = evt.acceleration.x;
      var y = evt.acceleration.y;
      var z = evt.acceleration.z;

      var max = Math.max(z, Math.max(x, y));

      if (max > 1.5) {
        callback();
      }
    });
  };

}(window.swip || (window.swip = {})));
