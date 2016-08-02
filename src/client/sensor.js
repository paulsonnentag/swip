/* global window */
const MIN_SWIPE_DIST = 5;
const MOTION_TOLERANCE = 15;
const startPoints = {};

function onSwipe (element, callback) {
  element.addEventListener('touchmove', touchMoveHandler);

  element.addEventListener('touchstart', touchStartHandler);

  element.addEventListener('touchend', (evt) => touchEndHandler(evt, callback));
}

function touchStartHandler (evt) {
  Array.prototype.slice.apply(evt.changedTouches).forEach((touch) => {
    startPoints[touch.identifier] = {
      x: touch.clientX,
      y: touch.clientY,
    };
  });
}

function touchMoveHandler (evt) {
  evt.preventDefault();
}

function touchEndHandler (evt, callback) {
  Array.prototype.slice.apply(evt.changedTouches).forEach((touch) => {
    const start = startPoints[touch.identifier];
    const end = {
      x: touch.clientX,
      y: touch.clientY,
    };

    const diffX = Math.abs(end.x - start.x);
    const diffY = Math.abs(end.y - start.y);

    const vertBorder = window.innerHeight / 10;
    const horBorder = window.innerWidth / 10;

    if (diffX > diffY && diffX > MIN_SWIPE_DIST) {
      if (end.x < start.x && end.x <= horBorder) {
        callback({ direction: 'LEFT', position: { x: end.x, y: end.y } });
      } else if (end.x > start.x && end.x >= window.innerWidth - horBorder) {
        callback({ direction: 'RIGHT', position: { x: end.x, y: end.y } });
      }
    } else if (diffY > diffX && diffY > MIN_SWIPE_DIST) {
      if (end.y < start.y && end.y <= vertBorder) {
        callback({ direction: 'UP', position: { x: end.x, y: end.y } });
      } else if (end.y > start.y && end.y >= window.innerHeight - vertBorder) {
        callback({ direction: 'DOWN', position: { x: end.x, y: end.y } });
      }
    }
  });
}

function onMotion (callback) {
  window.addEventListener('devicemotion', (evt) => {
    const x = evt.acceleration.x;
    const y = evt.acceleration.y;
    const z = evt.acceleration.z;

    const max = Math.max(z, x, y);

    if (max > MOTION_TOLERANCE) {
      callback();
    }
  });
}

module.exports = {
  onSwipe,
  onMotion,
};
