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
        const particles = cluster.data.particles;

        const updatedParticles = particles.filter((particle) => particle.ttl > 0)
          .map((particle) => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            particle.ttl--;

            return particle;
          })
          .map((particle) => {
            const currClients = cluster.clients;

            const tresholdX = Math.abs(particle.speedX);
            const tresholdY = Math.abs(particle.speedY);

            currClients.forEach((client) => {
              if (isParticleInClient(particle, client)) {
                const leftSide = client.transform.x + tresholdX;
                const rightSide = (client.transform.x + client.size.width) - tresholdX;
                const topSide = client.transform.y + tresholdY;
                const bottomSide = (client.transform.y + client.size.height) - tresholdY;


                if ((particle.x >= rightSide && checkForWall(particle.y, client.openings.right, client.transform.y))
                  || (particle.x <= leftSide && checkForWall(particle.y, client.openings.left, client.transform.y))) {
                  particle.speedX *= -1;
                }

                if ((particle.y >= bottomSide && checkForWall(particle.x, client.openings.bottom, client.transform.x))
                  || (particle.y <= topSide && checkForWall(particle.x, client.openings.top, client.transform.x))) {
                  particle.speedY *= -1;
                }
              }
            });

            return particle;
          });

        return {
          particles: { $set: updatedParticles },
        };
      },
      merge: (cluster1, cluster2, transform) => ({
        particles: { $set: getNewParticleDist(cluster1, cluster2, transform) },
      }),
    },
    init: () => ({ particles: [] }),
  },

  client: {
    init: () => ({}),
    events: {
      addParticle: ({ cluster, client }, { particles }) => {
        return {
          cluster: {
            data: { particles: { $push: particles } },
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
