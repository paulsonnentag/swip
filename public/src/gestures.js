(function (exports) {

  var gestures = exports.gestures = {};

  var THRESHOLD = 10;
  var MIN_DISTANCE = 100;

  console.log();

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

          if (end.x < THRESHOLD) {
            callback('LEFT', end);

          } else if ((end.x + THRESHOLD) > size.width){
            callback('RIGHT', end);
          }


        } else if (diffY > diffX && diffY > MIN_DISTANCE) {

          if (end.y < THRESHOLD) {
            callback('TOP', end);

          } else if ((end.y + THRESHOLD) > size.height){
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

}(window.swip || (window.swip = {})));
