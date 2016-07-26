const TYPE = {
  CONNECT: 'CONNECT_CLIENT',
  DISCONNECT: 'disconnect', // use name of disconnect event of socket.io
  LEAVE_CLUSTER: 'LEAVE_CLUSTER',
  SWIPE: 'SWIPE',
  CHANGED: 'CHANGED',
};

function connect (id, { size }) {
  return {
    type: TYPE.CONNECT,
    data: { id, size },
  };
}

function swipe (id, { position, direction }) {
  return {
    type: TYPE.SWIPE,
    data: { id, position, direction },
  };
}

function leaveCluster (id) {
  return {
    type: TYPE.LEAVE_CLUSTER,
    data: { id },
  };
}

function disconnect (id) {
  return {
    type: TYPE.DISCONNECT,
    data: { id },
  };
}

module.exports = {
  TYPE,
  connect,
  swipe,
  leaveCluster,
  disconnect,
};
