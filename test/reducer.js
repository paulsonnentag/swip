/* global describe it beforeEach */

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
  });
});

