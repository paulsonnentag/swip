(function (exports) {
  'use strict';

  var socket = io('http://localhost:3000');

  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');


  var width = canvas.width = window.innerWidth;
  var height = canvas.height = window.innerHeight;





 swip.gestures.onSwipe(canvas, function (direction, position) {


   console.log(direction, position);


 });



  socket.on('connect', function () {

    console.log('connected');

  });


}(window.swip || (window.swip = {})));