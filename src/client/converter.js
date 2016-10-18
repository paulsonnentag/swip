/* global localStorage document screen window */
const SIZE_REFERENCE = 60;

class Converter {
  constructor (screenSize) {
    this.screenSize = screenSize;
    this.scalingFactor = getScalingFactor(screenSize);
  }

  toDevicePixel (value) {
    return value / this.scalingFactor;
  }

  toAbsPixel (value) {
    return value * this.scalingFactor;
  }

  convertClickPos (transform, evt) {
    return {
      position: {
        x: this.toAbsPixel(evt.clientX) + transform.x,
        y: this.toAbsPixel(evt.clientY) + transform.y,
      },
      originalEvent: evt,
    };
  }

  convertTouchPos (transform, evt) {
    const event = {
      position: [],
      originalEvent: evt,
    };

    for (let i = 0; i < evt.changedTouches.length; i++) {
      const currTouched = evt.changedTouches[i];

      event.position.push({
        x: this.toAbsPixel(currTouched.clientX) + transform.x,
        y: this.toAbsPixel(currTouched.clientY) + transform.y,
      });
    }

    return event;
  }
}

function getScalingFactor (screenSize) {
  const diagonalPixel = Math.sqrt(Math.pow(screen.height, 2) + Math.pow(screen.width, 2));
  const diagonalScreenCM = screenSize * 2.54;
  const pixelPerCentimeter = diagonalPixel / diagonalScreenCM;

  return SIZE_REFERENCE / pixelPerCentimeter;
}

export default Converter;
