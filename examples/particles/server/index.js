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
        const blobs = cluster.data.blobs;

        const updatedBlobs = blobs.map((blob) => {
          blob.x += blob.speedX;
          blob.y += blob.speedY;

          return blob;
        })
          .map((blob) => {
            const currClients = cluster.clients;

            console.log(blob.size);

            const tresholdX = Math.abs(blob.speedX);
            const tresholdY = Math.abs(blob.speedY);

            currClients.forEach((client) => {
              if (isParticleInClient(blob, client)) {
                const leftSide = client.transform.x + tresholdX;
                const rightSide = (client.transform.x + client.size.width) - tresholdX;
                const topSide = client.transform.y + tresholdY;
                const bottomSide = (client.transform.y + client.size.height) - tresholdY;


                if ((blob.x + blob.size >= rightSide && checkForWall(blob.y + blob.size, client.openings.right, client.transform.y))
                  || (blob.x - blob.size <= leftSide && checkForWall(blob.y - blob.size, client.openings.left, client.transform.y))) {
                  blob.speedX *= -1;
                }

                if ((blob.y + blob.size >= bottomSide && checkForWall(blob.x + blob.size, client.openings.bottom, client.transform.x))
                  || (blob.y - blob.size <= topSide && checkForWall(blob.x - blob.size, client.openings.top, client.transform.x))) {
                  blob.speedY *= -1;
                }
              }
            });

            return blob;
          });

        return {
          blobs: { $set: updatedBlobs },
        };
      },
      merge: (cluster1, cluster2, transform) => ({
        blobs: { $set: getNewParticleDist(cluster1, cluster2, transform) },
      }),
    },
    init: () => ({ blobs: [] }),
  },

  client: {
    init: () => ({}),
    events: {
      addBlobs: ({ cluster, client }, { blobs }) => {
        return {
          cluster: {
            data: { blobs: { $push: blobs } },
          },
        };
      },
    },
  },
});

function isParticleInClient (particle, client) {
  const leftSide = client.transform.x;
  const rightSide = (client.transform.x + client.size.width);
  const topSide = client.transform.y;
  const bottomSide = (client.transform.y + client.size.height);

  if (particle.x < rightSide && particle.x > leftSide && particle.y > topSide && particle.y < bottomSide) {
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

function getNewParticleDist (cluster1, cluster2, transform) {
  cluster2.clients.forEach((client) => {
    for (let i = 0; i < cluster2.data.particles.length; i++) {
      if (isParticleInClient(cluster2.data.particles[i], client)) {
        cluster2.data.particles[i].x += transform.x;
        cluster2.data.particles[i].y += transform.y;
      }
    }
  });

  return cluster1.data.particles.concat(cluster2.data.particles);
}

server.listen(3000);
