const _ = require('lodash');
const uid = require('uid');
const update = require('immutability-helper');
const actions = require('./actions');
const utils = require('./utils');

const SWIPE_DELAY_TOLERANCE = 100;

const initialState = {
  clusters: {},
  clients: {},
  swipes: [],
};

function reducer (config) {
  return (state = initialState, { type, data }) => {
    switch (type) {
      case actions.TYPE.NEXT_STATE:
        return nextState(state);

      case actions.TYPE.CLIENT_ACTION:
        return clientAction(state, data);

      case actions.TYPE.CONNECT:
        return connect(state, data);

      case actions.TYPE.SWIPE:
        return doSwipe(state, data);

      /* case actions.TYPE.LEAVE_CLUSTER:
        return leaveCluster(state, data); */

      case actions.TYPE.DISCONNECT:
        return disconnect(state, data);

      default:
        return state;
    }
  };

  function nextState (state) {
    const updateClient = config.client.events.update;
    const updateCluster = config.cluster.events.update;
    const changes = {};

    if (_.isFunction(updateCluster)) {
      changes.clusters = getAllChanges(state.clusters, _.partial(getClusterChanges, state, updateCluster));
    }

    if (_.isFunction(updateClient)) {
      changes.clients = getAllChanges(state.clients, _.partial(getClientChanges, state, updateClient));
    }

    return update(state, changes);
  }

  function getAllChanges (entities, update) {
    const changes = _.map(entities, update);
    const ids = _.keys(entities);
    return _.zipObject(ids, changes);
  }

  function getClusterChanges (state, next, cluster) {
    const clusterState = utils.getClusterState(state, cluster.id);
    return { data: next(clusterState) };
  }

  function getClientChanges (state, next, client) {
    const clientState = utils.getClientState(state, client.id);
    return { data: next(clientState) };
  }

  function clientAction (state, { id, type, data }) {
    const handler = config.client.events[type];

    if (!_.isFunction(handler)) {
      throw new Error(`Unhandled event: ${type}`);
    }

    const client = state.clients[id];

    if (!client) {
      return state;
    }

    const clientEventState = utils.getClientState(state, client.id);
    const stateUpdates = handler(clientEventState, data);
    const changes = {};


    if (stateUpdates.cluster) {
      changes.clusters = {
        [client.clusterID]: stateUpdates.cluster,
      };
    }

    if (stateUpdates.client) {
      changes.clients = {
        [client.id]: stateUpdates.client,
      };
    }

    return update(state, changes);
  }

  function connect (state, { id, size }) {
    const clusterID = uid();
    const openings = {
      top: [],
      bottom: [],
      right: [],
      left: [],
    };
    const client = { id, size, transform: { x: 0, y: 0 }, adjacentClientIDs: [], clusterID, openings };

    const clientData = config.client.init(client);
    const clusterData = config.cluster.init(client);

    const changes = {
      clusters: {
        [clusterID]: { $set: { id: clusterID, data: clusterData } },
      },
      clients: {
        [id]: { $set: _.assign({}, client, { data: clientData }) },
      },
    };

    return update(state, changes);
  }

  function doSwipe (state, swipe) {
    const swipes = getCoincidentSwipes(state.swipes);

    if (swipes.length === 0) {
      return addSwipe(state, swipes, swipe);
    }

    const swipeA = swipe;
    const clientA = state.clients[swipeA.id];
    const swipeB = swipes[0];
    const clientB = state.clients[swipeB.id];

    if (clientA.clusterID === clientB.clusterID) {
      return clearSwipes(state);
    }

    const { clients, clusters } = mergeAndRecalculateClusters(state, clientA, swipeA, clientB, swipeB);

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

  function clearSwipes (state) {
    return update(state, { swipes: { $set: [] } });
  }

  function mergeAndRecalculateClusters (state, clientA, swipeA, clientB, swipeB) {
    const clusterStateA = utils.getClusterState(state, clientA.clusterID);
    const clusterStateB = utils.getClusterState(state, clientB.clusterID);

    return _.flow([
      _.partial(mergeClusters, _, clientA.id, swipeA, clientB.id, swipeB),
      _.partial(recalculateCluster, _, clientA.id, clientB.id, clusterStateA, clusterStateB),
    ])(state);
  }

  function mergeClusters (state, clientAID, swipeA, clientBID, swipeB) {
    const clientA = state.clients[clientAID];
    const clientB = state.clients[clientBID];
    const transform = getTransform(clientA, swipeA, clientB, swipeB);
    const clientsInCluster = utils.getClientsInCluster(state.clients, clientB.clusterID);

    const clientsBChanges = _(clientsInCluster)
      .reduce((changes, client) => {
        /* eslint-disable no-param-reassign */

        changes[client.id] = {
          clusterID: { $set: clientA.clusterID },
          transform: {
            $set: {
              x: client.transform.x + (transform.x - clientB.transform.x),
              y: client.transform.y + (transform.y - clientB.transform.y),
            },
          },
        };

        if (client.id === clientBID) {
          changes[client.id].adjacentClientIDs = { $push: [clientA.id] };
        }

        return changes;
        /* eslint-enable no-param-reassign */
      }, {});

    return update(state, {
      clusters: { $set: _.omit(state.clusters, clientB.clusterID) },
      clients: _.assign(
        {
          [clientAID]: {
            adjacentClientIDs: { $push: [clientB.id] },
          },
        },
        clientsBChanges
      ),
    });
  }

  function recalculateCluster (state, clientAID, clientBID, clusterStateA, clusterStateB) {
    const transform = state.clients[clientBID].transform;
    const clusterDataChanges = config.cluster.events.merge(clusterStateA, clusterStateB, transform);

    // recalculate openings and merge data of clusters
    return update(state, {
      clusters: {
        [clusterStateA.id]: { data: clusterDataChanges },
      },
      clients: {
        [clientAID]: {
          openings: { $set: utils.getOpenings(state.clients, state.clients[clientAID]) },
        },
        [clientBID]: {
          openings: { $set: utils.getOpenings(state.clients, state.clients[clientBID]) },
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
          x: clientA.transform.x + clientA.size.width,
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

    if (!client) {
      return state;
    }
    const clusterID = client.clusterID;

    if (_.isNil(clusterID)) {
      return state;
    }

    return update(state, {
      clusters: { $set: removeEmptyCluster(clusters, clients, clusterID) },
      clients: { [id]: { clusterID: { $set: null } } },
    });
  }

  function removeEmptyCluster (clusters, clients, clusterID) {
    if (utils.getClientsInCluster(clients, clusterID).length > 1) {
      return clusters;
    }

    return _.omit(clusters, [clusterID]);
  }

  function disconnect (state, { id }) {
    const { clients, clusters } = state;
    const client = clients[id];

    if (!client) {
      return state;
    }

    const clusterID = client.clusterID;

    return update(state, {
      clusters: { $set: removeEmptyCluster(clusters, clients, clusterID) },
      clients: { $set: removeClient(clients, client) },
    });
  }

  function removeClient (clients, client) {
    return _(clients)
      .omit(client.id)
      .mapValues((other) => {
        const newAdjacentClientIDs = _.without(other.adjacentClientIDs, client.id);
        const newClient = update(other, {
          adjacentClientIDs: { $set: newAdjacentClientIDs },
        });

        return update(other, {
          openings: { $set: utils.getOpenings(clients, newClient) },
          adjacentClientIDs: { $set: newAdjacentClientIDs },
        });
      })
      .value();
  }
}

module.exports = reducer;
