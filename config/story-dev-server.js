/**
 * Express server for building and hosting the loader and picker page in dev
 * env.
 */
/* eslint-disable no-console */
const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');

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
app.listen(8081, () => {
  console.log('Loader hosted at http://localhost:8081/sdk/kloudless.picker.js');
  console.log(
    'React binding hosted at '
    + 'http://localhost:8081/sdk/kloudless.picker.react.js',
  );
  console.log(
    'Vue binding hosted at ' +
    'http://localhost:8081/sdk/kloudless.picker.vue.js',
  );
  console.log('Webpack bundles are compiling...');
});
app.listen(8082, () => {
  console.log(
    'View page hosted at http://localhost:8082/file-picker/v2/index.html',
  );
  console.log('Webpack bundles are compiling...');
});
