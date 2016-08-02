const _ = require('lodash');

function getClientState (state, clientId) {
  const client = state.clients[clientId];

  if (client.clusterId === null || client.clusterId === undefined) {
    return { client };
  }

  return {
    client,
    cluster: getClusterState(state, client.clusterId),
  };
}

function getClusterState ({ clusters, clients }, clusterId) {
  const cluster = clusters[clusterId];
  return {
    id: cluster.id,
    data: cluster.data,
    clients: getClientsInCluster(clients, clusterId),
  };
}

function getClientsInCluster (clients, clusterId) {
  if (_.isNil(clusterId)) {
    return [];
  }

  return _.filter(clients, (client) => client.clusterId === clusterId);
}

module.exports = {
  getClientsInCluster,
  getClusterState,
  getClientState,
};
