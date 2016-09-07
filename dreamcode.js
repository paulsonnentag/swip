/* global swip io */

// PONG Server

swip(io, {
  client: {
    init: (client) => {

    },

    events: {
      join: ({game, client}) => {
        const PADDLE_SPACING = 20;
        const { size } = client;
        let orientation;
        let paddleOffset;

        if (this.hasDeviceOnLeft(client)) {
          orientation = 'HORIZONTAL';
          paddleOffset = size.width - PADDLE_SPACING;
        } else if (this.hasDeviceOnRight(client)) {
          orientation = 'HORIZONTAL';
          paddleOffset = PADDLE_SPACING;
        } else if (this.hasDeviceOnTop(client)) {
          orientation = 'VERTICAL';
          paddleOffset = size.height - PADDLE_SPACING;
        } else if (this.hasDeviceOnTop(client)) {
          orientation = 'VERTICAL';
          paddleOffset = size.height - PADDLE_SPACING;
        }

        return {
          orientation,
          paddleOffset,
          score: 0,
          paddlePosition: size.height / 2,
        };
      }

      movePaddle: ({ position }, { game, client }) => {
        return {
          client: {
            data: { paddlePosition: { $update: position } }
          },
        };
      },
    },

    cluster: {
      init: (clients) => {
        let speed;
        const startClient = clients[0];

        if (this.hasDeviceOnLeft(startClient)) {
          speed = { x: -1, y: 1 };
        } else if (this.hasDeviceOnRight(startClient)) {
          speed = { x: 1, y: 1 };
        } else if (this.hasDeviceOnTop(startClient)) {
          speed = { x: 1, y: -1 };
        } else if (this.hasDeviceOnTop(startClient)) {
          speed = { x: 1, y: -1 };
        }

        return {
          ball: {
            speed,
            pos: {
              x: startClient.width / 2,
              y: startClient.height / 2,
            },
          },
        };
      },

      events: {
        update: ({ delta }, { clients, app }) => {
          const { ball } = app;
          return {
            game: {
              ball: { pos: { $set: { x: ball.pos.x + ball.speed.x,
                                     y: ball.pos.y + ball.speed.y } } },
            },
          };
        },
      },
    },
  },
});

// client

/*
* automated
*
socket.emit('CONNECT_CLIENT', {
 size: {
 width: converter.toAbsPixel(container.width),
 height: converter.toAbsPixel(container.height),
 }
});

swip.sensor.onSwipe(container, function (evt) {
 socket.emit('SWIPE', { direction: evt.direction, position: { x: converter.toAbsPixel(evt.position.x), y: converter.toAbsPixel(evt.position.y) }});
});

swip.sensor.onMotion(function () {
 socket.emit('LEAVE_CLUSTER');
});
*
* */

swip.init({ socket: socket, container: container}, (client) => {

  client.onSwip((evt) => {
    //add animation
    //what should happen on swipe
  });

  client.onJoin((evt) => {

  });

  client.onLeave((evt) => {
    //add animation
    //what should happen if client leaves
  });

  /*
  client.onClick((evt) => {

  });

  //custom behaviour
  client.emit('name', {data: data});

  client.onUpdate((evt) => {

  });

  var converter = client.converter;
});*/

const client = swip.client(socket, container);

client.emit('movePaddle', { paddlePosition: 10 });

client.onChange(({ cluster, client }) => {

});
