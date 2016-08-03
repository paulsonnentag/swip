const _ = require('lodash');

function getClientState (state, clientID) {
  const client = state.clients[clientID];

  if (_.isNil(client.clusterID)) {
    return { client };
  }

  return {
    client,
    cluster: getClusterState(state, client.clusterID),
  };
}

function getOpenings (clients, clientID) {
  const client = clients[clientID];
  const { transform, size, adjacentClientIDs } = client;
  const adjacentClients = lookupIDs(clients, adjacentClientIDs);
  const holes = {
    left: [],
    top: [],
    right: [],
    bottom: [],
  };

  adjacentClients.forEach((adjacentClient) => {
    const alignment = getAlignment(client, adjacentClient);
    const diffY = Math.abs(transform.y - adjacentClient.transform.y);
    const diffX = Math.abs(transform.x - adjacentClient.transform.x);

    switch (alignment) {
      case 'LEFT':
        if (transform.y < adjacentClient.transform.y
          && size.height > (adjacentClient.size.height + diffY)) {
          holes.right.push({
            start: diffY,
            end: diffY + adjacentClient.size.height,
          });
        } else if (transform.y > adjacentClient.transform.y) {
          holes.right.push({
            start: 0,
            end: adjacentClient.size.height - diffY,
          });
        } else {
          holes.right.push({
            start: diffY,
            end: size.height,
          });
        }
        break;

      case 'RIGHT':
        if (transform.y < adjacentClient.transform.y
          && size.height > (adjacentClient.size.height + diffY)) {
          holes.left.push({
            start: diffY,
            end: diffY + adjacentClient.size.height,
          });
        } else if (transform.y > adjacentClient.transform.y) {
          holes.left.push({
            start: 0,
            end: adjacentClient.size.height - diffY,
          });
        } else {
          holes.left.push({
            start: diffY,
            end: size.height,
          });
        }
        break;

      case 'TOP':
        if (transform.x < adjacentClient.transform.x
          && size.width > (adjacentClient.size.width + diffX)) {
          holes.bottom.push({
            start: diffX,
            end: adjacentClient.size.width + diffX,
          });
        } else if (transform.x > adjacentClient.transform.x) {
          holes.bottom.push({
            start: 0,
            end: adjacentClient.size.width - diffX,
          });
        } else {
          holes.bottom.push({
            start: diffX,
            end: size.width,
          });
        }
        break;

      case 'BOTTOM':
        if (transform.x < adjacentClient.transform.x
          && size.width > (adjacentClient.size.width + diffX)) {
          holes.top.push({
            start: diffX,
            end: adjacentClient.size.width + diffX,
          });
        } else if (transform.x > adjacentClient.transform.x) {
          holes.top.push({
            start: 0,
            end: adjacentClient.size.width - diffX,
          });
        } else {
          holes.top.push({
            start: diffX,
            end: size.width,
          });
        }
        break;

      default:
        throw new Error(`Invalid alignment ${alignment}`);
    }
  });

  return holes;
}

function getAlignment (client1, client2) {
  if (client2.transform.x >= (client1.transform.x + client1.size.width)) {
    return 'LEFT';
  } else if (client1.transform.x >= (client2.transform.x + client2.size.width)) {
    return 'RIGHT';
  } else if (client2.transform.y >= (client1.transform.y + client1.size.height)) {
    return 'TOP';
  } else if (client1.transform.y >= (client2.transform.y + client2.size.height)) {
    return 'BOTTOM';
  }

  throw new Error('Invalid placement of devices');
}

function getClusterState ({ clusters, clients }, clusterID) {
  const cluster = clusters[clusterID];
  return {
    id: cluster.id,
    data: cluster.data,
    clients: getClientsInCluster(clients, clusterID),
  };
}

function getClientsInCluster (clients, clusterID) {
  if (_.isNil(clusterID)) {
    return [];
  }

  return _.filter(clients, (client) => client.clusterID === clusterID);
}

function lookupIDs (objects, objectIDs) {
  return _.map(objectIDs, (objectID) => objects[objectID]);
}

module.exports = {
  getOpenings,
  getClientsInCluster,
  getClusterState,
  getClientState,
};
