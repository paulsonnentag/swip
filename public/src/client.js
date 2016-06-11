(function () {
  'use strict';

  var socket = io('http://localhost:3000');

  socket.on('connect', function () {

    console.log('connected');

  });


}());