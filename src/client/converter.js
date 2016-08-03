/* global localStorage document screen window */
const SIZE_REFERENCE = 60;

class Converter {
  constructor (screenSize) {
    this.screenSize = screenSize;
    this.scalingFactor = getScalingFactor(screenSize);
  }

  toDevicePixel (x) {
    return x / this.scalingFactor;
  }

  toAbsPixel (x) {
    return x * this.scalingFactor;
  }
}

function getScalingFactor (screenSize) {
  const diagonalPixel = Math.sqrt(Math.pow(screen.height, 2) + Math.pow(screen.width, 2));
  const diagonalScreenCM = screenSize * 2.54;
  const pixelPerCentimeter = diagonalPixel / diagonalScreenCM;

  return SIZE_REFERENCE / pixelPerCentimeter;
}

export default Converter;
