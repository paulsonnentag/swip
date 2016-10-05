/* global document window screen */

import device from './device';
import sensor from './sensor';
import Converter from './converter';
import './style.css';

function init ({ socket, container, type }, initApp) {
  const { stage, connectButton } = startView({ container, type });
  let size = device.requestSize();

  stage.resize(container.clientWidth, container.clientHeight);

  connectButton.onclick = () => {
    if (Number.isNaN(size)) {
      size = device.requestSize();
    } else {
      const client = new Client({ size, socket, stage: stage.element });

      connectButton.style.display = 'none';

      initApp(client);
    }
  };
}

class Client {

  constructor ({ size, stage, socket }) {
    this.converter = new Converter(size);
    this.stage = stage;
    this.socket = socket;
    this.state = {
      client: {
        transform: { x: 0, y: 0 },
      },
    };

    this.connect();
    this.initEventListener();
  }

  connect () {
    this.socket.emit('CONNECT_CLIENT', {
      size: {
        width: this.converter.toAbsPixel(this.stage.clientWidth),
        height: this.converter.toAbsPixel(this.stage.clientHeight),
      },
    });
  }

  initEventListener () {
    sensor.onSwipe(this.stage, (evt) => {
      this.socket.emit('SWIPE', {
        direction: evt.direction,
        position: {
          x: this.converter.toAbsPixel(evt.position.x),
          y: this.converter.toAbsPixel(evt.position.y),
        },
      });
    });
  }

  onClick (callback) {
    this.stage.addEventListener('click', (evt) => {
      callback(this.converter.convertClickPos(this.state.client.transform, evt));
    });
  }

  onDragStart (callback) {
    this.stage.addEventListener('touchstart', (evt) => {
      callback(this.converter.convertTouchPos(this.state.client.transform, evt));
    });
  }

  onDragMove (callback) {
    this.stage.addEventListener('touchmove', (evt) => {
      evt.preventDefault();
      callback(this.converter.convertTouchPos(this.state.client.transform, evt));
    });
  }

  onDragEnd (callback) {
    this.stage.addEventListener('touchend', (evt) => {
      callback(this.converter.convertTouchPos(this.state.client.transform, evt));
    });
  }

  onUpdate (callback) {
    this.socket.on('CHANGED', (state) => {
      this.state = state;
      callback(state);
    });
  }

  emit (type, data) {
    this.socket.emit('CLIENT_ACTION', { type, data });
  }
}


function startView ({ container, type }) {
  container.classList.add('SwipRoot');
  container.innerHTML = '';

  const connectButton = document.createElement('button');
  connectButton.innerText = 'connect';
  connectButton.classList.add('SwipButton');

  container.appendChild(connectButton);

  const stage = getStage(type);
  stage.resize(container.clientWidth, container.clientHeight);
  container.appendChild(stage.element);

  return { stage, connectButton };
}


function getStage (type) {
  if (type === 'dom') {
    return new DOMStage();
  }

  return new CanvasStage();
}

class CanvasStage {
  constructor () {
    this.element = document.createElement('canvas');
    this.element.style.cursor = 'pointer';
  }

  resize (width, height) {
    this.element.width = width;
    this.element.height = height;
  }
}

class DOMStage {
  constructor () {
    this.element = document.createElement('div');
  }

  resize (width, height) {
    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;
  }
}

export default init;
