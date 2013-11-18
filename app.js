'use strict';
/*jshint -W024 */

var express = require('express');
var http = require('http');
var logger = require('winston');
var path = require('path');
var socketio = require('socket.io');

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

   app.set('views', __dirname + '/views');
   app.engine('html', require('ejs').renderFile);

   app.use(express.favicon());
   app.use(express.json());
   app.use(express.urlencoded());
   app.use(express.methodOverride());

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

app.get('/account/:accountId', function (req, res) {
   res.render('dashboard.html');
});

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
