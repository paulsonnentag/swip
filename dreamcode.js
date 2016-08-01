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

const client = swip.client(socket, container);

client.emit('movePaddle', { paddlePosition: 10 });

client.onChange(({ cluster, client }) => {

});
