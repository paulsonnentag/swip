function getHoles (client) {
  const { transform, size, adjacentDevices } = client;
  const holes = {
    left: [],
    top: [],
    right: [],
    bottom: [],
  };

  adjacentDevices.forEach((device) => {
    const alignment = getAlignment(client, device);
    const diffY = Math.abs(transform.y - device.transform.y);
    const diffX = Math.abs(transform.x - device.transform.x);

    switch (alignment) {
      case 'LEFT':
        if (transform.y < device.transform.y
          && size.height > (device.size.height + diffY)) {
          holes.right.push({
            start: diffY,
            end: diffY + device.size.height,
          });
        } else if (transform.y > device.transform.y) {
          holes.right.push({
            start: 0,
            end: device.size.height - diffY,
          });
        } else {
          holes.right.push({
            start: diffY,
            end: size.height,
          });
        }
        break;

      case 'RIGHT':
        if (transform.y < device.transform.y
          && size.height > (device.size.height + diffY)) {
          holes.left.push({
            start: diffY,
            end: diffY + device.size.height,
          });
        } else if (transform.y > device.transform.y) {
          holes.left.push({
            start: 0,
            end: device.size.height - diffY,
          });
        } else {
          holes.left.push({
            start: diffY,
            end: size.height,
          });
        }
        break;

      case 'TOP':
        if (transform.x < device.transform.x
          && size.width > (device.size.width + diffX)) {
          holes.bottom.push({
            start: diffX,
            end: device.size.width + diffX,
          });
        } else if (transform.x > device.transform.x) {
          holes.bottom.push({
            start: 0,
            end: device.size.width - diffX,
          });
        } else {
          holes.bottom.push({
            start: diffX,
            end: size.width,
          });
        }
        break;

      case 'BOTTOM':
        if (transform.x < device.transform.x
          && size.width > (device.size.width + diffX)) {
          holes.top.push({
            start: diffX,
            end: device.size.width + diffX,
          });
        } else if (transform.x > device.transform.x) {
          holes.top.push({
            start: 0,
            end: device.size.width - diffX,
          });
        } else {
          holes.top.push({
            start: diffX,
            end: size.width,
          });
        }
        break;

      default:
        throw new Error(`Invalid alignment ${alignment}`);
    }
  });

  return holes;
}

function getAlignment (device1, device2) {
  if (device2.transform.x >= (device1.transform.x + device1.size.width)) {
    return 'LEFT';
  } else if (device1.transform.x >= (device2.transform.x + device2.size.width)) {
    return 'RIGHT';
  } else if (device2.transform.y >= (device1.transform.y + device1.size.height)) {
    return 'TOP';
  } else if (device1.transform.y >= (device2.transform.y + device2.size.height)) {
    return 'BOTTOM';
  }

  throw new Error('Invalid placement of devices');
}

module.exports = {
  getHoles,
};
