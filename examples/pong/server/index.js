const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const swip = require('../../../src/index.js');

swip(io);

server.listen(3000);

app.use(express.static(__dirname + '../static'));

console.log('running server on http://localhost:3000');
