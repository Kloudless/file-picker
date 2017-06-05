if (!process.env.KLOUDLESS_APP_ID) {
  console.log('Environment variable KLOUDLESS_APP_ID not specified.');
  process.exit(1);
}

var express = require('express'),
    morgan = require('morgan'),
    path = require('path'),
    http = require('http'),
    https = require('https'),
    fs = require('fs');

var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(morgan('dev'));
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '..')));

app.use(function(req, res, next) { 
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': 0,
  });
  next();
});

app.get('/', function(req, res) {
  res.render('index', {app_id: process.env.KLOUDLESS_APP_ID});
});
app.get('/file-explorer', function(req, res) {
  res.render('file-explorer', {app_id: process.env.KLOUDLESS_APP_ID});
});

var server;

if (process.env.SSL_CERT) {
  var privateKey  = fs.readFileSync(process.env.SSL_KEY, 'utf8');
  var certificate = fs.readFileSync(process.env.SSL_CERT, 'utf8');
  server = https.createServer({key: privateKey, cert: certificate}, app);
} else {
  server = http.createServer(app);
}

server.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});
