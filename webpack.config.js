const path = require('path');

module.exports = {
  entry: [
    './src/client/index.js',
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/',
  },
  module: {
    loaders: [{
      test: /\.js/,
      loaders: ['babel'],
      include: path.join(__dirname, 'src'),
    }],
  },
};