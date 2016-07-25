/* global document localStorage */
import Converter from './converter';

function requestSize (callback) {
  if (!localStorage.getItem('deviceSize')) {
    document.body.innerHTML = `
          <div id="swip-device-size-modal">
            <label for="swip-device-size">Your devices size:</label>
            <input type="text" id="swip-device-size" placeholder="Input device Size...">
            <br />
            <button id="swip-confirm-size">Confirm</button>
					</div>
				`;

    document.getElementById('swip-confirm-size').addEventListener('click', () => {
      const deviceSize = document.getElementById('swip-device-size').value;
      document.getElementById('swip-device-size-modal').style.hidden = 'true';
      localStorage.setItem('deviceSize', deviceSize);

      callback(new Converter(deviceSize));
    });
  } else {
    callback(new Converter(localStorage.getItem('deviceSize')));
  }
}

const device = {
  requestSize,
};

export default device;
