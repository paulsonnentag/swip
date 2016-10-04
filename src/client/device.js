/* global localStorage prompt */

const DEVICE_SIZE_KEY = 'SWIP_DEVICE_SIZE';

function requestSize () {
  const storedSize = parseFloat(localStorage.getItem(DEVICE_SIZE_KEY));

  if (!Number.isNaN(storedSize)) {
    return storedSize;
  }

  /* eslint-disable no-alert */
  const inputSize = parseFloat(prompt('Please enter the device size in "(inch): '));
  /* eslint-enable no-alert */

  if (!Number.isNaN(inputSize)) {
    localStorage.setItem(DEVICE_SIZE_KEY, inputSize);
  }

  return inputSize;
}

function requestFullscreen (element) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
}

export default {
  requestSize,
  requestFullscreen,
};
