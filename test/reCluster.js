/* global describe it beforeEach */
/*eslint-disable*/
const should = require('should');
const reCluster = require('../src/server/reducer').reCluster;
/*eslint-enable*/

const state = {
  clusters: { 1: {} },
  clients: {
    1: {
      id: 1,
      clusterId: 1,
      connections: [2],
    },
    2: {
      id: 2,
      clusterId: 1,
      connections: [1, 3],
    },
    3: {
      id: 3,
      clusterId: 1,
      connections: [2, 4],
    },
    4: {
      id: 4,
      clusterId: 1,
      connections: [3],
    },
  },
};

const state2 = {
  clusters: { 1: {} },
  clients: {
    1: {
      id: 1,
      clusterId: 1,
      connections: [2, 3],
    },
    2: {
      id: 2,
      clusterId: 1,
      connections: [1, 3, 5],
    },
    3: {
      id: 3,
      clusterId: 1,
      connections: [1, 2, 4],
    },
    4: {
      id: 4,
      clusterId: 1,
      connections: [3, 5],
    },
    5: {
      id: 5,
      clusterId: 1,
      connections: [2, 4, 6],
    },
    6: {
      id: 6,
      clusterId: 1,
      connections: [5, 7],
    },
    7: {
      id: 7,
      clusterId: 1,
      connections: [6],
    },
  },
};

const state3 = {
  clusters: { 1: {} },
  clients: {
    1: {
      id: 1,
      clusterId: 1,
      connections: [6],
    },
    2: {
      id: 2,
      clusterId: 1,
      connections: [6],
    },
    3: {
      id: 3,
      clusterId: 1,
      connections: [6],
    },
    4: {
      id: 4,
      clusterId: 1,
      connections: [6],
    },
    5: {
      id: 5,
      clusterId: 1,
      connections: [6],
    },
    6: {
      id: 6,
      clusterId: 1,
      connections: [1, 2, 3, 4, 5],
    },
  },
};


describe.skip('reCluster', () => {
  it('should reCluster the cluster into 2 pieces', () => {
    const out = reCluster(state, state.clients[2]);

    Object.keys(out.clusters).length.should.equal(2);
  });

  it('should reCluster the cluster into 1 pieces', () => {
    const out = reCluster(state2, state2.clients[2]);

    Object.keys(out.clusters).length.should.equal(1);
  });

  it('should reCluster the cluster into 2 pieces', () => {
    const out = reCluster(state2, state2.clients[5]);

    Object.keys(out.clusters).length.should.equal(2);
  });

  it('should reCluster the starCluster into 5 pieces', () => {
    const out = reCluster(state3, state3.clients[6]);

    Object.keys(out.clusters).length.should.equal(5);
  });
});
