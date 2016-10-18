/* global document window screen */

import device from './device';
import sensor from './sensor';
import Converter from './converter';
import './style.css';

function init ({ socket, container, type }, initApp) {
  return new ClientView({ socket, container, type, initApp });
}

class ClientView {

  constructor ({ container, type, socket, initApp }) {
    this.socket = socket;

    this.initApp = initApp;

    // init container
    this.container = container;
    this.container.classList.add('SwipRoot');
    this.container.innerHTML = '';

    // init stage
    this.stage = getStage(type);
    this.stage.resize(container.clientWidth, container.clientHeight);
    this.container.appendChild(this.stage.element);
    window.addEventListener('resize', () => {
      this.stage.resize(container.clientWidth, container.clientHeight);
    });


    // init swip points
    this.swipPoints = new SwipPoints();
    this.container.appendChild(this.swipPoints.element);

    this.size = device.requestSize();

    // add connect button if size is not set
    if (Number.isNaN(this.size)) {
      this.connectButton = document.createElement('button');
      this.connectButton.innerText = 'connect';
      this.connectButton.classList.add('SwipButton');
      this.connectButton.onclick = () => this.connect();
      this.container.appendChild(this.connectButton);
    } else {
      this.initClient();
    }
  }

  initClient () {
    this.client = new Client({
      size: this.size,
      socket: this.socket,
      stage: this.stage.element,
      swipPoints: this.swipPoints,
      container: this.container,
    });

    window.addEventListener('resize', () => this.client.reconnect());

    this.initApp(this.client);
  }

  connect () {
    this.size = device.requestSize();

    if (!Number.isNaN(this.size)) {
      this.connectButton.style.display = 'none';

      this.initClient();
    }
  }
}

class Client {

  constructor ({ size, stage, container, socket, swipPoints }) {
    this.converter = new Converter(size);
    this.stage = stage;
    this.container = container;
    this.swipPoints = swipPoints;
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
    this.socket.emit('CONNECT', {
      size: {
        width: this.converter.toAbsPixel(this.stage.clientWidth),
        height: this.converter.toAbsPixel(this.stage.clientHeight),
      },
    });
  }

  reconnect () {
    this.socket.emit('RECONNECT', {
      size: {
        width: this.converter.toAbsPixel(this.stage.clientWidth),
        height: this.converter.toAbsPixel(this.stage.clientHeight),
      },
    });
  }

  initEventListener () {
    sensor.onSwipe(this.container, (evt) => {
      const position = {
        x: this.converter.toAbsPixel(evt.position.x),
        y: this.converter.toAbsPixel(evt.position.y),
      };

      this.swipPoints.animatePoint(evt.position.x, evt.position.y);

      this.socket.emit('SWIPE', {
        direction: evt.direction,
        position,
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


class SwipPoints {
  constructor () {
    this.initPoints();
  }

  initPoints () {
    let i;
    this.nextPoint = 0;
    this.points = [];

    this.element = document.createElement('div');

    for (i = 0; i < 5; i++) {
      const point = this.points[i] = document.createElement('div');
      point.classList.add('SwipPoint');
      this.element.appendChild(point);
    }
  }

  animatePoint (x, y) {
    const point = this.points[this.nextPoint];

    point.style.top = `${y}px`;
    point.style.left = `${x}px`;
    point.classList.remove('SwipPoint--start-animation');

    // force reflow
    void point.offsetWidth;

    point.classList.add('SwipPoint--start-animation');

    this.nextPoint = (this.nextPoint + 1) % this.points.length;
  }
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
