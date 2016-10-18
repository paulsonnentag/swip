/* eslint-disable */
(function () {
  'use strict';

  var socket = io.connect();

  swip.init({ socket: socket, container: document.getElementById('root') }, function (client) {
    var converter = client.converter;
    var stage = client.stage;
    var ctx = stage.getContext('2d');

    var state = null;
    var dragPosition = null;
    var dragging = false;

    client.onClick(function (evt) {
      var hole = { x: evt.position.x, y: evt.position.y };
      client.emit('setHole', hole);
    });

    client.onDragStart(function (evt) {
      if (state) {
        var distanceX = evt.position[0].x - state.cluster.data.ball.x;
        var distanceY = evt.position[0].y - state.cluster.data.ball.y;
        var distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));

        if (distance < (2 * state.cluster.data.ball.radius)) {
          dragging = true;
          dragPosition = evt.position[0];
        }
      }
    });

    client.onDragMove(function (evt) {
      var distanceX = evt.position[0].x - state.cluster.data.ball.x;
      var distanceY = evt.position[0].y - state.cluster.data.ball.y;
      var distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));

      if (dragging) {
        if (distance > 150) {
          dragPosition = {
            x: state.cluster.data.ball.x + (distanceX / distance) * 150,
            y: state.cluster.data.ball.y + (distanceY / distance) * 150
          }
        } else {
          dragPosition = evt.position[0];
        }
      }
    });

    client.onDragEnd(function (evt) {
      if (dragging) {
        dragging = false;
        client.emit('hitBall', {
          speedX: (evt.position[0].x - state.cluster.data.ball.x) / 2,
          speedY: (evt.position[0].y - state.cluster.data.ball.y) / 2
        });
      }
    });

    swip.sensor.onChangeOrientation(throttle(function (evt) {
      client.emit('updateOrientation', {
        rotationX: evt.rotation.x,
        rotationY: evt.rotation.y
      });
    }, 200));


    client.onUpdate(function (evt) {
      state = evt;
      var client = state.client;
      var ball = state.cluster.data.ball;
      var hole = state.cluster.data.hole;

      ctx.save();

      applyTransform(ctx, converter, client.transform);
      drawBackground(ctx, client);
      drawHole(ctx, hole);

      if (dragging) {
        drawArrow(ctx, ball, dragPosition);
      }

      drawBall(ctx, ball);
      drawWalls(ctx, client);

      ctx.restore();
    });
  });

  function applyTransform (ctx, converter, transform) {
    ctx.translate(-converter.toDevicePixel(transform.x), -converter.toDevicePixel(transform.y));
    ctx.scale(converter.toDevicePixel(1), converter.toDevicePixel(1));

  }

  function drawBackground (ctx, client) {
    ctx.save();
    ctx.fillStyle = '#80d735';
    ctx.fillRect(client.transform.x, client.transform.y, client.size.width, client.size.height);
    ctx.restore();
  }

  function drawWalls (ctx, client) {
    var openings = client.openings;
    var transformX = client.transform.x;
    var transformY = client.transform.y;
    var width = client.size.width;
    var height = client.size.height;

    ctx.save();
    ctx.lineWidth = 40;
    ctx.shadowColor = '#dba863';
    ctx.shadowBlur = 10;

    ctx.strokeStyle = '#ffde99';

    // left
    ctx.beginPath();
    ctx.moveTo(transformX, transformY);

    openings.left.sort(openingSort).forEach(function (opening) {
      ctx.lineTo(transformX, opening.start + transformY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(transformX, opening.end + transformY);
    });

    ctx.lineTo(transformX, height + transformY);
    ctx.stroke();

    // right
    ctx.beginPath();
    ctx.moveTo(width + transformX, transformY);

    openings.right.sort(openingSort).forEach(function (opening) {
      ctx.lineTo(width + transformX, opening.start + transformY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(width + transformX, opening.end + transformY);
    });

    ctx.lineTo(width + transformX, height + transformY);
    ctx.stroke();

    // top
    ctx.beginPath();
    ctx.moveTo(transformX, transformY);

    openings.top.sort(openingSort).forEach(function (opening) {
      ctx.lineTo(opening.start + transformX, transformY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(opening.end + transformX, transformY);
    });

    ctx.lineTo(width + transformX, transformY);
    ctx.stroke();

    // bottom
    ctx.beginPath();
    ctx.moveTo(transformX, height + transformY);

    openings.bottom.sort(openingSort).forEach(function (opening) {
      ctx.lineTo(opening.start + transformX, height + transformY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(opening.end + transformX, height + transformY);
    });

    ctx.lineTo(width + transformX, height + transformY);
    ctx.stroke();
    ctx.restore();
  }

  function openingSort (openingA, openingB) {
    return openingB.start - openingA.start;
  }

  function drawBall (ctx, ball) {
    ctx.save();

    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
    ctx.fill();

    ctx.restore();
  }

  function drawArrow (ctx, ball, dragPosition) {
    var angle;

    ctx.save();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 5;

    angle = -Math.atan2(dragPosition.x - ball.x, dragPosition.y - ball.y) + Math.PI / 2;

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius * 2, angle + Math.PI / 2, angle - Math.PI / 2);
    ctx.arc(dragPosition.x, dragPosition.y, ball.radius, angle - Math.PI / 2, angle + Math.PI / 2);
    ctx.fill();

    ctx.restore();
  }

  function drawHole (ctx, hole) {
    ctx.save();

    ctx.fillStyle = 'black';
    ctx.strokeStyle = '#4b7f1f';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(hole.x, hole.y, hole.radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  function throttle(fn, threshhold, scope) {
    threshhold || (threshhold = 250);
    var last,
      deferTimer;
    return function () {
      var context = scope || this;

      var now = +new Date,
        args = arguments;
      if (last && now < last + threshhold) {
        // hold on to it
        clearTimeout(deferTimer);
        deferTimer = setTimeout(function () {
          last = now;
          fn.apply(context, args);
        }, threshhold);
      } else {
        last = now;
        fn.apply(context, args);
      }
    };
  }

}());