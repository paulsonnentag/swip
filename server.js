var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(3000);

app.use(express.static(__dirname + '/public'));

console.log('started server on http://localhost:3000');

io.on('connection', function (socket) {
  console.log('connection');
});