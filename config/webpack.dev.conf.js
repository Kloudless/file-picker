/* eslint-disable @typescript-eslint/no-var-requires */
/* Webpack config for dev-server */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const getPickerPlugins = require('./picker-plugins');
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
      'loader/loader': './config/loader-export-helper.js',
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
  // picker
  merge(devConfigBase, {
    entry: {
      'picker/picker': [
        'webpack-hot-middleware/client?quiet=true',
        './src/picker/js/app.js',
      ],
      'picker/template-hot-loader': [
        'webpack-hot-middleware/client?quiet=true',
        './dev-server/picker-template-hot-loader.js',
      ],
    },
    plugins: [
      // picker page
      new HtmlWebpackPlugin({
        filename: path.resolve(
          devServerContentPath, 'dist/picker/index.html',
        ),
        template: path.resolve(
          __dirname,
          '../src/picker/templates/index.pug',
        ),
        chunks: ['picker/picker', 'picker/template-hot-loader'],
      }),
      // Don't watch static json files to reduce CPU usage
      new webpack.WatchIgnorePlugin([/bower_components\/cldr-data/]),
    ].concat(getPickerPlugins(
      path.resolve(devServerContentPath, 'dist'),
    )),
  }),
];
