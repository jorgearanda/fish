'use strict';

var async = require('async');
var log = require('winston');

var Experimenter = require('../models/experimenter-model.js').Experimenter;
const Superuser = require('../models/superuser-model.js').Superuser;
var Microworld = require('../models/microworld-model.js').Microworld;

// POST /sessions
exports.createSession = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  if (!username || !password) {
    return res.status(400).send('Missing username or password');
  }

  async.waterfall(
    [
      function findExperimenter(next) {
        Experimenter.findOne({ username: username }, function onFound(err, exp) {
          if (err) return next({ message: err.message, status: 500 });
          if (!exp) return next({ message: 'Invalid credentials', status: 409 });

          return next(null, exp);
        });
      },
      function checkPassword(exp, next) {
        Experimenter.comparePasswords(password, exp.passwordHash, function onCompared(
          err,
          match
        ) {
          if (err) return next({ message: err.message, status: 500 });
          if (!match) return next({ message: 'Invalid credentials', status: 409 });

          return next(null, exp);
        });
      },
    ],
    function resolve(err, exp) {
      if (err && err.status === 500) {
        log.error('Error on POST /sessions', err);
        return res.status(500).send({ errors: 'Internal Server Error' });
      }
      if (err) {
        log.info('Failed login for ' + username);
        return res.status(err.status).send({ errors: err.message });
      }

      req.session.username = username;
      req.session.userId = exp._id;
      log.info('Valid login for ' + username);
      return res.status(200).send(exp);
    }
  );
};

// POST /superuser-sessions
exports.createSuperuserSession = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  if (!username || !password) {
    return res.status(400).send('Missing username or password');
  }

  async.waterfall(
    [
      function findSuperuser(next) {
        Superuser.findOne({ username: username }, function onFound(err, sup) {
          if (err) return next({ message: err.message, status: 500 });
          if (!sup) return next({ message: 'Invalid credentials', status: 409 });

          return next(null, sup);
        });
      },
      function checkPassword(sup, next) {
        Superuser.comparePasswords(password, sup.passwordHash, function onCompared(
          err,
          match
        ) {
          if (err) return next({ message: err.message, status: 500 });
          if (!match) return next({ message: 'Invalid credentials', status: 409 });

          return next(null, sup);
        });
      },
    ],
    function resolve(err, sup) {
      if (err && err.status === 500) {
        log.error('Error on POST /sessions', err);
        return res.status(500).send({ errors: 'Internal Server Error' });
      }
      if (err) {
        log.info('Failed superuser login for ' + username);
        return res.status(err.status).send({ errors: err.message });
      }

      req.session.username = username;
      req.session.userId = sup._id;
      req.session.superuser = true;
      log.info('Valid login for superuser ' + username);
      return res.status(200).send(sup);
    }
  );
};

// POST /participant-sessions
exports.participantSession = function(req, res) {
  var code = req.body.code;
  var pid = req.body.pid;
  if (!code || !pid) {
    return res.status(400).send('Missing experiment code or participant ID');
  }

  Microworld.findOne(
    {
      code: code,
      status: { $in: ['test', 'active'] },
    },
    function onFound(err, mw) {
      if (err) {
        log.error('Error on POST /runs', err);
        return res.status(500).send({ errors: 'Internal Server Error' });
      }
      if (!mw) {
        log.info('Failed participant session creation for ' + code);
        return res.status(409).send({ errors: 'Invalid experiment code: ' + code });
      }

      log.info('Valid run creation for ' + code);
      return res.status(200).send(mw);
    }
  );
};
