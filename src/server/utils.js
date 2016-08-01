const _ = require('lodash');

function getClientEventState ({ clusters, clients }, clientId) {
  const client = clients[clientId];
  const cluster = clusters[client.clusterId];
  const clusterClients = getClientsInCluster(clients, client.clusterId);

  return {
    client,
    cluster: {
      clients: clusterClients,
      data: cluster,
    },
  };
}

function getClientsInCluster (clients, clusterId) {
  return _.filter(clients, (client) => client.clusterId === clusterId);
}

module.exports = {
  getClientsInCluster,
  getClientEventState,
};
