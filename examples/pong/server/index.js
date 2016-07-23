var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var swip = require('../../../index.js');

swip(io, {});

server.listen(3000);

app.use(express.static(__dirname + '../static'));

console.log('running server on http://localhost:3000');
