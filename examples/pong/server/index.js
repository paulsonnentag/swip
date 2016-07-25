const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const swip = require('../../../src/server/index.js');

app.use(express.static(__dirname + './../static'));

swip(io);

io.on('connection', (socket) => {
  socket.on('init', (data) => {
    console.log(data);
  });
});

server.listen(3000);
