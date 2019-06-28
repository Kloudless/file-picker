const merge = require('webpack-merge');
const baseWebpackConfig = require('./webpack.base.conf');

module.exports = merge.strategy(
  {
    'module.rules': 'prepend',
  },
)(baseWebpackConfig, {
  mode: 'development',
  devtool: '#source-map',
  module: {
    rules: [
      {
        test: require.resolve('jquery'),
        loader: 'expose-loader?$!expose-loader?jQuery',
      },
    ],
  },
});
