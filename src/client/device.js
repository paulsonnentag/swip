/* global document localStorage */
import Converter from './converter';

function requestSize (callback) {
  if (!localStorage.getItem('deviceSize')) {
    const input = document.createElement('div');
    input.id = 'swip-device-size-modal';
    input.innerHTML = `
             <label for="swip-device-size">Your devices size:</label>
            <input type="text" id="swip-device-size" placeholder="Input device Size...">
            <br />
            <button id="swip-confirm-size">Confirm</button>
            `;
    document.body.insertBefore(input, document.body.firstChild);

    document.getElementById('swip-confirm-size').addEventListener('click', () => {
      const deviceSize = document.getElementById('swip-device-size').value;
      document.body.removeChild(input);
      localStorage.setItem('deviceSize', deviceSize);

      callback(new Converter(deviceSize));
    });

  } else {
    callback(new Converter(localStorage.getItem('deviceSize')));
  }
}

export {
  requestSize,
};
