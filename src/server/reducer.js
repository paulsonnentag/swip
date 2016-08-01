const _ = require('lodash');
const utils = require('./utils');
const uid = require('uid');
const update = require('immutability-helper');
const actions = require('./actions');

const SWIPE_DELAY_TOLERANCE = 50;

const initialState = {
  clusters: {},
  clients: {},
  swipes: [],
};

function reducer (config) {
  return (state = initialState, { type, data }) => {
    switch (type) {
      case actions.TYPE.CLIENT_ACTION:
        return clientAction(state, data);

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
  };

  function clientAction (state, { id, type, data }) {
    const handler = config.client.events[type];

    if (!_.isFunction(handler)) {
      throw new Error(`Unhandled event: ${type}`);
    }

    const client = state.clients[id];
    const clientEventState = utils.getClientEventState(state, client.id);
    const { newCluster, newClient } = handler(clientEventState, data);

    return update(state, {
      clusters: {
        [client.clusterId]: { $set: newCluster },
      },

      clients: {
        [client.id]: { $set: newClient },
      },
    });
  }

  function connect (state, { id, size }) {
    return update(state, {
      clients: {
        [id]: { $set: { id, size, transform: { x: 0, y: 0 }, data: {} } },
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
    return _.filter(swipes, ({ timestamp }) => (Date.now() - timestamp) < SWIPE_DELAY_TOLERANCE);
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
    const { clusters, clients } = state;
    const clusterId = clientA.clusterId;
    const cluster = {
      data: clusters[clusterId],
      clients: utils.getClientsInCluster(clients, clusterId).concat([clientB]),
    };
    const clientData = config.client.init(cluster, clientB);

    return update(state, {
      clients: {
        [clientB.id]: {
          clusterId: { $set: clusterId },
          data: { $set: clientData },
          transform: { $set: getTransform(clientA, swipeA, clientB, swipeB) },
        },
      },
    });
  }

  function createCluster (state, clientA, swipeA, clientB, swipeB) {
    const clusterId = uid();
    const clusterData = config.cluster.init([clientA, clientB]);
    const cluster = {
      data: clusterData,
      clients: [clientA, clientB],
    };

    const clientAData = config.client.init(cluster, clientA);
    const clientBData = config.client.init(cluster, clientB);

    return update(state, {
      clusters: {
        [clusterId]: {
          data: { $set: clusterData },
          id: { $set: clusterId },
        },
      },
      clients: {
        [clientA.id]: {
          clusterId: { $set: clusterId },
          data: { $set: clientAData },
        },
        [clientB.id]: {
          clusterId: { $set: clusterId },
          data: { $set: clientBData },
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

    if (clusterId == null) {
      return state;
    }

    return update(state, {
      clusters: { $set: removeEmptyCluster(clusters, clients, clusterId) },
      clients: { [id]: { clusterId: { $set: null } } },
    });
  }

  function removeEmptyCluster (clusters, clients, clusterId) {
    if (utils.getClientsInCluster(clients, clusterId).length > 1) {
      return clusters;
    }

    return _.omit(clusters, [clusterId]);
  }

  function disconnect (state, { id }) {
    const { clients, clusters } = state;
    const client = clients[id];

    if (!client) {
      return state;
    }

    const clusterId = client.clusterId;

    return update(state, {
      clusters: { $set: removeEmptyCluster(clusters, clients, clusterId) },
      clients: { $set: _.omit(state.clients, [id]) },
    });
  }
}

module.exports = reducer;
