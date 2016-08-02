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

    switch (alignment) {
      case 'LEFT':
        if (transform.y < device.transform.y
          && size.height > device.size.height + (Math.abs(device.transform.y - transform.y))) {
          holes.right.push({
            start: Math.abs(transform.y - device.transform.y),
            end: Math.abs(transform.y - device.transform.y) + device.size.height,
          });
        } else if (transform.y > device.transform.y) {
          holes.right.push({
            start: 0,
            end: device.size.height - (Math.abs(transform.y - device.transform.y)),
          });
        } else {
          holes.right.push({
            start: Math.abs(transform.y - device.transform.y),
            end: size.height,
          });
        }
        break;

      case 'RIGHT':
        if (transform.y < device.transform.y
          && size.height > device.size.height + (Math.abs(device.transform.y - transform.y))) {
          holes.left.push({
            start: Math.abs(transform.y - device.transform.y),
            end: Math.abs(transform.y - device.transform.y) + device.size.height,
          });
        } else if (transform.y > device.transform.y) {
          holes.left.push({
            start: 0,
            end: device.size.height - (Math.abs(transform.y - device.transform.y)),
          });
        } else {
          holes.left.push({
            start: Math.abs(transform.y - device.transform.y),
            end: size.height,
          });
        }
        break;

      case 'TOP':
        if (transform.x < device.transform.x
          && size.width > device.size.width + Math.abs(transform.x - device.transform.x)) {
          holes.bottom.push({
            start: Math.abs(transform.x - device.transform.x),
            end: device.size.width + Math.abs(transform.x - device.transform.x),
          });
        } else if (transform.x > device.transform.x) {
          holes.bottom.push({
            start: 0,
            end: device.size.width - Math.abs(transform.x - device.transform.x),
          });
        } else {
          holes.bottom.push({
            start: Math.abs(transform.x - device.transform.x),
            end: size.width,
          });
        }
        break;

      case 'BOTTOM':
        if (transform.x < device.transform.x
          && size.width > device.size.width + Math.abs(transform.x - device.transform.x)) {
          holes.top.push({
            start: Math.abs(transform.x - device.transform.x),
            end: device.size.width + Math.abs(transform.x - device.transform.x),
          });
        } else if (transform.x > device.transform.x) {
          holes.top.push({
            start: 0,
            end: device.size.width - Math.abs(transform.x - device.transform.x),
          });
        } else {
          holes.top.push({
            start: Math.abs(transform.x - device.transform.x),
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
