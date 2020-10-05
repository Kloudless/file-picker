/**
 * Webpack config to build loader, react-wrapper, vue-wrapper and picker
 * scripts and related assets.
 * Storybook server will host these static files and import file picker via
 * <script> tag. See storybook/.storybook/preview-head.html.
 */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const baseWebpackConfig = require('./webpack.base.conf');
const getPickerPlugins = require('./picker-plugins');
const merge = require('./merge-strategy');

const BASE_CONFIG = merge(baseWebpackConfig, {
  mode: 'development',
  devtool: '#source-map',
});
const SRC_PATH = path.resolve(__dirname, '../src');
const DIST_PATH = path.resolve(__dirname, '../storybook-test/static/');

module.exports = [
  // react-wrapper of loader
  merge(BASE_CONFIG, {
    entry: {
      'react-wrapper': path.resolve(SRC_PATH, 'loader/js/react/index.js'),
    },
    output: {
      libraryTarget: 'umd',
      library: 'filePickerReact',
      globalObject: 'window.Kloudless',
      path: path.resolve(DIST_PATH, 'loader'),
    },
  }),
  // vue-wrapper of loader
  merge(BASE_CONFIG, {
    entry: {
      'vue-wrapper': path.resolve(SRC_PATH, 'loader/js/vue/index.js'),
    },
    output: {
      libraryTarget: 'umd',
      library: 'filePickerVue',
      globalObject: 'window.Kloudless',
      path: path.resolve(DIST_PATH, 'loader'),
    },
  }),
  // loader
  merge(BASE_CONFIG, {
    entry: {
      loader: path.resolve(__dirname, 'loader-export-helper.js'),
    },
    output: {
      path: path.resolve(DIST_PATH, 'loader'),
    },
  }),
  // picker
  merge(BASE_CONFIG, {
    entry: {
      picker: path.resolve(SRC_PATH, 'picker/js/app.js'),
    },
    output: {
      path: path.resolve(DIST_PATH, 'picker'),
      filename: '[name].js',
      publicPath: './',
    },
    plugins: [
      // picker page
      new HtmlWebpackPlugin({
        filename: path.resolve(DIST_PATH, 'picker/index.html'),
        template: path.resolve(SRC_PATH, 'picker/templates/index.pug'),
        chunks: ['picker'],
      }),
      ...getPickerPlugins(DIST_PATH),
    ],
  }),
];
