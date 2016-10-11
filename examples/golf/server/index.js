const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const swip = require('../../../src/server/index.js');

app.use(express.static(__dirname + './../static'));

const WALL_SIZE = 20;

swip(io, {
  cluster: {
    events: {
      update: (cluster) => {
        const ball = cluster.data.ball;
        let nextPosX = ball.x + ball.speedX;
        let nextPosY = ball.y + ball.speedY;
        let nextSpeedX = ball.speedX;
        let nextSpeedY = ball.speedY;

        const currClients = cluster.clients;

        const boundaryOffset = ball.radius + WALL_SIZE;


        currClients.forEach((client) => {
          if (isParticleInClient(ball, client)) {
            if (((ball.speedX < 0) &&
              ((nextPosX - boundaryOffset) < client.transform.x) && !isWallOpen(client.transform.y, client.openings.left, nextPosY))) {
              nextPosX = client.transform.y + boundaryOffset;
              nextSpeedX = ball.speedX * -1;
            } else if (
              ((ball.speedX > 0) &&
              ((nextPosX + boundaryOffset) > (client.transform.x + client.size.width)) && !isWallOpen(client.transform.y, client.openings.right, nextPosY))
            ) {
              nextPosX = client.transform.y + (client.size.width - boundaryOffset);
              nextSpeedX = ball.speedX * -1;
            }

            if (((ball.speedY < 0) &&
              ((nextPosY - boundaryOffset) < client.transform.y && !isWallOpen(client.transform.x, client.openings.top, nextPosX)))
            ) {
              nextPosY = client.transform.y + boundaryOffset;
              nextSpeedY = ball.speedY * -1;

            } else if (((ball.speedY > 0) &&
              ((nextPosY + boundaryOffset) > (client.transform.y + client.size.height)) && !isWallOpen(client.transform.x, client.openings.bottom, nextPosX))
            ) {
              nextPosY = client.transform.y + (client.size.height - boundaryOffset);
              nextSpeedY = ball.speedY * -1;
            }
          }
        });

        return {
          ball: {
            x: { $set: nextPosX },
            y: { $set: nextPosY },
            speedX: { $set: nextSpeedX * 0.97 },
            speedY: { $set: nextSpeedY * 0.97 },
          },
        };
      },
      merge: (cluster1, cluster2, transform) => ({
        particles: { $set: getNewParticleDist(cluster1, cluster2, transform) },
      }),
    },
    init: () => ({
      ball: { x: 50, y: 50, radius: 10, speedX: 0, speedY: 0 },
      hole: { x: 200, y: 200 },
      gameOver: false,
    }),
  },

  client: {
    init: () => ({}),
    events: {
      hitBall: ({ cluster, client }, { speedX, speedY }) => {
        return {
          cluster: {
            data: {
              ball: {
                speedX: { $set: speedX },
                speedY: { $set: speedY },
              },
            },
          },
        };
      },
      setHole: ({ cluster, client }, hole) => {
        return {
          cluster: {
            data: { hole: { $set: hole } },
          },
        };
      },
    },
  },
});

function getNewParticleDist (cluster1, cluster2, transform) {
  cluster2.clients.forEach((client) => {
    if (isParticleInClient(cluster2.data.ball, client)) {
      cluster2.data.ball.x += (client.transform.x + transform.x);
      cluster2.data.ball.y += (client.transform.y + transform.y);
    }
  });

  return cluster1.data;
}

function isParticleInClient (ball, client) {
  const leftSide = client.transform.x;
  const rightSide = (client.transform.x + client.size.width);
  const topSide = client.transform.y;
  const bottomSide = (client.transform.y + client.size.height);

  if (ball.x < rightSide && ball.x > leftSide && ball.y > topSide && ball.y < bottomSide) {
    return true;
  }

  return false;
}

function isWallOpen (transform, openings, particlePos) {
  let isOpen = false;

  openings.forEach((opening) => {
    if (particlePos >= (opening.start + transform) && particlePos <= (opening.end + transform)) {
      isOpen = true;
    }
  });

  return isOpen;
}

server.listen(3000);
