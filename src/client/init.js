import { requestSize } from './device';
import { onSwipe, onMotion, onClick, onDragStart, onDragMove, onDragEnd } from './sensor';

function init ({ socket, container }, initCallback) {
  const client = {};

  requestSize((converter) => {
    let state = {
      client:
        { size: {},
          transform: { x: 0, y: 0 },
        },
      cluster: {
        data: {},
      },
    };

    socket.emit('CONNECT_CLIENT', {
      size: {
        width: converter.toAbsPixel(container.clientWidth),
        height: converter.toAbsPixel(container.clientHeight),
      },
    });

    onSwipe(container, (evt) => {
      socket.emit('SWIPE', {
        direction: evt.direction,
        position: { x: converter.toAbsPixel(evt.position.x),
          y: converter.toAbsPixel(evt.position.y),
        },
      });
    });

    onMotion(() => {
      socket.emit('LEAVE_CLUSTER');
    });

    client.converter = converter;

    client.onClick = (callback) => {
      onClick(container, (evt) => callback(convertClickPos(state, converter, evt)));
    };

    client.onDragStart = (callback) => {
      onDragStart(container, (evt) => {
        evt.preventDefault();
        callback(convertTouchPos(state, converter, evt));
      });
    };

    client.onDragMove = (callback) => {
      onDragMove(container, (evt) => {
        evt.preventDefault();
        callback(convertTouchPos(state, converter, evt));
      });
    };

    client.onDragEnd = (callback) => {
      onDragEnd(container, (evt) => callback(convertTouchPos(state, converter, evt)));
    };

    client.onUpdate = (callback) => {
      socket.on('CHANGED', (evt) => {
        state = evt;
        callback(evt);
      });
    };

    client.emit = (type, data) => {
      socket.emit('CLIENT_ACTION', { type, data });
    };

    initCallback(client);
  });
}

function convertClickPos (state, converter, evt) {
  const event = {
    position: {
      x: converter.toAbsPixel(evt.clientX) + state.client.transform.x,
      y: converter.toAbsPixel(evt.clientY) + state.client.transform.y,
    },
    originalEvent: evt,
  };
  return event;
}

function convertTouchPos (state, converter, evt) {
  const event = {
    position: [],
    originalEvent: evt,
  };

  for (let i = 0; i < evt.changedTouches.length; i++) {
    const currTouched = evt.changedTouches[i];

    event.position.push({
      x: converter.toAbsPixel(currTouched.clientX) + state.client.transform.x,
      y: converter.toAbsPixel(currTouched.clientY) + state.client.transform.y,
    });
  }

  return event;
}

export default init;
