/* eslint-disable no-console */

if (!process.env.KLOUDLESS_APP_ID) {
  console.log('Environment variable KLOUDLESS_APP_ID not specified.');
  process.exit(1);
}

const webpackDevMiddleware = require('webpack-dev-middleware');
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');
const webpack = require('webpack');

const webpackConfig = require('../config/webpack.dev.conf');

const app = express();

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

const compiler = webpack(webpackConfig);
const middleware = webpackDevMiddleware(compiler, {
  logTime: true,
  stats: 'minimal',
  publicPath: webpackConfig.output.publicPath,
});
app.use(middleware);

let server;

if (process.env.SSL_CERT) {
  const privateKey = fs.readFileSync(process.env.SSL_KEY, 'utf8');
  const certificate = fs.readFileSync(process.env.SSL_CERT, 'utf8');
  server = https.createServer({ key: privateKey, cert: certificate }, app);
} else {
  server = http.createServer(app);
}

server.listen(app.get('port'), () => {
  console.log('Express server listening on port', app.get('port'));
});
