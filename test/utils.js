/* global describe it beforeEach */
/*eslint-disable*/
const should = require('should');
const utils = require('../src/server/utils');
/*eslint-enable*/


describe('utils', () => {
  describe('getOpenings', () => {
    let clientA;
    let clientB;
    let clientC;
    let clientD;
    let clientE;
    let state;

    describe('horizontal', () => {
      beforeEach(() => {
        clientA = {
          id: 'a',
          clusterID: 'A',
          adjacentClientIDs: [],
          transform: { x: 0, y: 0 },
          size: { width: 300, height: 600 },
          data: {},
        };

        clientB = {
          id: 'b',
          clusterID: 'A',
          adjacentClientIDs: [],
          transform: { x: 350, y: -100 },
          size: { width: 250, height: 300 },
          data: {},
        };

        clientC = {
          id: 'c',
          clusterID: 'A',
          adjacentClientIDs: [],
          transform: { x: -300, y: -200 },
          size: { width: 250, height: 400 },
          data: {},
        };

        clientD = {
          id: 'd',
          clusterID: 'A',
          adjacentClientIDs: [],
          transform: { x: 350, y: 100 },
          size: { width: 200, height: 100 },
          data: {},
        };

        clientE = {
          id: 'e',
          clusterID: 'A',
          adjacentClientIDs: [],
          transform: { x: -300, y: 200 },
          size: { width: 250, height: 350 },
          data: {},
        };

        state = {
          clusters: { 1: {} },
          clients: {
            a: clientA,
            b: clientB,
            c: clientC,
            d: clientD,
            e: clientE,
          },
        };
      });

      it('should return the holes - connected lowerLeft to upperRight', () => {
        clientA.adjacentClientIDs.push('b');
        clientB.adjacentClientIDs.push('a');

        const holesClientA = utils.getOpenings(state.clients, state.clients.a);
        const holesClientB = utils.getOpenings(state.clients, state.clients.b);

        holesClientA.should.eql({
          left: [],
          top: [],
          right: [{ start: 0, end: 200 }],
          bottom: [],
        });

        holesClientB.should.eql({
          left: [{ start: 100, end: 300 }],
          top: [],
          right: [],
          bottom: [],
        });
      });

      it('should return the holes - connected upperLeft to lowerRight', () => {
        clientC.adjacentClientIDs.push('a');
        clientA.adjacentClientIDs.push('c');

        const holesClientA = utils.getOpenings(state.clients, state.clients.a);
        const holesClientC = utils.getOpenings(state.clients, state.clients.c);

        holesClientA.should.eql({
          left: [{ start: 0, end: 200 }],
          top: [],
          right: [],
          bottom: [],
        });

        holesClientC.should.eql({
          left: [],
          top: [],
          right: [{ start: 200, end: 400 }],
          bottom: [],
        });
      });

      it('should return the holes - connected bigLeft to smallRight', () => {
        clientA.adjacentClientIDs.push('d');
        clientD.adjacentClientIDs.push('a');

        const holesClientA = utils.getOpenings(state.clients, state.clients.a);
        const holesClientD = utils.getOpenings(state.clients, state.clients.d);

        holesClientA.should.eql({
          left: [],
          top: [],
          right: [{ start: 100, end: 200 }],
          bottom: [],
        });

        holesClientD.should.eql({
          left: [{ start: 0, end: 500 }],
          top: [],
          right: [],
          bottom: [],
        });
      });

      it('should return the holes - connected smallLeft to bigRight', () => {
        clientA.adjacentClientIDs.push('e');
        clientE.adjacentClientIDs.push('a');

        const holesClientA = utils.getOpenings(state.clients, state.clients.a);
        const holesClientE = utils.getOpenings(state.clients, state.clients.e);

        holesClientA.should.eql({
          left: [{ start: 200, end: 550 }],
          top: [],
          right: [],
          bottom: [],
        });

        holesClientE.should.eql({
          left: [],
          top: [],
          right: [{ start: 0, end: 400 }],
          bottom: [],
        });
      });
    });

    describe('vertical', () => {
      beforeEach(() => {
        clientA = {
          id: 'a',
          clusterID: 'A',
          adjacentClientIDs: [],
          transform: { x: 0, y: 0 },
          size: { width: 400, height: 600 },
          data: {},
        };

        clientB = {
          id: 'b',
          clusterID: 'A',
          adjacentClientIDs: [],
          transform: { x: 350, y: -350 },
          size: { width: 250, height: 300 },
          data: {},
        };

        clientC = {
          id: 'c',
          clusterID: 'A',
          adjacentClientIDs: [],
          transform: { x: -300, y: -450 },
          size: { width: 450, height: 400 },
          data: {},
        };

        clientD = {
          id: 'd',
          clusterID: 'A',
          adjacentClientIDs: [],
          transform: { x: 100, y: -350 },
          size: { width: 200, height: 300 },
          data: {},
        };

        clientE = {
          id: 'e',
          clusterID: 'A',
          adjacentClientIDs: [],
          transform: { x: -100, y: 650 },
          size: { width: 800, height: 350 },
          data: {},
        };

        state = {
          clusters: { 1: {} },
          clients: {
            a: clientA,
            b: clientB,
            c: clientC,
            d: clientD,
            e: clientE,
          },
        };
      });

      it('should return the holes - connected rightTop to leftBottom', () => {
        clientA.adjacentClientIDs.push('b');
        clientB.adjacentClientIDs.push('a');

        const holesClientA = utils.getOpenings(state.clients, state.clients.a);
        const holesClientB = utils.getOpenings(state.clients, state.clients.b);

        holesClientA.should.eql({
          left: [],
          top: [{ start: 350, end: 400 }],
          right: [],
          bottom: [],
        });

        holesClientB.should.eql({
          left: [],
          top: [],
          right: [],
          bottom: [{ start: 0, end: 50 }],
        });
      });

      it('should return the holes - connected leftTop to rightBottom', () => {
        clientA.adjacentClientIDs.push('c');
        clientC.adjacentClientIDs.push('a');

        const holesClientA = utils.getOpenings(state.clients, state.clients.a);
        const holesClientC = utils.getOpenings(state.clients, state.clients.c);

        holesClientA.should.eql({
          left: [],
          top: [{ start: 0, end: 150 }],
          right: [],
          bottom: [],
        });

        holesClientC.should.eql({
          left: [],
          top: [],
          right: [],
          bottom: [{ start: 300, end: 450 }],
        });
      });

      it('should return the holes - connected smallTop to largeBottom', () => {
        clientA.adjacentClientIDs.push('d');
        clientD.adjacentClientIDs.push('a');

        const holesClientA = utils.getOpenings(state.clients, state.clients.a);
        const holesClientD = utils.getOpenings(state.clients, state.clients.d);

        holesClientA.should.eql({
          left: [],
          top: [{ start: 100, end: 300 }],
          right: [],
          bottom: [],
        });

        holesClientD.should.eql({
          left: [],
          top: [],
          right: [],
          bottom: [{ start: 0, end: 300 }],
        });
      });

      it('should return the holes - connected largeTop to smallBottom', () => {
        clientA.adjacentClientIDs.push('e');
        clientE.adjacentClientIDs.push('a');

        const holesClientA = utils.getOpenings(state.clients, state.clients.a);
        const holesClientE = utils.getOpenings(state.clients, state.clients.e);

        holesClientA.should.eql({
          left: [],
          top: [],
          right: [],
          bottom: [{ start: 0, end: 700 }],
        });

        holesClientE.should.eql({
          left: [],
          top: [{ start: 100, end: 500 }],
          right: [],
          bottom: [],
        });
      });
    });
  });
});
