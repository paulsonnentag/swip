const _ = require('lodash');
const uid = require('uid');
const read = require('fs').readFileSync;
const { createStore, applyMiddleware } = require('redux');
const clientSource = read(require.resolve('../../dist/bundle.js'), 'utf-8');
const actions = require('./actions');
const reducer = require('./reducer');
const utils = require('./utils');
const debugMiddleware = require('./debug-middleware.js');

function swip (io, config) {
  const store = createStore(reducer(config), applyMiddleware(debugMiddleware));

  io.on('connection', (socket) => {
    const id = uid();

    socket.on('disconnect', () => {
      unsubscribe();
      store.dispatch(actions.disconnect(id));
    });

    socket.on(actions.TYPE.CONNECT, (data) => store.dispatch(actions.connect(id, data)));
    socket.on(actions.TYPE.SWIPE, (data) => store.dispatch(actions.swipe(id, data)));
    socket.on(actions.TYPE.LEAVE_CLUSTER, () => store.dispatch(actions.leaveCluster(id)));
    socket.on(actions.TYPE.DISCONNECT, () => {
      unsubscribe();
      store.dispatch(actions.disconnect(id));
    });
    socket.on(actions.TYPE.RECONNECT, (data) => store.dispatch(actions.reconnect(id, data)));
    socket.on(actions.TYPE.CLIENT_ACTION, (data) => store.dispatch(actions.clientAction(id, data)));

    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      const client = state.clients[id];

      if (_.isNil(client)) {
        return;
      }

      const clientState = utils.getClientState(state, id);

      socket.emit(actions.TYPE.CHANGED, clientState);
    });
  });

  setInterval(() => store.dispatch(actions.nextState()), 33);

  attachServe(io.httpServer);
}

/* http serve adapted from socket.io */

function attachServe (srv) {
  const url = '/swip/swip.js';
  const evs = srv.listeners('request').slice(0);

  srv.removeAllListeners('request');
  srv.on('request', (req, res) => {
    if (req.url.indexOf(url) === 0) {
      serve(req, res);
    } else {
      for (let i = 0; i < evs.length; i++) {
        evs[i].call(srv, req, res);
      }
    }
  });
}

function serve (req, res) {
  res.setHeader('Content-Type', 'application/javascript');
  res.writeHead(200);
  res.end(clientSource);
}

module.exports = swip;
