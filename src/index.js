const uid = require('uid');
const store = require('./store');
const actions = require('./actions');

function swip (io) {
  io.on('connection', (socket) => {
    const id = uid();

    socket.on(actions.TYPE.CONNECT, (data) => store.dispatch(actions.connect(id, data)));
    socket.on(actions.TYPE.SWIPE, (data) => store.dispatch(actions.swipe(id, data)));
    socket.on(actions.TYPE.LEAVE_CLUSTER, () => store.dispatch(actions.leaveCluster(id)));
    socket.on(actions.TYPE.DISCONNECT, () => store.dispatch(actions.disconnect(id)));
  });
}

module.exports = swip;
