const express = require('express');
const app = express();
// eslint-disable-next-line new-cap
const server = require('http').Server(app);
const io = require('socket.io')(server);
const swip = require('../../../src/server/index.js');

app.use(express.static(`${__dirname}/../client`));

const WALL_SIZE = 20;
const SPEED_THRESHOLD = 50;
const DOWNHILL_ACCELERATION_SCALE = 1 / 20;
const ANGLE_INACCURACY = 3;

swip(io, {
  cluster: {
    events: {
      update: (cluster) => {
        const ball = cluster.data.ball;
        const hole = cluster.data.hole;
        const clients = cluster.clients;

        let downhillAccelerationX = 0;
        let downhillAccelerationY = 0;
        let nextPosX = ball.x + ball.speedX;
        let nextPosY = ball.y + ball.speedY;
        let nextSpeedX = ball.speedX;
        let nextSpeedY = ball.speedY;

        const boundaryOffset = ball.radius + WALL_SIZE;
        const client = clients.find((c) => isParticleInClient(ball, c));

        if (client) {
          if (Math.abs(client.data.rotationX) > ANGLE_INACCURACY) {
            downhillAccelerationX = (client.data.rotationX - ANGLE_INACCURACY) * DOWNHILL_ACCELERATION_SCALE;
          }

          if (Math.abs(client.data.rotationY) > ANGLE_INACCURACY) {
            downhillAccelerationY = (client.data.rotationY - ANGLE_INACCURACY) * DOWNHILL_ACCELERATION_SCALE;
          }

          // update speed and position if collision happens
          if (((ball.speedX < 0) &&
            ((nextPosX - boundaryOffset) < client.transform.x) &&
            !isWallOpenAtPosition(client.transform.y, client.openings.left, nextPosY))) {
            nextPosX = client.transform.x + boundaryOffset;
            nextSpeedX = ball.speedX * -1;
          } else if (((ball.speedX > 0) &&
            ((nextPosX + boundaryOffset) > (client.transform.x + client.size.width)) &&
            !isWallOpenAtPosition(client.transform.y, client.openings.right, nextPosY))) {
            nextPosX = client.transform.x + (client.size.width - boundaryOffset);
            nextSpeedX = ball.speedX * -1;
          }

          if (((ball.speedY < 0) &&
            ((nextPosY - boundaryOffset) < client.transform.y &&
            !isWallOpenAtPosition(client.transform.x, client.openings.top, nextPosX)))) {
            nextPosY = client.transform.y + boundaryOffset;
            nextSpeedY = ball.speedY * -1;
          } else if (((ball.speedY > 0) &&
            ((nextPosY + boundaryOffset) > (client.transform.y + client.size.height)) &&
            !isWallOpenAtPosition(client.transform.x, client.openings.bottom, nextPosX))
          ) {
            nextPosY = client.transform.y + (client.size.height - boundaryOffset);
            nextSpeedY = ball.speedY * -1;
          }
        } else { // reset ball to first client of cluster
          const firstClient = clients[0];
          nextPosX = firstClient.transform.x + (firstClient.size.width / 2);
          nextPosY = firstClient.transform.y + (firstClient.size.height / 2);
          nextSpeedX = 0;
          nextSpeedY = 0;
        }

        if (isInsideHole(hole, ball)) {
          nextPosX = (ball.x + hole.x) / 2;
          nextPosY = (ball.y + hole.y) / 2;
          nextSpeedX = 0;
          nextSpeedY = 0;
        }

        return {
          ball: {
            x: { $set: nextPosX },
            y: { $set: nextPosY },
            speedX: { $set: (nextSpeedX + downhillAccelerationX) * 0.97 },
            speedY: { $set: (nextSpeedY + downhillAccelerationY) * 0.97 },
          },
        };
      },
      merge: () => ({}),
    },
    init: () => ({
      ball: { x: 50, y: 50, radius: 10, speedX: 0, speedY: 0 },
      hole: { x: 200, y: 200, radius: 15 },
    }),
  },

  client: {
    init: () => ({ rotationX: 0, rotationY: 0 }),
    events: {

      hitBall: ({ cluster, client }, { speedX, speedY }) => ({
        cluster: {
          data: {
            ball: {
              speedX: { $set: speedX },
              speedY: { $set: speedY },
            },
          },
        },
      }),

      setHole: ({ cluster, client }, { x, y }) => ({
        cluster: {
          data: {
            hole: {
              x: { $set: x },
              y: { $set: y },
            },
          },
        },
      }),

      updateOrientation: ({ cluster, client }, { rotationX, rotationY }) => ({
        client: {
          data: {
            rotationX: { $set: rotationX },
            rotationY: { $set: rotationY },
          },
        },
      }),
    },
  },
});

function isParticleInClient (ball, client) {
  const leftSide = client.transform.x;
  const rightSide = (client.transform.x + client.size.width);
  const topSide = client.transform.y;
  const bottomSide = (client.transform.y + client.size.height);

  return ball.x < rightSide && ball.x > leftSide && ball.y > topSide && ball.y < bottomSide;
}

function isWallOpenAtPosition (transform, openings, particlePos) {
  return openings.some((opening) => (
    particlePos >= (opening.start + transform) && particlePos <= (opening.end + transform)
  ));
}

function isInsideHole (hole, ball) {
  const distanceX = hole.x - ball.x;
  const distanceY = hole.y - ball.y;
  const distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
  const speed = Math.sqrt(Math.pow(ball.speedX, 2) + Math.pow(ball.speedY, 2));

  return distance <= hole.radius && speed < SPEED_THRESHOLD;
}

server.listen(3000);
