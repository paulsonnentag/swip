const uid = require('uid');
const read = require('fs').readFileSync;
const clientSource = read(require.resolve('../../dist/bundle.js'), 'utf-8');
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

  attachServe(io.httpServer);
}

/* http serve adapted from socket.io */

function attachServe (srv) {
  const url = '/swip/swip.js';
  const evs = srv.listeners('request').slice(0);

  srv.removeAllListeners('request');
  srv.on('request', (req, res) => {
    console.log('req', req.url);

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
