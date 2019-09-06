const fs = require('fs');

let privateKey;
let certificate;

if (process.env.SSL_CERT) {
  privateKey = fs.readFileSync(process.env.SSL_KEY, 'utf8');
  certificate = fs.readFileSync(process.env.SSL_CERT, 'utf8');
}

module.exports = {
  privateKey,
  certificate,
};
