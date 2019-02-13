'use strict';
/*jshint -W024 */

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var express = require('express');
var http = require('http');
var logger = require('winston');
var methodOverride = require('method-override');
var mongoose = require('mongoose');
var morgan = require('morgan');
var path = require('path');
var favicon = require('serve-favicon');
var serveStatic = require('serve-static');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var socketio = require('socket.io');

var access = require('./middlewares/access');
var config = require('./config');
var engine = require('./engine/engine');
var experimenters = require('./routes/experimenters');
var microworlds = require('./routes/microworlds');
var runs = require('./routes/runs');
var sessions = require('./routes/sessions');

var errorHandler = require('errorhandler');  // after loading the routes

var isUser = access.isUser;
var authenticate = access.authenticate;

var app = exports.app = express();


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
    app.use(morgan('dev'));
    app.use(errorHandler());
} else if (app.settings.env === 'production') {
    var loggerStream = {
        write: function (message) { logger.info(message.slice(0, -1)); }
    };

    app.use(morgan({ stream: loggerStream }));
}

app.set('port', process.env.PORT || 8080);

mongoose.connect(config.db[app.settings.env]);

app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

app.use(favicon(path.join(__dirname, 'public', 'img', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(methodOverride());

app.use(cookieParser('life is better under the sea'));
app.use(session({
    secret: 'life is better under the sea',
    store: new MongoStore({ mongooseConnection: mongoose.connections[0] }),
    cookie: { maxAge: null }
}));

app.use('/public', serveStatic(path.join(__dirname, 'public')));
app.use('/bower', serveStatic(path.join(__dirname, 'bower_components')));


///////////////////////////////////////////////////////////////////////////////
//                                                                           //
// Resources                                                                 //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////

app.get('/', function (req, res) { res.render('participant-access.pug'); });
app.get('/new-welcome', function (req, res) { res.render('participant-access.pug'); });
app.get('/admin', function (req, res) { res.render('admin.pug'); });
app.get('/ping', function (req, res) { res.send('pong'); }); // Sanity check

app.post('/sessions', sessions.createSession);
app.post('/participant-sessions', sessions.participantSession);

app.get('/a/:accountId', authenticate, function (req, res) {
    res.render('dashboard.pug');
});
app.get('/a/:accountId/dashboard', authenticate, function (req, res) {
    res.render('dashboard.pug');
});
app.get('/a/:accountId/microworlds/:microworldId', authenticate, function (req, res) {
    res.render('microworld.pug');
});
app.get('/a/:accountId/new/microworld', authenticate, function (req, res) {
    res.render('microworld.pug');
});
app.get('/a/:accountId/runs/:runId', authenticate, function (req, res) {
    res.render('run-results.pug');
});
app.get('/a/:accountId/profile', experimenters.displayProfileUpdate);
app.get('/fish', function (req, res) {
    res.render('fish.pug');
});

app.get('/microworlds', isUser, microworlds.list);
app.get('/microworlds/:id', isUser, microworlds.show);
app.post('/microworlds', isUser, microworlds.create);
app.put('/microworlds/:id', isUser, microworlds.update);
app.delete('/microworlds/:id', isUser, microworlds.delete);

app.get('/runs', isUser, runs.list);
app.get('/runs/:id', isUser, runs.show);

app.post('/experimenters', experimenters.create);
app.put('/experimenters/:id', isUser, experimenters.update);

var server = http.createServer(app);
var io = exports.io = socketio.listen(server, {
    logger: {
        debug: logger.debug,
        info: logger.info,
        warn: logger.warn,
        error: logger.error
    }
});

var ioAdmin = exports.ioAdmin = io.of('/admin');
engine.engine(io, ioAdmin);

server.listen(app.get('port'), function () {
    logger.info('Fish server listening on port ' + app.get('port'));
});
