const TYPE = {
  CLIENT_ACTION: 'CLIENT_ACTION',
  CONNECT: 'CONNECT',
  DISCONNECT: 'DISCONNECT',
  RECONNECT: 'RECONNECT',
  LEAVE_CLUSTER: 'LEAVE_CLUSTER',
  SWIPE: 'SWIPE',
  NEXT_STATE: 'NEXT_STATE',
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

function reconnect (id, { size }) {
  return {
    type: TYPE.RECONNECT,
    data: { id, size },
  };
}

function clientAction (id, { type, data }) {
  return {
    type: TYPE.CLIENT_ACTION,
    data: { id, type, data },
  };
}


function nextState () {
  return {
    type: TYPE.NEXT_STATE,
    data: {},
  };
}

module.exports = {
  TYPE,
  connect,
  swipe,
  leaveCluster,
  disconnect,
  reconnect,
  clientAction,
  nextState,
};
