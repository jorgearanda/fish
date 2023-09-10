import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import express from 'express';
import http from 'http';
import logger from 'winston';
import methodOverride from 'method-override';
import mongoose from 'mongoose';
import morgan from 'morgan';
import path from 'path';
import favicon from 'serve-favicon';
import serveStatic from 'serve-static';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import socketio from 'socket.io';

import {
  allowUsers,
  allowOnlySuperusers,
  allowSelfAndSuperusers,
  isUserSameAsParamsId,
} from './middlewares/access';
import config from './config';
import engine from './engine/engine';
import experimenters from './routes/experimenters';
import microworlds from './routes/microworlds';
import runs from './routes/runs';
import sessions from './routes/sessions';

import errorHandler from 'errorhandler'; // after loading the routes

var app = (exports.app = express());

logger.cli();
logger.add(logger.transports.File, {
  filename: 'fish-'
    + (new Date().toISOString().
      replace(/\-/g, '').      // remove dashes from date part
      replace(/\:/g, '').      // remove colons from time part
      replace(/T/, '-').      // replace T with a dash
      replace(/\..+/, ''))    // remove milliseconds
    + '.log',
  json: false,
  colorize: false,
  timestamp: true,
  handleExceptions: false,
});

switch (process.env.NODE_ENV || app.settings.env) {

  case 'test':
    logger.remove(logger.transports.Console);
    break;

  case 'development':
    logger.remove(logger.transports.Console);
    logger.add(logger.transports.Console, { level: 'debug', colorize: false, timestamp: true });
    app.use(morgan('dev'));
    app.use(errorHandler({ dumpExceptions: true, showStack: true }));
    break;

  default:
  case 'production':
    var loggerStream = {
      write: function (message) {
        logger.info(message.slice(0, -1));
      },
    };
    app.use(morgan({ stream: loggerStream }));
    break;
}
logger.info('app.settings.env = ' + app.settings.env);
logger.info('process.env.NODE_ENV = ' + process.env.NODE_ENV);
logger.debug('Node env = ' + (process.env.NODE_ENV || app.settings.env));


// if (process.env.NODE_ENV === 'test') {
//   logger.remove(logger.transports.Console);
// }
// else if (process.env.NODE_ENV === 'development') {
//   logger.transports.Console.level = 'debug';
// }

// if (app.settings.env === 'development') {
//   process.env.NODE_ENV = 'development';
//   logger.transports.Console.level = 'debug';
//   app.use(morgan('dev'));
//   app.use(errorHandler({ dumpExceptions: true, showStack: true }));
// } else if (app.settings.env === 'production') {
//   var loggerStream = {
//     write: function(message) {
//       logger.info(message.slice(0, -1));
//     },
//   };

//   app.use(morgan({ stream: loggerStream }));
// }

app.set('port', process.env.PORT || 8080);

mongoose.connect(config.db[app.settings.env]);

app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'pug');

app.use(favicon(path.join(__dirname, '../favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(methodOverride());

app.use(cookieParser('life is better under the sea'));
app.use(
  session({
    secret: 'life is better under the sea',
    store: MongoStore.create({
      client: mongoose.connection.getClient()
    }),
    cookie: { maxAge: null },
  })
);

app.use('/publicjs', serveStatic(path.join(__dirname, 'public/js')));
app.use('/public', serveStatic(path.join(__dirname, '../public')));
app.use('/bower', serveStatic(path.join(__dirname, '../bower_components')));

///////////////////////////////////////////////////////////////////////////////
//                                                                           //
// Resources                                                                 //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////

app.get('/', function (req, res) {
  res.render('participant-access.pug');
});
app.get('/explain-redirection', function (req, res) {
  res.render('explain-redirection.pug', {
    myHost: req.protocol + '://' + req.get('host')
  });
});
app.get('/explain-catch-intentions', function (req, res) {
  res.render('explain-catch-intentions.pug', {
    myHost: req.protocol + '://' + req.get('host')
  });
});
app.get('/new-welcome', function (req, res) {
  res.render('participant-access.pug');
});
app.get('/admin', function (req, res) {
  res.render('admin.pug');
});
app.get('/super', function (req, res) {
  res.render('super.pug');
});
app.get('/ping', function (req, res) {
  res.send('pong');
}); // Sanity check

app.post('/superuser-sessions', sessions.createSuperuserSession);
app.post('/sessions', sessions.createSession);
app.post('/participant-sessions', sessions.participantSession);

app.get('/s/:accountId', isUserSameAsParamsId, function (req, res) {
  res.render('super-dashboard.pug');
});
app.get('/s/:accountId/dashboard', isUserSameAsParamsId, function (req, res) {
  res.render('super-dashboard.pug');
});

app.get('/a/:accountId', isUserSameAsParamsId, function (req, res) {
  res.render('dashboard.pug');
});
app.get('/a/:accountId/dashboard', isUserSameAsParamsId, function (req, res) {
  res.render('dashboard.pug');
});
app.get('/a/:accountId/microworlds/:microworldId', isUserSameAsParamsId, function (
  req,
  res
) {
  res.render('microworld.pug');
});
app.get('/a/:accountId/new/microworld', isUserSameAsParamsId, function (req, res) {
  res.render('microworld.pug');
});
app.get('/a/:accountId/runs/:runId', isUserSameAsParamsId, function (req, res) {
  res.render('run-results.pug');
});
app.get(
  '/a/:accountId/profile',
  isUserSameAsParamsId,
  experimenters.displayProfileUpdate
);
app.get('/fish', function (req, res) {
  res.render('fish.pug');
});

app.get('/microworlds', allowUsers, microworlds.list);
app.get('/microworlds/:id', allowUsers, microworlds.show);
app.post('/microworlds', allowUsers, microworlds.create);
app.put('/microworlds/:id', allowUsers, microworlds.update);
app.delete('/microworlds/:id', allowUsers, microworlds.delete);

app.get('/runs', allowUsers, runs.list);
app.get('/runs/:id', allowUsers, runs.show);

app.get('/experimenters', allowOnlySuperusers, experimenters.list);
app.post('/experimenters', allowOnlySuperusers, experimenters.create);
app.get('/experimenters/:id', allowSelfAndSuperusers, experimenters.details);
app.put('/experimenters/:id', allowSelfAndSuperusers, experimenters.update);

var server = http.createServer(app);
var io = (exports.io = socketio.listen(server, {
  logger: {
    debug: logger.debug,
    info: logger.info,
    warn: logger.warn,
    error: logger.error,
  },
}));

var ioAdmin = (exports.ioAdmin = io.of('/admin'));
engine.engine(io, ioAdmin);

server.listen(app.get('port'), function () {
  logger.info('Fish server listening on port ' + app.get('port'));
});
