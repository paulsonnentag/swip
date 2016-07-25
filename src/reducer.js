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
      [id]: { $set: { id, size, transform: { x: 0, y: 0 } } }, // TODO: custom client init
    },
  });
}

function doSwipe (state, swipe) {
  const swipes = getCoincidentSwipes(state.swipes);

  if (swipes.length === 0) {
    return addSwipe(state, swipes, swipe);
  }

  const { clients, clusters } = clusterClients(state, swipe, swipes[0]);

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
    return joinCluster(state, clientB, swipeB, clientA, swipeB);
  }

  return createCluster(state, clientA, swipeA, clientB, swipeB);
}

function joinCluster (state, clientA, swipeA, clientB, swipeB) {
  return update(state, {
    clients: {
      [clientB.id]: {
        clusterId: { $set: clientA.clusterId },
        transform: { $set: getTransform(clientA, swipeA, clientB, swipeB) },
      },
    },
  });
}

function createCluster (state, clientA, swipeA, clientB, swipeB) {
  const clusterId = uid();

  return update(state, {
    clusters: { [clusterId]: { $set: {} } }, // TODO: custom cluster initialization
    clients: {
      [clientA.id]: { clusterId: { $set: clusterId } },
      [clientB.id]: {
        clusterId: { $set: clusterId },
        transform: { $set: getTransform(clientA, swipeA, clientB, swipeB) },
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

module.exports = reducer;
