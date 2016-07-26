const _ = require('lodash');
const uid = require('uid');
const update = require('immutability-helper');
const actions = require('./actions');

const SWIPE_TOLERANCE = 50;

const initialState = {
  clusters: {},
  clients: {},
  swipes: [],
};

function reducer (state = initialState, { type, data }) {
  switch (type) {
    case actions.TYPE.CONNECT:
      return connect(state, data);

    case actions.TYPE.SWIPE:
      return doSwipe(state, data);

    case actions.TYPE.LEAVE_CLUSTER:
      return leaveCluster(state, data);

    case actions.TYPE.DISCONNECT:
      return disconnect(state, data);

    default:
      return state;
  }
}

function connect (state, { id, size }) {
  return update(state, {
    clients: {
      [id]: { $set: { id, size, transform: { x: 0, y: 0 }, connections: [] } },
      //TODO: customClient init
    },
  });
}

function doSwipe (state, swipe) {
  const swipes = getCoincidentSwipes(state.swipes);

  if (swipes.length === 0) {
    return addSwipe(state, swipes, swipe);
  }

  const swipeA = swipe;
  const swipeB = swipes[0];

  const { clients, clusters } = clusterClients(state, swipeA, swipeB);

  return update(state, {
    swipes: { $set: [] },
    clients: { $set: clients },
    clusters: { $set: clusters },
  });
}

function getCoincidentSwipes (swipes) {
  return _.filter(swipes, ({ timestamp }) => (Date.now() - timestamp) < SWIPE_TOLERANCE);
}

function addSwipe (state, swipes, swipe) {
  const swipeWithTimestamp = update(swipe, { timestamp: { $set: Date.now() } });

  return update(state, {
    swipes: { $set: swipes.concat([swipeWithTimestamp]) },
  });
}

function clusterClients (state, swipeA, swipeB) {
  const clientA = state.clients[swipeA.id];
  const clientB = state.clients[swipeB.id];

  if (clientA.clusterId) {
    return joinCluster(state, clientA, swipeA, clientB, swipeB);
  }

  if (clientB.clusterId) {
    return joinCluster(state, clientB, swipeB, clientA, swipeA);
  }

  return createCluster(state, clientA, swipeA, clientB, swipeB);
}

function joinCluster (state, clientA, swipeA, clientB, swipeB) {
  return update(state, {
    clients: {
      [clientB.id]: {
        clusterId: { $set: clientA.clusterId },
        transform: { $set: getTransform(clientA, swipeA, clientB, swipeB) },
        connections: { $push: [swipeA.id] },
      },
      [clientA.id]: {
        connections: { $push: [swipeB.id] },
      },
    },
  });
}

function createCluster (state, clientA, swipeA, clientB, swipeB) {
  const clusterId = uid();

  return update(state, {
    clusters: { [clusterId]: { $set: {} } }, // TODO: custom cluster initialization
    clients: {
      [clientA.id]: {
        clusterId: { $set: clusterId },
        connections: { $push: [swipeB.id] },
      },
      [clientB.id]: {
        clusterId: { $set: clusterId },
        transform: { $set: getTransform(clientA, swipeA, clientB, swipeB) },
        connections: { $push: [swipeA.id] },
      },
    },
  });
}

function getTransform (clientA, swipeA, clientB, swipeB) {
  switch (swipeA.direction) {
    case 'LEFT':
      return {
        x: clientA.transform.x - clientB.size.width,
        y: clientA.transform.y + (swipeA.position.y - swipeB.position.y),
      };

    case 'RIGHT':
      return {
        x: clientA.transform.y + clientA.size.width,
        y: clientA.transform.y + (swipeA.position.y - swipeB.position.y),
      };

    case 'UP':
      return {
        x: clientA.transform.x + (swipeA.position.x - swipeB.position.x),
        y: clientA.transform.y - clientB.size.height,
      };

    case 'DOWN':
      return {
        x: clientA.transform.x + (swipeA.position.x - swipeB.position.x),
        y: clientA.transform.y + clientA.size.height,
      };

    default:
      throw new Error(`Invalid direction: ${swipeA.direction}`);
  }
}

function leaveCluster (state, { id }) {
  const { clients, clusters } = state;
  const client = state.clients[id];
  const clusterId = client.clusterId;

  return update(state, {
    clusters: { $set: removeEmptyCluster(clusters, clients, clusterId) },
    clients: { [id]: { clusterId: { $set: null } } },
  });
}


function reCluster (state, { id }) {
  const clusters = [];
  let currCluster = [];
  const rest = getClientsInCluster(state.clients[id].clusterId, state.clients);
  rest.splice(rest.indexOf(state.clients[id]), 1);

  while (rest.length > 0) {
    const check = [rest.shift()];

    while (check.length > 0) {
      const currClient = check.shift();

      const clientConnections = currClient.connections;

      _.filter(clientConnections, (clientId) => rest.indexOf(state.clients[clientId]) !== -1)
        .forEach((clientId) => {
          check.push(state.clients[clientId]);
          rest.splice(rest.indexOf(state.clients[clientId]), 1);
        });

      currCluster.push(currClient);
    }

    clusters.push(currCluster);
    currCluster = [];
  }

  const out = {};
  for (let i = 0; i < clusters.length; i++) {
    out[i] = state.clusters[state.clients[id].clusterId];
  }

  return update(state, {
    clusters: { $set: out },
  });
}

function removeEmptyCluster (clusters, clients, clusterId) {
  if (getClientsInCluster(clusterId, clients).length > 1) {
    return clusters;
  }

  return _.omit(clusters, [clusterId]);
}

function getClientsInCluster (clusterId, clients) {
  return _.filter(clients, (client) => client.clusterId === clusterId);
}

function disconnect (state, { id }) {
  const { clients, clusters } = state;
  const client = state.clients[id];
  const clusterId = client.clusterId;

  return update(state, {
    clusters: { $set: removeEmptyCluster(clusters, clients, clusterId) },
    clients: { $set: _.omit(state.clients, [id]) },
  });
}

reducer.reCluster = reCluster;

module.exports = reducer;
