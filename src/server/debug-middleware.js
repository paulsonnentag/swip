const MAX_LOG_SIZE = 25;

let log = [];

function debugMiddleware ({ getState }) {
  return (next) =>
    (action) => {
      let result;
      const prevState = getState();

      try {
        result = next(action);
      } catch (e) {
        console.log('=============================');
        console.log(JSON.stringify(addToLog(log, { nextState: getState(), prevState, action })));
        console.log('=============================');
        console.log(e.message);
        console.log(e.stack);
        console.log('=============================');

        process.exit();
      }

      const nextState = getState();

      log = addToLog(log, { action, prevState, nextState });

      return result;
    };
}

function addToLog (l, entry) {
  return [entry].concat(l).slice(0, MAX_LOG_SIZE);
}

module.exports = debugMiddleware;
