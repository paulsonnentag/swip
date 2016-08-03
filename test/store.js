/* global describe it beforeEach */
/*eslint-disable*/
const should = require('should');
/*eslint-enable*/
const redux = require('redux');
const actions = require('../src/server/actions');
const getAppReducer = require('../src/server/reducer');

describe.skip('store', () => {
  const DEVICE_A = {
    size: { width: 400, height: 800 },
  };
  const DEVICE_B = {
    size: { width: 300, height: 600 },
  };
  const DEVICE_C = {
    size: { width: 400, height: 200 },
  };
  let store;

  beforeEach(() => {
    const reducer = getAppReducer({
      cluster: {
        init: (clients) => ({
          master: clients[0].id,
        }),
      },

      client: {
        init: (game, client) => ({
          n: game.clients.length,
          id: client.id,
        }),
      },
    });

    store = redux.createStore(reducer);
  });

  describe('connect', () => {
    it('should add client', () => {
      store.dispatch(actions.connect('a', DEVICE_A));

      store.getState().clients.should.eql({
        a: {
          id: 'a',
          data: {},
          transform: { x: 0, y: 0 },
          size: DEVICE_A.size,
          connections: [],
        },
      });
    });
  });

  describe('swipe', () => {
    beforeEach(() => {
      store.dispatch(actions.connect('a', DEVICE_A));
      store.dispatch(actions.connect('b', DEVICE_B));
      store.dispatch(actions.connect('c', DEVICE_C));
    });


    it('should cluster new clients', () => {
      store.dispatch(actions.swipe('a', { position: { y: 150 }, direction: 'LEFT' }));
      store.dispatch(actions.swipe('b', { position: { y: 100 }, direction: 'RIGHT' }));

      const state = store.getState();
      const clusterId = state.clients.a.clusterId;

      state.clusters.should.eql({
        [clusterId]: {
          id: clusterId,
          data: { master: 'b' },
        },
      });

      state.clients.a.transform.should.eql({ x: 300, y: -50 });
      state.clients.a.data.should.eql({ id: 'a', n: 2 });

      state.clients.b.transform.should.eql({ x: 0, y: 0 });
      state.clients.b.data.should.eql({ id: 'b', n: 2 });
      state.clients.b.data.should.eql({ id: 'b', n: 2 });
    });

    it('should add connectionIDs to clientObj connections', () => {
      store.dispatch(actions.swipe('a', { position: { y: 150 }, direction: 'LEFT' }));
      store.dispatch(actions.swipe('b', { position: { y: 100 }, direction: 'RIGHT' }));
      store.dispatch(actions.swipe('b', { position: { x: 100 }, direction: 'UP' }));
      store.dispatch(actions.swipe('c', { position: { x: 100 }, direction: 'DOWN' }));

      const state = store.getState();

      state.clients.a.connections.should.containDeep(['b']);
      state.clients.b.connections.should.containDeep(['a']);
      state.clients.b.connections.should.containDeep(['c']);
      state.clients.c.connections.should.containDeep(['b']);
    });

    it('should add client to existing cluster', () => {
      store.dispatch(actions.swipe('a', { position: { y: 150 }, direction: 'LEFT' }));
      store.dispatch(actions.swipe('b', { position: { y: 100 }, direction: 'RIGHT' }));
      store.dispatch(actions.swipe('a', { position: { x: 100 }, direction: 'UP' }));
      store.dispatch(actions.swipe('c', { position: { x: 100 }, direction: 'DOWN' }));

      const state = store.getState();

      state.clients.c.transform.should.eql({ x: 300, y: -250 });
      state.clients.c.data.should.eql({ id: 'c', n: 3 });
    });
  });

  describe('leave cluster', () => {
    beforeEach(() => {
      store.dispatch(actions.connect('a', DEVICE_A));
      store.dispatch(actions.connect('b', DEVICE_B));
      store.dispatch(actions.connect('c', DEVICE_C));

      store.dispatch(actions.swipe('a', { position: { y: 150 }, direction: 'LEFT' }));
      store.dispatch(actions.swipe('b', { position: { y: 100 }, direction: 'RIGHT' }));
      store.dispatch(actions.swipe('a', { position: { x: 100 }, direction: 'UP' }));
      store.dispatch(actions.swipe('c', { position: { x: 100 }, direction: 'DOWN' }));
    });

    it('should remove cluster if cluster has no clients', () => {
      store.dispatch(actions.leaveCluster('a'));
      store.dispatch(actions.leaveCluster('b'));
      store.dispatch(actions.leaveCluster('c'));

      const state = store.getState();

      state.clusters.should.eql({});
    });

    it('should remove client from cluster', () => {
      store.dispatch(actions.leaveCluster('b'));

      const state = store.getState();

      state.clients
        .should.have.property('b')
        .which.is.eql({
          data: { id: 'b', n: 2},
          transform: { x: 0, y: 0 },
          size: DEVICE_B.size,
          id: 'b',
          clusterId: null,
          connections: state.clients.b.connections,
        });
    });
  });

  describe('disconnect client', () => {
    beforeEach(() => {
      store.dispatch(actions.connect('a', DEVICE_A));
      store.dispatch(actions.connect('b', DEVICE_B));
      store.dispatch(actions.connect('c', DEVICE_C));

      store.dispatch(actions.swipe('a', { position: { y: 150 }, direction: 'LEFT' }));
      store.dispatch(actions.swipe('b', { position: { y: 100 }, direction: 'RIGHT' }));
      store.dispatch(actions.swipe('a', { position: { x: 100 }, direction: 'UP' }));
      store.dispatch(actions.swipe('c', { position: { x: 100 }, direction: 'DOWN' }));
    });

    it('should remove cluster if cluster has no clients', () => {
      store.dispatch(actions.leaveCluster('a'));
      store.dispatch(actions.leaveCluster('b'));
      store.dispatch(actions.leaveCluster('c'));

      const state = store.getState();

      state.clusters.should.eql({});
    });

    it('should remove client from cluster', () => {
      store.dispatch(actions.disconnect('b'));

      const state = store.getState();

      state.clients.should.not.have.property('b');
    });
  });
});
