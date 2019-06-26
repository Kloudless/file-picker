const path = require('path');

const contextBase = path.resolve(__dirname, '../test/public/javascripts');

module.exports = {
  entry: {
    'file-explorer-test': path.resolve(contextBase, './file-explorer-test.js'),
  },
  resolve: {
    extensions: ['.js'],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [path.resolve(contextBase)],
      },
    ],
  },
  mode: 'development',
  devtool: '#source-map',
  output: {
    path: contextBase,
    publicPath: '/javascripts/',
    filename: '[name]-build.js',
  },
};
