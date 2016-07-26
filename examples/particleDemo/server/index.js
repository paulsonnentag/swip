const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const swip = require('../../../src/server/index.js');

app.use(express.static(__dirname + './../static'));

swip(io, {
  cluster: {
    init: () => ({}),
  },

  client: {
    init: () => ({}),
  },
});


server.listen(3000);
