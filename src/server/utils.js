const _ = require('lodash');

function getClientEventState ({ clusters, clients }, clientId) {
  const client = clients[clientId];

  if (client.clusterId === null || client.clusterId === undefined) {
    return { client };
  }

  const cluster = clusters[client.clusterId];
  const clusterClients = getClientsInCluster(clients, client.clusterId);

  return {
    client,
    cluster: {
      clients: clusterClients,
      data: cluster.data,
    },
  };
}

function getClientsInCluster (clients, clusterId) {
  if (clusterId === undefined || clusterId === null) {
    return [];
  }

  return _.filter(clients, (client) => client.clusterId === clusterId);
}

module.exports = {
  getClientsInCluster,
  getClientEventState,
};
