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
            

            return particle;
          });

        return {
          particles: { $set: updatedParticles },
        };
      },
      merge: () => ({}),
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


server.listen(3000);
