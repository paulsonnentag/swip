const redux = require('redux');
const reducer = require('./reducer');

const store = redux.createStore(reducer);

module.exports = store;
