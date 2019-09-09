/* Webpack config for dev-server */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const getExplorerPlugins = require('./explorer-plugins');
const baseWebpackConfig = require('./webpack.base.conf');
const merge = require('./merge-strategy');

const devServerContentPath = path.resolve(__dirname, '../dev-server/');


const devConfigBase = merge(baseWebpackConfig, {
  mode: 'development',
  devtool: '#source-map',
  output: {
    path: path.resolve(devServerContentPath, 'dist'),
    filename: '[name].js',
    // must be '/' here for HtmlWebpackPlugin to inject correct resource path
    // https://github.com/jantimon/html-webpack-plugin/issues/1009
    publicPath: '/',
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ],
});

module.exports = [
  // test page and loader
  merge(devConfigBase, {
    entry: {
      index: './dev-server/index.js',
      'loader/loader': './src/loader/js/webpack/index.js',
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
    ],
  }),
  // explorer
  merge(devConfigBase, {
    entry: {
      'explorer/explorer': [
        'webpack-hot-middleware/client?quiet=true',
        './src/explorer/js/app.js',
      ],
      'explorer/template-hot-loader': [
        'webpack-hot-middleware/client?quiet=true',
        './dev-server/explorer-template-hot-loader.js',
      ],
    },
    plugins: [
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
      // Don't watch static json files to reduce CPU usage
      new webpack.WatchIgnorePlugin([/bower_components\/cldr-data/]),
    ].concat(getExplorerPlugins(
      path.resolve(devServerContentPath, 'dist'),
    )),
  }),
];
