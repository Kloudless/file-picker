const path = require('path');
const root = path.resolve(__dirname, '../');

const baseConfig = {
  context: root,
  entry: {
    loader: './src/loader/js/webpack/index.js',
  },
  resolve: {
    extensions: ['.js'],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [path.resolve(root, './src')],
      },
    ],
  },
};

module.exports = [
  {
    ...baseConfig,
    mode: 'development',
    output: {
      path: path.resolve(root, 'dist/loader/js/'),
      filename: '[name].js',
    },
    devtool: '#source-map',
  },
  {
    ...baseConfig,
    mode: 'production',
    output: {
      path: path.resolve(root, 'dist/loader/js/'),
      filename: '[name].min.js',
    },
    devtool: undefined,
  },
];
