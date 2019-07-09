/* Webpack config for dev-server */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const baseWebpackConfig = require('./webpack.base.conf');
const merge = require('./merge-strategy');
const getExplorerPagesPlugins = require('./explorer.pages.conf');

const devServerContentPath = path.resolve(__dirname, '../dev-server/');

const config = merge(baseWebpackConfig, {
  mode: 'development',
  devtool: '#source-map',
  entry: {
    index: './dev-server/index.js',
    'loader/loader': './src/loader/js/webpack/index',
    'explorer/explorer': './src/explorer/js/app',
  },
  output: {
    path: path.resolve(devServerContentPath, 'dist'),
    filename: '[name].js',
    // must be '/' here for HtmlWebpackPlugin to inject correct resource path
    // https://github.com/jantimon/html-webpack-plugin/issues/1009
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: require.resolve('jquery'),
        use: 'expose-loader?$!expose-loader?jQuery',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(devServerContentPath, 'index.ejs'),
      templateParameters: {
        distTest: false,
      },
      chunks: ['index'],
    }),
  ].concat(getExplorerPagesPlugins(
    'explorer/explorer',
    path.resolve(devServerContentPath, 'dist'),
  )),
});

module.exports = config;
