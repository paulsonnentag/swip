/* global describe it beforeEach */
/*eslint-disable*/
const should = require('should');
/*eslint-enable*/
const redux = require('redux');
const actions = require('../src/actions');
const reducer = require('../src/reducer');

describe('store', () => {
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
    store = redux.createStore(reducer);
  });

  describe('connect', () => {
    it('should add client', () => {
      store.dispatch(actions.connect('a', DEVICE_A));

      store.getState().clients.should.eql({
        a: {
          id: 'a',
          transform: { x: 0, y: 0 },
          size: DEVICE_A.size,
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
        [clusterId]: {},
      });

      state.clients.a.transform.should.eql({ x: 300, y: -50 });
      state.clients.b.transform.should.eql({ x: 0, y: 0 });
    });

    it('should add client to existing cluster', () => {
      store.dispatch(actions.swipe('a', { position: { y: 150 }, direction: 'LEFT' }));
      store.dispatch(actions.swipe('b', { position: { y: 100 }, direction: 'RIGHT' }));
      store.dispatch(actions.swipe('a', { position: { x: 100 }, direction: 'UP' }));
      store.dispatch(actions.swipe('c', { position: { x: 100 }, direction: 'DOWN' }));

      const state = store.getState();

      state.clients.c.transform.should.eql({ x: 300, y: -250 });
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
          transform: { x: 0, y: 0 },
          size: DEVICE_B.size,
          id: 'b',
          clusterId: null,
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
