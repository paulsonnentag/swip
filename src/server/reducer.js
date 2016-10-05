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

function createReducer (config) {
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

      case actions.TYPE.DISCONNECT:
        return disconnect(state, data);

      case actions.TYPE.RECONNECT:
        return reconnect(state, data);

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
    const transform = getTransform(clientA, swipeA, clientB, swipeB);

    return _.flow([
      _.partial(mergeClusterData, _, transform, clientA.id, clientB.id),
      _.partial(moveClientsToNewCluster, _, transform, clientA.id, clientB.id),
      _.partial(recalculateOpenings, _, clientA.id, clientB.id),
    ])(state);
  }

  function mergeClusterData (state, transform, clientAID, clientBID) {
    const newClusterID = state.clients[clientAID].clusterID;
    const oldClusterID = state.clients[clientBID].clusterID;
    const clusterStateA = utils.getClusterState(state, newClusterID);
    const clusterStateB = utils.getClusterState(state, oldClusterID);
    const clusterDataChanges = config.cluster.events.merge(clusterStateA, clusterStateB, transform);

    return update(state, {
      clusters: {
        [newClusterID]: { data: clusterDataChanges },
      },
    });
  }

  function moveClientsToNewCluster (state, transform, clientAID, clientBID) {
    const oldClusterID = state.clients[clientBID].clusterID;

    return update(state, {
      clusters: { $set: _.omit(state.clusters, oldClusterID) },
      clients: _.assign(
        {
          [clientAID]: {
            adjacentClientIDs: { $push: [clientBID] },
          },
        },
        getClientsBChanges(state, transform, clientAID, clientBID)
      ),
    });
  }

  function getClientsBChanges (state, transform, clientAID, clientBID) {
    const newClusterID = state.clients[clientAID].clusterID;
    const oldClusterID = state.clients[clientBID].clusterID;

    const clientsInCluster = utils.getClientsInCluster(state.clients, oldClusterID);

    return _.reduce(clientsInCluster, (changes, client) => {
      /* eslint-disable no-param-reassign */

      changes[client.id] = {
        clusterID: { $set: newClusterID },
        transform: {
          $set: {
            x: client.transform.x + transform.x,
            y: client.transform.y + transform.y,
          },
        },
      };

      if (client.id === clientBID) {
        changes[client.id].adjacentClientIDs = { $push: [clientAID] };
      }

      return changes;
      /* eslint-enable no-param-reassign */
    }, {});
  }

  function recalculateOpenings (state, clientAID, clientBID) {
    return update(state, {
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
          x: (clientA.transform.x - clientB.size.width) - clientB.transform.x,
          y: (clientA.transform.y + (swipeA.position.y - swipeB.position.y)) - clientB.transform.y,
        };
      case 'RIGHT':
        return {
          x: (clientA.transform.x + clientA.size.width) - clientB.transform.x,
          y: (clientA.transform.y + (swipeA.position.y - swipeB.position.y)) - clientB.transform.y,
        };

      case 'UP':
        return {
          x: (clientA.transform.x + (swipeA.position.x - swipeB.position.x)) - clientB.transform.x,
          y: (clientA.transform.y - clientB.size.height) - clientB.transform.y,
        };

      case 'DOWN':
        return {
          x: (clientA.transform.x + (swipeA.position.x - swipeB.position.x)) - clientB.transform.x,
          y: (clientA.transform.y + clientA.size.height) - clientB.transform.y,
        };

      default:
        throw new Error(`Invalid direction: ${swipeA.direction}`);
    }
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

  function removeEmptyCluster (clusters, clients, clusterID) {
    if (utils.getClientsInCluster(clients, clusterID).length > 1) {
      return clusters;
    }

    return _.omit(clusters, [clusterID]);
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

  function reconnect (state, { id, size }) {
    return _.flow([
      _.partial(disconnect, _, { id }),
      _.partial(connect, _, { id, size }),
    ])(state);
  }
}

module.exports = createReducer;
