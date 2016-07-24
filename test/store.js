/* global describe it beforeEach */
const should = require('should');
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

  describe('join', () => {
    it('should add device', () => {
      store.dispatch(actions.join('a', DEVICE_A));

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
      store.dispatch(actions.join('a', DEVICE_A));
      store.dispatch(actions.join('b', DEVICE_B));
      store.dispatch(actions.join('c', DEVICE_C));
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

    it('should cluster client to existing cluster', () => {
      store.dispatch(actions.swipe('a', { position: { y: 150 }, direction: 'LEFT' }));
      store.dispatch(actions.swipe('b', { position: { y: 100 }, direction: 'RIGHT' }));
      store.dispatch(actions.swipe('a', { position: { x: 100 }, direction: 'UP' }));
      store.dispatch(actions.swipe('c', { position: { x: 100 }, direction: 'DOWN' }));

      const state = store.getState();

      state.clients.c.transform.should.eql({ x: 300, y: -250});
    });
  });
});
