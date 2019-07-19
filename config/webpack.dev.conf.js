/* Webpack config for dev-server */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const getCopyFilesPlugin = require('./copy-files-plugin');
const explorePageScriptPlugin = require('./explorer-page-script-plugin');
const baseWebpackConfig = require('./webpack.base.conf');
const merge = require('./merge-strategy');

const devServerContentPath = path.resolve(__dirname, '../dev-server/');

const config = merge(baseWebpackConfig, {
  mode: 'development',
  devtool: '#source-map',
  entry: {
    index: './dev-server/index.js',
    'loader/loader': './src/loader/js/webpack/index.js',
    'explorer/explorer': [
      'webpack-hot-middleware/client?quiet=true',
      './src/explorer/js/app.js',
    ],
    'explorer/template-hot-loader': [
      'webpack-hot-middleware/client?quiet=true',
      './dev-server/explorer-template-hot-loader.js',
    ],
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
        use: {
          loader: 'expose-loader',
          options: '$',
        },
      },
    ],
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(devServerContentPath, 'index.ejs'),
      templateParameters: {
        distTest: false,
      },
      chunks: ['index'],
    }),
    // explorer page
    new HtmlWebpackPlugin({
      filename: path.resolve(
        devServerContentPath, 'dist/explorer/explorer.html',
      ),
      template: path.resolve(
        __dirname,
        '../src/explorer/templates/index.pug',
      ),
      chunks: ['explorer/explorer', 'explorer/template-hot-loader'],
    }),
    explorePageScriptPlugin,
    // copy localization and cldr data
    getCopyFilesPlugin(path.resolve(devServerContentPath, 'dist')),
    /** Watching cldr_data files causing high CPU usage constantly,
     * disable webpack watch on those files.
     */
    new webpack.WatchIgnorePlugin([/bower_components\/cldr-data/]),
  ],
});

module.exports = config;
