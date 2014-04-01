'use strict';
/*jshint -W024 */

var express = require('express');
var http = require('http');
var logger = require('winston');
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo')(express);
var path = require('path');
var socketio = require('socket.io');

var access = require('./middlewares/access');
var microworlds = require('./routes/microworlds');
var sessions = require('./routes/sessions');

var isUser = access.isUser;

var app = exports.app = express();


app.configure(function() {
   logger.cli();
   logger.add(logger.transports.File, {
      filename: 'fish.log',
      handleExceptions: false
   });

   if (process.env.NODE_ENV === 'test') {
      logger.remove(logger.transports.Console);
   }

   if (app.settings.env === 'development') {
      process.env.NODE_ENV = 'development';
      app.use(express.logger('dev'));
      app.use(express.errorHandler());
   } else if (app.settings.env === 'production') {
      var loggerStream = {
         write: function (message) { logger.info(message.slice(0, -1)); }
      };

      app.use(express.logger({ stream: loggerStream }));
   }

   app.set('port', process.env.PORT || 8080);

   mongoose.connect('mongodb://localhost/fish');

   app.set('views', __dirname + '/views');
   app.engine('html', require('ejs').renderFile);

   app.use(express.favicon());
   app.use(express.json());
   app.use(express.urlencoded());
   app.use(express.methodOverride());

   app.use(express.cookieParser('life is better under the sea'));
   app.use(express.session({
      secret: 'life is better under the sea',
      store: new MongoStore({ mongoose_connection: mongoose.connections[0] }),
      cookie: { maxAge: null }
   }));

   app.use(app.router);
   app.use('/public', express.static(path.join(__dirname, 'public')));
   app.use('/bower', express.static(path.join(__dirname, 'bower_components')));
});


///////////////////////////////////////////////////////////////////////////////
//                                                                           //
// Resources                                                                 //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////

app.get('/', function (req, res) { res.render('welcome.html'); });
app.get('/admin', function (req, res) { res.render('admin.html'); });
app.get('/ping', function (req, res) { res.send('pong'); }); // Sanity check

app.post('/sessions', sessions.createSession);

app.get('/a/:accountId', function (req, res) {
   res.render('dashboard.html');
});
app.get('/a/:accountId/dashboard', function (req, res) {
   res.render('dashboard.html')
});

app.get('/a/:accountId/new/microworld', function (req, res) {
   res.render('microworld.html');
});
app.post('/a/:accountId/microworlds', function (req, res) {
   // TODO
});
app.put('/a/:accountId/microworlds/:settingsId', function (req, res) {
   // TODO
});

app.get('/microworlds', isUser, microworlds.list);
app.post('/microworlds', isUser, microworlds.create);

// Take out
app.get('/settings', function (req, res) { res.render('settings.html')});

// Server
var server = http.createServer(app);
var io = socketio.listen(server);
io.set('logger', {
   debug: logger.debug,
   info: logger.info,
   warn: logger.warn,
   error: logger.error
});

server.listen(app.get('port'), function () {
   logger.info('Fish server listening on port ' + app.get('port'));
});
