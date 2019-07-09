/* eslint-disable no-console */
/** An express server to serve project root to test dist build
 * bind to port 3000
 */
const express = require('express');
const path = require('path');

const app = express();

app.set('views', path.join(__dirname, './dist/'));
app.set('view engine', 'ejs');

app.get('/test/dist/', (req, res) => {
  res.render('index.ejs', {
    appId: process.env.KLOUDLESS_APP_ID || '',
    explorerUrl: 'http://localhost:3000/dist/explorer/explorer.html',
  });
});
app.use(express.static(path.resolve(__dirname, '../')));

app.listen(3000, () => {
  console.log('Dist-test server running on http://localhost:3000/test/dist/');
});
