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

import { isUser, isSuperuser, isUserSameAsParamsId } from './middlewares/access';
import config from './config';
import engine from './engine/engine';
import experimenters from './routes/experimenters';
import microworlds from './routes/microworlds';
import runs from './routes/runs';
import sessions from './routes/sessions';

import errorHandler from 'errorhandler'; // after loading the routes

const store = MongoStore(session);

var app = (exports.app = express());

logger.cli();
logger.add(logger.transports.File, {
  filename: 'fish.log',
  handleExceptions: false,
});

if (process.env.NODE_ENV === 'test') {
  logger.remove(logger.transports.Console);
}

if (app.settings.env === 'development') {
  process.env.NODE_ENV = 'development';
  app.use(morgan('dev'));
  app.use(errorHandler());
} else if (app.settings.env === 'production') {
  var loggerStream = {
    write: function(message) {
      logger.info(message.slice(0, -1));
    },
  };

  app.use(morgan({ stream: loggerStream }));
}

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
    store: new store({ mongooseConnection: mongoose.connections[0] }),
    cookie: { maxAge: null },
  })
);

app.use('/public', serveStatic(path.join(__dirname, '../public')));
app.use('/bower', serveStatic(path.join(__dirname, '../bower_components')));

///////////////////////////////////////////////////////////////////////////////
//                                                                           //
// Resources                                                                 //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////

app.get('/', function(req, res) {
  res.render('participant-access.pug');
});
app.get('/new-welcome', function(req, res) {
  res.render('participant-access.pug');
});
app.get('/admin', function(req, res) {
  res.render('admin.pug');
});
app.get('/super', function(req, res) {
  res.render('super.pug');
});
app.get('/ping', function(req, res) {
  res.send('pong');
}); // Sanity check

app.post('/superuser-sessions', sessions.createSuperuserSession);
app.post('/sessions', sessions.createSession);
app.post('/participant-sessions', sessions.participantSession);

app.get('/s/:accountId', isUserSameAsParamsId, function(req, res) {
  res.render('super-dashboard.pug');
});
app.get('/s/:accountId/dashboard', isUserSameAsParamsId, function(req, res) {
  res.render('super-dashboard.pug');
});

app.get('/a/:accountId', isUserSameAsParamsId, function(req, res) {
  res.render('dashboard.pug');
});
app.get('/a/:accountId/dashboard', isUserSameAsParamsId, function(req, res) {
  res.render('dashboard.pug');
});
app.get('/a/:accountId/microworlds/:microworldId', isUserSameAsParamsId, function(
  req,
  res
) {
  res.render('microworld.pug');
});
app.get('/a/:accountId/new/microworld', isUserSameAsParamsId, function(req, res) {
  res.render('microworld.pug');
});
app.get('/a/:accountId/runs/:runId', isUserSameAsParamsId, function(req, res) {
  res.render('run-results.pug');
});
app.get(
  '/a/:accountId/profile',
  isUserSameAsParamsId,
  experimenters.displayProfileUpdate
);
app.get('/fish', function(req, res) {
  res.render('fish.pug');
});

app.get('/microworlds', isUser, microworlds.list);
app.get('/microworlds/:id', isUser, microworlds.show);
app.post('/microworlds', isUser, microworlds.create);
app.put('/microworlds/:id', isUser, microworlds.update);
app.delete('/microworlds/:id', isUser, microworlds.delete);

app.get('/runs', isUser, runs.list);
app.get('/runs/:id', isUser, runs.show);

app.get('/experimenters', isSuperuser, experimenters.list);
app.post('/experimenters', isSuperuser, experimenters.create);
app.get('/experimenters/:id', experimenters.details);
app.put('/experimenters/:id', isUser, experimenters.update);

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

server.listen(app.get('port'), function() {
  logger.info('Fish server listening on port ' + app.get('port'));
});
