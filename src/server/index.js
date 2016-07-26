const _ = require('lodash');
const uid = require('uid');
const read = require('fs').readFileSync;
const redux = require('redux');
const clientSource = read(require.resolve('../../dist/bundle.js'), 'utf-8');
const actions = require('./actions');
const reducer = require('./reducer');

function swip (io, config) {
  const store = redux.createStore(reducer(config));

  io.on('connection', (socket) => {
    const id = uid();

    socket.on(actions.TYPE.CONNECT, (data) => store.dispatch(actions.connect(id, data)));
    socket.on(actions.TYPE.SWIPE, (data) => store.dispatch(actions.swipe(id, data)));
    socket.on(actions.TYPE.LEAVE_CLUSTER, () => store.dispatch(actions.leaveCluster(id)));
    socket.on(actions.TYPE.DISCONNECT, () => store.dispatch(actions.disconnect(id)));

    store.subscribe(() => {
      const { clients, clusters } = store.getState();
      const client = clients[id];
      const cluster = clusters[client.clusterId];
      const clusterClients = _.filter(clients, (c) => c.clusterId === client.clusterId);
      const data = {
        client,
        cluster: {
          clients: clusterClients,
          data: cluster,
        },
      };

      socket.emit(actions.TYPE.CHANGED, data);
    });
  });

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
