/* eslint-disable no-console */
/** An express server to serve project root to test dist build
 * bind to port 3000
 */
const express = require('express');
const path = require('path');
const http = require('http');
const https = require('https');
const sslCert = require('../dev-server/ssl-cert');

const protocol = sslCert.certificate ? 'https' : 'http';

const app = express();

app.set('views', path.join(__dirname, './dist/'));
app.set('view engine', 'ejs');
app.set('port', 3000);

app.get('/test/dist/', (req, res) => {
  res.render('index.ejs', {
    appId: process.env.KLOUDLESS_APP_ID || '',
    pickerUrl: `${protocol}://localhost:3000/dist/picker/index.html`,
  });
});
app.use(express.static(path.resolve(__dirname, '../')));

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
  console.log(
    `Dist-test server running on ${protocol}://localhost:3000/test/dist/`,
  );
});
