'use strict';

var log = require('winston');

var Experimenter = require('../models/experimenter-model').Experimenter;
const DbId = require('../util/db-id').DbId;

// GET /a/:id/profile
exports.displayProfileUpdate = function(req, res) {
  const id = new DbId(req.params.accountId);
  if (!id.isValid()) {
    return res.sendStatus(404);
  }

  Experimenter.findOne({ _id: id.asObjectId }, function(err, exp) {
    if (err) {
      log.error('Error retrieving experimenter on /a/:accountId/profile', err);
      return res.sendStatus(500);
    }
    if (!exp) {
      return res.sendStatus(404);
    }

    return res.render('profile.pug', {
      name: exp.name,
      email: exp.email,
    });
  });
};

// POST /experimenters
exports.create = function(req, res) {
  // For now at least, we assume validation client-side
  var exp = {
    username: req.body.username,
    name: req.body.name,
    email: req.body.email,
  };

  Experimenter.hashPassword(req.body.rawPassword, function done(err, pwd) {
    if (err) {
      log.error('Error on /experimenters POST', err);
      return res.send(500);
    }

    exp.passwordHash = pwd;
    Experimenter.create(exp, function(err, doc) {
      if (err) {
        log.error('Error on /experimenters POST', err);
        return res.send(500);
      }

      return res.status(200).send(doc);
    });
  });
};

// PUT /experimenters/:id
exports.update = function(req, res) {
  if (req.params.id != req.session.userId) return res.send(401); // unauthorized

  if (
    (req.body.rawPassword && !req.body.confirmPass) ||
    (!req.body.rawPassword && req.body.confirmPass) ||
    req.body.rawPassword !== req.body.confirmPass
  ) {
    return res.status(409).send('password conflict');
  }

  if (req.body.name || req.body.email || req.body.rawPassword) {
    var exp = {};
    if (req.body.username) exp.username = req.body.username;
    if (req.body.name) exp.name = req.body.name;
    if (req.body.email) {
      var atpos = req.body.email.indexOf('@');
      var dotpos = req.body.email.lastIndexOf('.');
      if (atpos < 1 || dotpos < atpos || dotpos + 2 >= req.body.email.length || dotpos <= 2) {
        return res.status(409).send('email conflict');
      }
      exp.email = req.body.email;
    }

    if (req.body.rawPassword !== undefined) {
      Experimenter.hashPassword(req.body.rawPassword, function done(err, pwd) {
        if (err) {
          log.error('Error on PUT /experimenters/' + req.params.id, err);
          return res.send(500);
        }

        exp.passwordHash = pwd;
        return updateExperimenter(req, res, exp);
      });
    } else return updateExperimenter(req, res, exp);
  } else return res.send(403);
};

function updateExperimenter(req, res, exp) {
  Experimenter.update({ _id: new DbId(req.params.id) }, exp, function(err, numUpdated) {
    if (err) {
      log.error('Error on PUT /experimenters/' + req.params.id, err);
      return res.send(500);
    }

    if (numUpdated === 0) {
      // no experimenters updated, bad PUT request
      return res.send(400);
    }

    return res.send(204);
  });
}
