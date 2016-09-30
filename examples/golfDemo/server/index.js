const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const swip = require('../../../src/server/index.js');

app.use(express.static(__dirname + './../static'));

swip(io, {
  cluster: {
    events: {
      update: (cluster) => {
        const golfball = cluster.data.golfball
        const xPos = cluster.data.golfball.x;
        const yPos = cluster.data.golfball.y;
        let speedX = cluster.data.golfball.speedX;
        let speedY = cluster.data.golfball.speedY;

        const currClients = cluster.clients;

        const tresholdX = Math.abs(speedX);
        const tresholdY = Math.abs(speedY);

        currClients.forEach((client) => {
          if (isParticleInClient(golfball, client)) {
            const leftSide = client.transform.x + tresholdX;
            const rightSide = (client.transform.x + client.size.width) - tresholdX;
            const topSide = client.transform.y + tresholdY;
            const bottomSide = (client.transform.y + client.size.height) - tresholdY;

            if ((xPos >= rightSide && checkForWall(yPos, client.openings.right, client.transform.y))
              || (xPos <= leftSide && checkForWall(yPos, client.openings.left, client.transform.y))) {
              speedX *= -1;
            }

            if ((yPos >= bottomSide && checkForWall(xPos, client.openings.bottom, client.transform.x))
              || (yPos <= topSide && checkForWall(xPos, client.openings.top, client.transform.x))) {
              speedY *= -1;
            }
          }
        });

        return {
          golfball: {
            x: { $set: (xPos + speedX) },
            y: { $set: (yPos + speedY) },
            speedX: { $set: speedX === 0 ? 0 : slowDown(speedX) },
            speedY: { $set: speedY === 0 ? 0 : slowDown(speedY) },
          },
        };
      },
      merge: (cluster1, cluster2, transform) => ({ particles: { $set: getNewParticleDist(cluster1, cluster2, transform) } }),
    },
    init: () => ({ golfball : { x: 50, y: 50, size: 5, speedX: 0, speedY: 0 } }),
  },

  client: {
    init: () => ({}),
    events: {
      hitBall: ({ cluster, client }, { speedX, speedY }) => {
        return {
          cluster: {
            data: { golfball : { speedX: { $set: Math.round(speedX / 10) }, speedY: { $set: Math.round(speedY / 10) } } },
          },
        };
      },
    },
  },
});

function getNewParticleDist (cluster1, cluster2, transform) {
  cluster2.clients.forEach((client) => {
    if (isParticleInClient(cluster2.data.golfball, client)) {
      cluster2.data.golfball.x += (client.transform.x + transform.x);
      cluster2.data.golfball.y += (client.transform.y + transform.y);
    }
  });

  return cluster1.data.golfball;
}

function slowDown (speed) {
  return speed > 0 ? speed - 1 : speed + 1;
}

function isParticleInClient (golfball, client) {
  const leftSide = client.transform.x;
  const rightSide = (client.transform.x + client.size.width);
  const topSide = client.transform.y;
  const bottomSide = (client.transform.y + client.size.height);

  if (golfball.x < rightSide && golfball.x > leftSide && golfball.y > topSide && golfball.y < bottomSide) {
    return true;
  }

  return false;
}

function checkForWall (particlePos, openings, transform) {
  let isWall = true;

  openings.forEach((opening) => {
    if (particlePos >= (opening.start + transform) && particlePos <= (opening.end + transform)) {
      isWall = false;
    }
  });

  return isWall;
}

server.listen(3000);
