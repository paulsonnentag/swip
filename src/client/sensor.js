/* global window */
const MIN_SWIPE_DIST = 50;
const MOTION_TOLERANCE = 1.5;

function onSwipe (element, callback) {
  const startPoints = {};

  element.addEventListener('touchmove', (evt) => {
    evt.preventDefault();
  });

  element.addEventListener('touchstart', (evt) => {
    evt.changedTouches.forEach((touch) => {
      startPoints[touch.identifier] = {
        x: touch.clientX,
        y: touch.clientY,
      };
    });
  });

  element.addEventListener('touchend', (evt) => {
    evt.changedTouches.forEach((touch) => {
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
          callback('LEFT', end.y);
        } else if (end.x > start.x && end.x >= window.innerWidth - horBorder) {
          callback('RIGHT', end.y);
        }
      } else if (diffY > diffX && diffY > MIN_SWIPE_DIST) {
        if (end.y < start.y && end.y <= vertBorder) {
          callback('UP', end.x);
        } else if (end.y > start.y && end.y >= window.innerHeight - vertBorder) {
          callback('DOWN', end.x);
        }
      }
    });
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
