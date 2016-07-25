const uid = require('uid');
const store = require('./store');
const actions = require('./actions');

function swip (io) {
  io.on('connection', (socket) => {
    const id = uid();

    socket.on(actions.TYPE.CONNECT, (data) => store.dispatch(actions.join(id, data)));
    socket.on(actions.TYPE.SWIPE, (data) => store.dispatch(actions.swipe(id, data)));
  });
}

module.exports = swip;
