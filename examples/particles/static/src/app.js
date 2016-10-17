/* eslint-disable */
(function () {
  'use strict';

  var socket = io.connect();

  swip.init({ socket: socket, container: document.getElementById('root'), type: 'canvas' }, function (client) {
    var converter = client.converter;
    var stage = client.stage;
    var ctx = stage.getContext('2d');

    var counter = 0;
    var blobs = [];
    var activeBlobs = [];
    var clickedBlobs = [];

    client.onDragStart(function (evt) {
      evt.position.forEach(function (pos) {
        for (var i = 0; i < blobs.length; i++) {
          if (touchInRadius(pos.x, pos.y, blobs[i].x, blobs[i].y, blobs[i].size * 2)) {
            clickedBlobs.push(blobs.splice(i, 1)[0]);
          }
        }
      });
      if (clickedBlobs.length > 0) {
        client.emit('updateBlobs', { blobs: blobs });
      }

      if (clickedBlobs == false) {
        evt.position.forEach(function (pos) {
          activeBlobs.push({
            x: pos.x,
            y: pos.y,
            speedX: 0,
            speedY: 0,
            size: converter.toAbsPixel(15)
          });
        });
      }
    });

    client.onDragMove(function (evt) {
      if (clickedBlobs.length > 0) {
        if (counter >= 3) {
          evt.position.forEach(function (pos) {
            for (var i = 0; i < clickedBlobs.length; i++) {
              if (touchInRadius(pos.x, pos.y, clickedBlobs[i].x, clickedBlobs[i].y, clickedBlobs[i].size * 10)) {
                clickedBlobs[i].x = pos.x;
                clickedBlobs[i].y = pos.y;
              }
            }
          });
          counter = 0;
        }
        counter++;
      }
    });

    client.onDragEnd(function (evt) {
      if (clickedBlobs == false) {
        evt.position.forEach(function (pos) {
          var emitBlobs = [];
          for (var i = 0; i < activeBlobs.length; i++) {
            if (touchInRadius(pos.x, pos.y, activeBlobs[i].x, activeBlobs[i].y, activeBlobs[i].size)) {
              emitBlobs.push(activeBlobs[i]);
              activeBlobs.splice(i, 1);
              i--;
            }
          }
          if (emitBlobs) {
            client.emit('addBlobs', { blobs: emitBlobs });
          }
        });
      } else {
        evt.position.forEach(function (pos) {
          var emitBlobs = [];
          for (var i = 0; i < clickedBlobs.length; i++) {
            var startX = clickedBlobs[i].x;
            var startY = clickedBlobs[i].y;

            if (touchInRadius(pos.x, pos.y, clickedBlobs[i].x, clickedBlobs[i].y, clickedBlobs[i].size * 40)) {
              clickedBlobs[i].x = pos.x;
              clickedBlobs[i].y = pos.y;
              clickedBlobs[i].speedX = (pos.x - startX) / 2;
              clickedBlobs[i].speedY = (pos.y - startY) / 2;
              emitBlobs.push(clickedBlobs.splice(i, 1)[0]);
              i--;
            }
          }
          client.emit('addBlobs', { blobs: emitBlobs });
        });
      }
    });

    client.onUpdate(function (evt) {
      var updatedBlobs = evt.cluster.data.blobs;
      blobs = updatedBlobs;

      ctx.save();

      applyTransform(ctx, converter, evt.client.transform);

      drawBackground(ctx, evt);
      drawOpenings(ctx, evt.client);
      increaseActiveBlobSize(activeBlobs, converter);
      drawBlobs(ctx, activeBlobs, clickedBlobs, updatedBlobs);

      ctx.restore();
    });
  });

  function drawBackground (ctx, evt) {
    ctx.save();

    ctx.fillStyle = evt.cluster.data.backgroundColor;
    ctx.fillRect(evt.client.transform.x, evt.client.transform.y, evt.client.size.width, evt.client.size.height);

    ctx.restore();
  }

  function applyTransform (ctx, converter, transform) {
    ctx.translate(-converter.toDevicePixel(transform.x), -converter.toDevicePixel(transform.y));
    ctx.scale(converter.toDevicePixel(1), converter.toDevicePixel(1));
  }

  function increaseActiveBlobSize (activeBlobs, converter) {
    if (activeBlobs) {
      for(var i = 0; i < activeBlobs.length; i++) {
        if (activeBlobs[i].size < converter.toAbsPixel(100)) {
          activeBlobs[i].size += 1;
        }
      }
    }
  }

  function drawBlobs (ctx, activeBlobs, clickedBlobs, updatedBlobs) {
    ctx.shadowBlur = 0;

    ctx.save();

    activeBlobs.forEach(function(blob) {
      ctx.beginPath();
      ctx.arc(blob.x, blob.y, blob.size , 0, 2 * Math.PI, false);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    });

    clickedBlobs.forEach(function(blob) {
      ctx.beginPath();
      ctx.arc(blob.x, blob.y, blob.size , 0, 2 * Math.PI, false);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    });

    updatedBlobs.forEach(function (blob) {
      ctx.beginPath();
      ctx.arc(blob.x, blob.y, blob.size , 0, 2 * Math.PI, false);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    });

    ctx.restore();
  }

  function touchInRadius (posX, posY, blobX, blobY, blobsSize) {
    var inRadius = false;

    if ((posX < (blobX + blobsSize) && posX > (blobX - blobsSize)) &&
      (posY < (blobY + blobsSize) && posY > (blobY - blobsSize))) {
      inRadius = true;
    }

    return inRadius;
  }

  function indexInClicked (index, clickedBlobs) {
    for (var i = 0; i < clickedBlobs.length; i++) {
      if (clickedBlobs[i].index == index) {
        return true;
      }
    }
    return false;
  }

  function drawOpenings (ctx, client) {
    var openings = client.openings;
    var transformX = client.transform.x;
    var transformY = client.transform.y;
    var width = client.size.width;
    var height = client.size.height;

    ctx.lineWidth = 5;
    ctx.shadowBlur = 5;

    openings.left.forEach(function (wall) {
      ctx.strokeStyle = "#ff9e00";
      ctx.shadowColor = "#ff9e00";

      ctx.beginPath();
      ctx.moveTo(transformX, wall.start + transformY);
      ctx.lineTo(transformX, wall.end + transformY);
      ctx.stroke();
    });

    openings.top.forEach(function (wall) {
      ctx.strokeStyle = "#0084FF";
      ctx.shadowColor = "#0084FF";

      ctx.beginPath();
      ctx.moveTo(wall.start + transformX, transformY);
      ctx.lineTo(wall.end + transformX, transformY);
      ctx.stroke();
    });

    openings.right.forEach(function (wall) {
      ctx.strokeStyle = "#0084FF";
      ctx.shadowColor = "#0084FF";

      ctx.beginPath();
      ctx.moveTo(width + transformX, wall.start + transformY);
      ctx.lineTo(width + transformX, wall.end + transformY);
      ctx.stroke();
    });

    openings.bottom.forEach(function (wall) {
      ctx.strokeStyle = "#ff9e00";
      ctx.shadowColor = "#ff9e00";

      ctx.beginPath();
      ctx.moveTo(wall.start + transformX, height + transformY);
      ctx.lineTo(wall.end + transformX, height + transformY);
      ctx.stroke();
    });
  }
}());
