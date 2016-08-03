/* global describe it beforeEach */
const _ = require('lodash');
/*eslint-disable*/
const should = require('should');
const sinon = require('sinon');
require('should-sinon');
/*eslint-enable*/
const createReducer = require('../src/server/reducer');
const actions = require('../src/server/actions');


describe('reducer', () => {
  describe('NEXT_STATE', () => {
    const initalState = {
      clusters: {
        A: { id: 'A', data: { counter: 10 } },
      },
      clients: {
        a: { id: 'a', data: { counter: 0 }, clusterId: 'A' },
        b: { id: 'b', data: { counter: 2 }, clusterId: 'A' },
      },
    };

    const expectedCluster = {
      clients: [
        { clusterId: 'A', data: { counter: 0 }, id: 'a' },
        { clusterId: 'A', data: { counter: 2 }, id: 'b' },
      ],
      data: { counter: 10 },
      id: 'A',
    };

    function createUpdateReducer ({ updateClient, updateCluster }) {
      return createReducer({
        client: {
          events: {
            update: updateClient,
          },
        },

        cluster: {
          events: {
            update: updateCluster,
          },
        },
      });
    }

    it('should call client.events.update', () => {
      const update = sinon.spy(() => ({}));
      const reducer = createUpdateReducer({
        updateClient: update,
      });

      reducer(initalState, actions.nextState());

      update.should.be.calledTwice();
      update.getCall(0).args[0].should.eql({
        cluster: expectedCluster,
        client: {
          id: 'a',
          data: { counter: 0 },
          clusterId: 'A',
        },
      });
      update.getCall(1).args[0].should.eql({
        cluster: expectedCluster,
        client: {
          id: 'b',
          data: { counter: 2 },
          clusterId: 'A',
        },
      });
    });

    it('should call client.events.update', () => {
      const update = sinon.spy(() => ({}));
      const reducer = createUpdateReducer({
        updateCluster: update,
      });

      reducer(initalState, actions.nextState());

      update.should.be.calledOnce();
      update.getCall(0).args[0].should.eql(expectedCluster);
    });

    it('should update cluster state', () => {
      const reducer = createUpdateReducer({
        updateCluster: (cluster) => ({
          counter: { $set: cluster.data.counter + 1 },
        }),
      });

      const nextState = reducer(initalState, actions.nextState());

      nextState.clusters.A.should.have.property('data').which.eql({ counter: 11 });
    });

    it('should update client state', () => {
      const reducer = createUpdateReducer({
        updateClient: ({ client }) => ({
          counter: { $set: client.data.counter + 2 },
        }),
      });

      const nextState = reducer(initalState, actions.nextState());

      nextState.clients.a.should.have.property('data').which.eql({ counter: 2 });
      nextState.clients.b.should.have.property('data').which.eql({ counter: 4 });
    });

    it('should update client state and cluster state combined', () => {
      const reducer = createUpdateReducer({
        updateCluster: (cluster) => ({
          counter: { $set: cluster.data.counter + 1 },
        }),
        updateClient: ({ client }) => ({
          counter: { $set: client.data.counter + 2 },
        }),
      });

      const nextState = reducer(initalState, actions.nextState());

      nextState.clients.a.should.have.property('data').which.eql({ counter: 2 });
      nextState.clients.b.should.have.property('data').which.eql({ counter: 4 });
      nextState.clusters.A.should.have.property('data').which.eql({ counter: 11 });
    });
  });

  describe('CONNECT', () => {
    const state = {
      clusters: {},
      clients: {},
    };

    const expectedClient = {
      id: 'a',
      size: { width: 200, height: 300 },
      transform: { x: 0, y: 0 },
      adjacentClientIDs: [],
    };

    let newState, reducer, initClient, initCluster;

    beforeEach(() => {
      initClient = sinon.spy(() => {
        return { x : 'client' };
      });
      initCluster = sinon.spy(() => {
        return { x: 'cluster' };
      });
      reducer = createReducer({
        client: { init: initClient },
        cluster: { init: initCluster },
      });

      newState = reducer(state, actions.connect('a', { size: { width: 200, height: 300 } }));
    });

    it('should call initClient', () => {
      initClient.getCall(0).args[0].should.eql(expectedClient);
      initClient.should.be.calledOnce();
    });

    it('should call initCluster', () => {
      initCluster.getCall(0).args[0].should.eql(expectedClient);
      initCluster.should.be.calledOnce();
    });

    it.only('should add player with new cluster', () => {
      const clusterId = _.keys(newState.clusters)[0];

      newState.should.eql({
        clusters: {
          [clusterId]: { id: clusterId, data: { x: 'cluster' } },
        },
        clients: {
          a: {
            id: 'a',
            clusterID: clusterId,
            transform: { x: 0, y: 0 },
            size: { width: 200, height: 300 },
            adjacentClientIDs: [],
            data: { x: 'client' },
          },
        },
      });
    });
  });
});

