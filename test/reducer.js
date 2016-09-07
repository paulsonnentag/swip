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
        a: { id: 'a', data: { counter: 0 }, clusterID: 'A' },
        b: { id: 'b', data: { counter: 2 }, clusterID: 'A' },
      },
    };

    const expectedCluster = {
      clients: [
        { clusterID: 'A', data: { counter: 0 }, id: 'a' },
        { clusterID: 'A', data: { counter: 2 }, id: 'b' },
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
          clusterID: 'A',
        },
      });
      update.getCall(1).args[0].should.eql({
        cluster: expectedCluster,
        client: {
          id: 'b',
          data: { counter: 2 },
          clusterID: 'A',
        },
      });
    });

    it('should call cluster.events.update', () => {
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

    let newState;
    let reducer;
    let initClient;
    let initCluster;
    let clusterID;
    let expectedClient;

    beforeEach(() => {
      initClient = sinon.spy(() => {
        return { x: 'client' };
      });
      initCluster = sinon.spy(() => {
        return { x: 'cluster' };
      });
      reducer = createReducer({
        client: { init: initClient },
        cluster: { init: initCluster },
      });
      newState = reducer(state, actions.connect('a', { size: { width: 200, height: 300 } }));
      clusterID = _.keys(newState.clusters)[0];
      expectedClient = {
        id: 'a',
        clusterID,
        size: { width: 200, height: 300 },
        transform: { x: 0, y: 0 },
        adjacentClientIDs: [],
        openings: {
          top: [],
          bottom: [],
          left: [],
          right: [],
        },
      };
    });

    it('should call initClient', () => {
      initClient.getCall(0).args[0].should.eql(expectedClient);
      initClient.should.be.calledOnce();
    });

    it('should call initCluster', () => {
      initCluster.getCall(0).args[0].should.eql(expectedClient);
      initCluster.should.be.calledOnce();
    });

    it('should add player with new cluster', () => {


      newState.should.eql({
        clusters: {
          [clusterID]: { id: clusterID, data: { x: 'cluster' } },
        },
        clients: {
          a: _.assign({}, expectedClient, { data: { x: 'client' } }),
        },
      });
    });
  });

  describe('SWIPE', () => {
    let initialState;
    let clientA;
    let clientB;
    let reducer;
    let merge;

    beforeEach(() => {
      merge = sinon.spy((cluster, otherCluster) => ({
        sum: { $set: cluster.data.sum + otherCluster.data.sum },
      }));

      clientA = {
        id: 'a',
        clusterID: 'A',
        transform: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        adjacentClientIDs: [],
        data: {},
      };

      clientB = {
        id: 'b',
        clusterID: 'B',
        transform: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        adjacentClientIDs: [],
        data: {},
      };

      initialState = {
        clusters: {
          A: { id: 'A', data: { sum: 2 } },
          B: { id: 'B', data: { sum: 3 } },
        },
        clients: {
          a: clientA,
          b: clientB,
        },
      };

      reducer = createReducer({
        client: { init: () => {} },
        cluster: {
          init: () => {},
          events: { merge },
        },
      });
    });

    describe('swipe handling', () => {
      it('should save first swipe', () => {
        const state = reducer(initialState, actions.swipe('a', { direction: 'LEFT', position: { x: 0, y: 20 } }));

        state.should.have.property('swipes').which.eql([{
          direction: 'LEFT',
          id: 'a',
          position: {
            x: 0,
            y: 20,
          },
          timestamp: state.swipes[0].timestamp,
        }]);
      });

      it('should only save latest swipe if delay is too big', (done) => {
        const state1 = reducer(initialState, actions.swipe('a', { direction: 'LEFT', position: { x: 0, y: 20 } }));

        setTimeout(() => {
          const state2 = reducer(state1, actions.swipe('b', { direction: 'RIGHT', position: { x: 100, y: 20 } }));

          state2.should.have.property('swipes').which.eql([{
            direction: 'RIGHT',
            id: 'b',
            position: {
              x: 100,
              y: 20,
            },
            timestamp: state2.swipes[0].timestamp,
          }]);

          done();
        }, 100);
      });
    });

    describe('merge of two clusters', () => {
      let state1;
      let state2;

      beforeEach(() => {
        state1 = reducer(initialState, actions.swipe('a', { direction: 'RIGHT', position: { x: 100, y: 20 } }));
        state2 = reducer(state1, actions.swipe('b', { direction: 'LEFT', position: { x: 0, y: 20 } }));
      });

      it('should remove second cluster', () => {
        state2.should.not.have.propertyByPath('clusters', 'A');
      });

      it('should update adjacentClientIDs in each client', () => {
        state2.should.have.propertyByPath('clients', 'a', 'adjacentClientIDs').which.eql(['b']);
        state2.should.have.propertyByPath('clients', 'b', 'adjacentClientIDs').which.eql(['a']);
      });

      it('should recalculate transform of joined client', () => {
        state2.should.have.propertyByPath('clients', 'a', 'transform').which.eql({ x: -100, y: 0 });
      });

      it('should update clusterID of joined client', () => {
        state2.should.have.propertyByPath('clients', 'a', 'clusterID').which.eql('B');
      });

      it('should call merge handler with both clusters', () => {
        merge.should.be.calledOnce();
        merge.getCall(0).args.should.eql([
          { data: { sum: 3 }, id: 'B', clients: [clientB] },
          { data: { sum: 2 }, id: 'A', clients: [clientA] },
        ]);
      });

      it('should merge state', () => {
        state2.should.have.propertyByPath('clusters', 'B', 'data').which.eql({ sum: 5 });
      });

      it('should recalculate openings', () => {
        state2.should.have.propertyByPath('clients', 'a', 'openings').which.eql({
          bottom: [],
          left: [],
          right: [{ end: 100, start: 0 }],
          top: [],
        });
        state2.should.have.propertyByPath('clients', 'b', 'openings').which.eql({
          bottom: [],
          left: [{ end: 100, start: 0 }],
          right: [],
          top: [],
        });
      });
    });
  });

  describe('LEAVE_CLUSTER', () => {



  });
});

