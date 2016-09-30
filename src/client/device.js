/* global document localStorage prompt */
import Converter from './converter';

function requestSize (callback) {
  if (!localStorage.getItem('deviceSize')) {
    let deviceSize = prompt('Please enter the device size in "(inch): ');

    if (deviceSize) {
      localStorage.setItem('deviceSize', deviceSize);
      callback(new Converter(deviceSize));
    } else {
      const button = document.createElement('button');
      button.id = 'swip-device-size-button';

      button.style.marginTop = '0.5em';
      button.style.marginBottom = '0.5em';

      button.style.width = '100%';
      button.style.height = '2em';
      button.style.textAlign = 'center';
      button.style.fontFamily = 'Arial';
      button.innerHTML = 'Set device size!';

      document.body.insertBefore(button, document.body.firstChild);

      document.getElementById('swip-device-size-button').onclick = () => {
        deviceSize = prompt('Please enter the device size in "(inch): ');

        if (deviceSize) {
          document.body.removeChild(button);
          localStorage.setItem('deviceSize', deviceSize);

          callback(new Converter(deviceSize));
        }
      };
    }
  } else {
    callback(new Converter(localStorage.getItem('deviceSize')));
  }
}

export default {
  requestSize,
};
