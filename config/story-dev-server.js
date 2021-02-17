/**
 * Express server for building and hosting the loader and picker page in dev
 * env.
 */
/* eslint-disable no-console */
const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const { devServerPorts } = require('./common');

// BUILD_LICENSE defaults to AGPL.
// If it's not AGPL then some tests or stories may fail due to plupload
// being disabled.
if (!process.env.BUILD_LICENSE) {
  process.env.BUILD_LICENSE = 'AGPL';
}

const webpackDevConfig = require('./webpack.story.conf');

const app = express();
const compiler = webpack(webpackDevConfig);

console.log('Starting Dev Server...');

// Accept HMR requests from storybook server.
app.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin', ['*']);
  res.append('Access-Control-Allow-Methods', 'GET');
  next();
});

// bind webpack and hot reload
app.use(webpackDevMiddleware(compiler, {
  logTime: true,
  stats: 'minimal',
  publicPath: '/',
}));
app.use(webpackHotMiddleware(compiler, {
  log: console.log,
  path: '/__webpack_hmr',
  heartbeat: 10 * 1000,
}));

// Listen on 2 ports to host loader and picker separately.
app.listen(devServerPorts.loader, () => {
  console.log(
    'Loader hosted at '
    + `http://localhost:${devServerPorts.loader}/sdk/kloudless.picker.js`,
  );
  console.log(
    'React binding hosted at '
    + `http://localhost:${devServerPorts.loader}/sdk/kloudless.picker.react.js`,
  );
  console.log(
    'Vue binding hosted at '
    + `http://localhost:${devServerPorts.loader}/sdk/kloudless.picker.vue.js`,
  );
  console.log('Webpack bundles are compiling...');
});
app.listen(devServerPorts.picker, () => {
  console.log(
    'View page hosted at '
    + `http://localhost:${devServerPorts.picker}/file-picker/v2/index.html`,
  );
  console.log('Webpack bundles are compiling...');
});
