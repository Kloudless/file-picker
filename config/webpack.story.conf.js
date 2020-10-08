/**
 * Webpack config to build loader, react-wrapper, vue-wrapper and picker
 * scripts and related assets.
 * Storybook server will include loader scripts in
 * storybook-test/.storybook/preview-head.html.
 */
const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const baseWebpackConfig = require('./webpack.base.conf');
const getPickerPlugins = require('./picker-plugins');
const merge = require('./merge-strategy');
const { devServerPorts } = require('./common');

const BASE_CONFIG = merge(baseWebpackConfig, {
  mode: 'development',
  devtool: '#source-map',
});
const SRC_PATH = path.resolve(__dirname, '../src');
const LOADER_BASE_URL = `http://localhost:${devServerPorts.loader}/`;
const PICKER_BASE_URL = `http://localhost:${devServerPorts.picker}/`;

module.exports = [
  // react-wrapper of loader
  merge(BASE_CONFIG, {
    name: 'react-loader',
    entry: {
      'sdk/kloudless.picker.react': [
        'webpack-hot-middleware/client?reload=false&quiet=false'
        + `&name=react-loader&path=${LOADER_BASE_URL}__webpack_hmr`,
        path.resolve(SRC_PATH, 'loader/js/react/index.js'),
      ],
    },
    output: {
      filename: '[name].js',
      libraryTarget: 'umd',
      library: 'filePickerReact',
      globalObject: 'window.Kloudless',
      // Tell WHR where to reload resources.
      publicPath: LOADER_BASE_URL,
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
    ],
  }),
  // vue-wrapper of loader
  merge(BASE_CONFIG, {
    name: 'vue-loader',
    entry: {
      'sdk/kloudless.picker.vue': [
        'webpack-hot-middleware/client?reload=false&quiet=false&name=vue-loader'
        + `&path=${LOADER_BASE_URL}__webpack_hmr`,
        path.resolve(SRC_PATH, 'loader/js/vue/index.js'),
      ],
    },
    output: {
      filename: '[name].js',
      libraryTarget: 'umd',
      library: 'filePickerVue',
      globalObject: 'window.Kloudless',
      // Tell WHR where to reload resources.
      publicPath: LOADER_BASE_URL,
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
    ],
  }),
  // loader
  merge(BASE_CONFIG, {
    mode: 'development',
    name: 'loader',
    entry: {
      'sdk/kloudless.picker': [
        'webpack-hot-middleware/client?reload=false&quiet=false&name=loader'
        + `&path=${LOADER_BASE_URL}__webpack_hmr`,
        path.resolve(__dirname, 'loader-export-helper.js'),
      ],
    },
    output: {
      filename: '[name].js',
      // Tell WHR where to reload resources.
      publicPath: LOADER_BASE_URL,
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
    ],
  }),
  // picker
  merge(BASE_CONFIG, {
    name: 'picker',
    entry: {
      'file-picker/v2/picker': [
        'webpack-hot-middleware/client?reload=true&quiet=false&name=picker'
        + `&path=${PICKER_BASE_URL}__webpack_hmr`,
        path.resolve(SRC_PATH, 'picker/js/app.js'),
      ],
    },
    output: {
      filename: '[name].js',
      // Tell WHR where to reload resources.
      publicPath: PICKER_BASE_URL,
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
      // picker page
      new HtmlWebpackPlugin({
        filename: 'file-picker/v2/index.html',
        template: path.resolve(SRC_PATH, 'picker/templates/index.pug'),
        chunks: ['file-picker/v2/picker'],
      }),
      ...getPickerPlugins('file-picker/v2/'),
    ],
  }),
];
