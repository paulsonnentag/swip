const TYPE = {
  CONNECT: 'CONNECT_CLIENT',
  DISCONNECT: 'DISCONNECT_CLIENT',
  LEAVE_CLUSTER: 'LEAVE_CLUSTER',
  SWIPE: 'SWIPE',
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

module.exports = {
  TYPE,
  connect,
  swipe,
  leaveCluster,
};
