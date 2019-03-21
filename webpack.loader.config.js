const path = require('path');

const baseConfig = {
  context: path.resolve(__dirname, './'),
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
        include: [path.resolve(__dirname, './src')],
      },
    ],
  },
};

module.exports = [
  {
    ...baseConfig,
    mode: 'development',
    output: {
      path: path.resolve(__dirname, 'dist/loader/js/'),
      filename: '[name].js',
    },
  },
  {
    ...baseConfig,
    mode: 'production',
    output: {
      path: path.resolve(__dirname, 'dist/loader/js/'),
      filename: '[name].min.js',
    },
  },
];
