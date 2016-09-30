const _ = require('lodash');

const MAX_LOG_SIZE = 25;

let log = [];

function debugMiddleware ({ getState }) {

  return (next) =>
    (action) => {
      const prevState = getState();
      const result = next(action);
      const nextState = getState();

      log = addToLog(log, { action, prevState, nextState });

      return result;
    };
}

function addToLog (l, entry) {
  return [entry].concat(l).slice(0, MAX_LOG_SIZE);
}

module.exports = debugMiddleware;
