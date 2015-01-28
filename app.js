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
var config = require('./config');
var engine = require('./engine/engine');
var experimenters = require('./routes/experimenters');
var microworlds = require('./routes/microworlds');
var runs = require('./routes/runs');
var sessions = require('./routes/sessions');

var isUser = access.isUser;
var checkAuthentication = access.checkAuthentication;

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

    mongoose.connect(config.db[app.settings.env]);

    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');

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

app.get('/', function (req, res) { res.render('participant-access.jade'); });
app.get('/new-welcome', function (req, res) { res.render('participant-access.jade'); });
app.get('/admin', function (req, res) { res.render('admin.jade'); });
app.get('/ping', function (req, res) { res.send('pong'); }); // Sanity check

app.post('/sessions', sessions.createSession);
app.post('/participant-sessions', sessions.participantSession);

app.get('/a/:accountId', checkAuthentication, function (req, res) {
    res.render('dashboard.jade');
});
app.get('/a/:accountId/dashboard', checkAuthentication, function (req, res) {
    res.render('dashboard.jade');
});
app.get('/a/:accountId/microworlds/:microworldId', checkAuthentication, function (req, res) {
    res.render('microworld.jade');
});
app.get('/a/:accountId/new/microworld', checkAuthentication, function (req, res) {
    res.render('microworld.jade');
});
app.get('/a/:accountId/runs/:runId', checkAuthentication, function (req, res) {
    res.render('run-results.jade');
});
app.get('/a/:accountId/profile', experimenters.displayProfileUpdate);
app.get('/fish', function (req, res) {
    res.render('fish.jade');
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

engine.engine(io);

server.listen(app.get('port'), function () {
    logger.info('Fish server listening on port ' + app.get('port'));
});
