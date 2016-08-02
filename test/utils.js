/* global describe it beforeEach */
/*eslint-disable*/
const should = require('should');
const utils = require('../src/server/utils');
/*eslint-enable*/

let deviceA;
let deviceB;
let deviceC;
let deviceD;
let deviceE;
let state;

describe('getHoles', () => {
  describe('horizontal', () => {
    beforeEach(() => {
      deviceA = {
        id: 'a',
        clusterId: 'A',
        adjacentDevices: [],
        transform: { x: 0, y: 0 },
        size: { width: 300, height: 600 },
        data: {},
      };

      deviceB = {
        id: 'b',
        clusterId: 'A',
        adjacentDevices: [],
        transform: { x: 350, y: -100 },
        size: { width: 250, height: 300 },
        data: {},
      };

      deviceC = {
        id: 'c',
        clusterId: 'A',
        adjacentDevices: [],
        transform: { x: -300, y: -200 },
        size: { width: 250, height: 400 },
        data: {},
      };

      deviceD = {
        id: 'd',
        clusterId: 'A',
        adjacentDevices: [],
        transform: { x: 350, y: 100 },
        size: { width: 200, height: 100 },
        data: {},
      };

      deviceE = {
        id: 'e',
        clusterId: 'A',
        adjacentDevices: [],
        transform: { x: -300, y: 200 },
        size: { width: 250, height: 350 },
        data: {},
      };

      state = {
        clusters: { 1: {} },
        clients: {
          a: deviceA,
          b: deviceB,
          c: deviceC,
          d: deviceD,
          e: deviceE,
        },
      };
    });

    it('should return the holes - connected lowerLeft to upperRight', () => {
      deviceA.adjacentDevices.push(deviceB);
      deviceB.adjacentDevices.push(deviceA);

      const holesClientA = utils.getHoles(state.clients.a);
      const holesClientB = utils.getHoles(state.clients.b);

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
      deviceC.adjacentDevices.push(deviceA);
      deviceA.adjacentDevices.push(deviceC);

      const holesClientA = utils.getHoles(state.clients.a);
      const holesClientC = utils.getHoles(state.clients.c);

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
      deviceA.adjacentDevices.push(deviceD);
      deviceD.adjacentDevices.push(deviceA);

      const holesClientA = utils.getHoles(state.clients.a);
      const holesClientD = utils.getHoles(state.clients.d);

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
      deviceA.adjacentDevices.push(deviceE);
      deviceE.adjacentDevices.push(deviceA);

      const holesClientA = utils.getHoles(state.clients.a);
      const holesClientE = utils.getHoles(state.clients.e);

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
      deviceA = {
        id: 'a',
        clusterId: 'A',
        adjacentDevices: [],
        transform: { x: 0, y: 0 },
        size: { width: 400, height: 600 },
        data: {},
      };

      deviceB = {
        id: 'b',
        clusterId: 'A',
        adjacentDevices: [],
        transform: { x: 350, y: -350 },
        size: { width: 250, height: 300 },
        data: {},
      };

      deviceC = {
        id: 'c',
        clusterId: 'A',
        adjacentDevices: [],
        transform: { x: -300, y: -200 },
        size: { width: 250, height: 400 },
        data: {},
      };

      deviceD = {
        id: 'd',
        clusterId: 'A',
        adjacentDevices: [],
        transform: { x: 350, y: 100 },
        size: { width: 200, height: 100 },
        data: {},
      };

      deviceE = {
        id: 'e',
        clusterId: 'A',
        adjacentDevices: [],
        transform: { x: -300, y: 200 },
        size: { width: 250, height: 350 },
        data: {},
      };

      state = {
        clusters: { 1: {} },
        clients: {
          a: deviceA,
          b: deviceB,
          c: deviceC,
          d: deviceD,
          e: deviceE,
        },
      };
    });

    it('should return the holes - connected rightTop to leftBottom', () => {
      deviceA.adjacentDevices.push(deviceB);
      deviceB.adjacentDevices.push(deviceA);

      const holesClientA = utils.getHoles(state.clients.a);
      const holesClientB = utils.getHoles(state.clients.b);

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
  });
});
