/* Webpack config for dev-server */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const baseWebpackConfig = require('./webpack.base.conf');
const explorePageScriptPlugin = require('./explorer-page-script-plugin');
const getCopyFilesPlugin = require('./copy-files-plugin');
const merge = require('./merge-strategy');

const distPath = path.resolve(__dirname, '../dist/');
const srcPath = path.resolve(__dirname, '../src');

const scripts = {
  loader: [path.resolve(srcPath, 'loader/js/webpack/index.js')],
  explorer: [path.resolve(srcPath, 'explorer/js/app.js')],
};

const prodConfig = merge(baseWebpackConfig, {
  mode: 'production',
  devtool: '#source-map',
  optimization: {
    minimize: false,
  },
});

const prodMinifiedConfig = merge(prodConfig, {
  devtool: false,
  optimization: {
    minimize: true,
  },
});


module.exports = [
  // loader
  merge(prodConfig, {
    entry: {
      loader: scripts.loader,
    },
    output: {
      path: path.resolve(distPath, './loader'),
      filename: '[name].js',
      publicPath: './',
    },
  }),
  // loader, minimized
  merge(prodMinifiedConfig, {
    entry: {
      loader: scripts.loader,
    },
    output: {
      path: path.resolve(distPath, './loader'),
      filename: '[name].min.js',
      publicPath: './',
    },
  }),
  // explorer, minified
  merge(prodMinifiedConfig, {
    entry: {
      explorer: scripts.explorer,
    },
    output: {
      path: path.resolve(distPath, './explorer'),
      filename: '[name].js',
      publicPath: './',
    },
    plugins: [
      // explorer page
      new HtmlWebpackPlugin({
        filename: path.resolve(distPath, 'explorer/explorer.html'),
        template: path.resolve(srcPath, 'explorer/templates/index.pug'),
        chunks: ['explorer'],
      }),
      explorePageScriptPlugin,
      // copy localization and cldr data
      getCopyFilesPlugin(distPath),
    ],
  }),
  // dev-server index page for dist-test
  merge(prodConfig, {
    entry: {
      index: path.resolve(__dirname, '../dev-server/index.js'),
    },
    output: {
      path: path.resolve(__dirname, '../test/dist/'),
      filename: '[name].js',
      publicPath: './',
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'index.ejs',
        template: path.resolve(__dirname, '../dev-server/index.ejs'),
        templateParameters: {
          distTest: true,
          // these variables will be supplied by test-dist-server
          appIdPlaceHolder: '<%= appId %>',
          explorerUrlPlaceHolder: '<%= explorerUrl %>',
        },
        chunks: [],
      }),
    ],
  }),
];
