import device from './device';
import sensor from './sensor';

function init ({ socket, container }, initCallback) {
  const client = {};

  device.requestSize((converter) => {
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

    sensor.onSwipe(container, (evt) => {
      socket.emit('SWIPE', {
        direction: evt.direction,
        position: { x: converter.toAbsPixel(evt.position.x),
          y: converter.toAbsPixel(evt.position.y),
        },
      });
    });

    /* sensor.onMotion(() => {
      socket.emit('LEAVE_CLUSTER');
    }); */

    client.converter = converter;

    client.onClick = (callback) => {
      container.addEventListener('click', (evt) => {
        callback(converter.convertClickPos(state.client.transform, evt));
      });
    };

    client.onDragStart = (callback) => {
      container.addEventListener('touchstart', (evt) => {
        callback(converter.convertTouchPos(state.client.transform, evt));
      });
    };

    client.onDragMove = (callback) => {
      container.addEventListener('touchmove', (evt) => {
        evt.preventDefault();
        callback(converter.convertTouchPos(state.client.transform, evt));
      });
    };

    client.onDragEnd = (callback) => {
      container.addEventListener('touchend', (evt) => {
        callback(converter.convertTouchPos(state.client.transform, evt));
      });
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

export default init;
