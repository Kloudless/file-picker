/* eslint-disable no-console */

if (!process.env.KLOUDLESS_APP_ID) {
  console.log('Environment variable KLOUDLESS_APP_ID not specified.');
  process.exit(1);
}

const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const https = require('https');
const webpack = require('webpack');
const sslCert = require('./ssl-cert');

const webpackConfigs = require('../config/webpack.dev.conf');

const app = express();

process.env.PICKER_URL = '/picker/index.html';

app.set('port', process.env.PORT || 3000);
app.use(morgan('dev'));
app.use('/static', express.static(path.join(__dirname, './static')));

app.use((req, res, next) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: 0,
  });
  next();
});

const compiler = webpack(webpackConfigs);
const middleware = webpackDevMiddleware(compiler, {
  logTime: true,
  stats: 'minimal',
  publicPath: webpackConfigs[0].output.publicPath,
});
app.use(middleware);
app.use(webpackHotMiddleware(compiler, {
  log: false, path: '/__webpack_hmr', heartbeat: 10 * 1000,
}));

let server;

if (sslCert.certificate) {
  server = https.createServer(
    { key: sslCert.privateKey, cert: sslCert.certificate },
    app,
  );
} else {
  server = http.createServer(app);
}

server.listen(app.get('port'), () => {
  console.log('Dev server running on http://localhost:3000');
  console.log('Webpack bundles are compiling...');
});
