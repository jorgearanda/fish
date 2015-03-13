var Experimenter, ObjectId, log, updateExperimenter;

updateExperimenter = function(req, res, exp) {
  Experimenter.update({
    _id: new ObjectId(req.params.id)
  }, exp, function(err, numUpdated) {
    if (err) {
      log.error("Error on PUT /experimenters/" + req.params.id, err);
      return res.send(500);
    }
    if (numUpdated === 0) {
      return res.send(400);
    }
    return res.send(204);
  });
};

"use strict";

log = require("winston");

Experimenter = require("../models/experimenter-model").Experimenter;

ObjectId = require("mongoose").Types.ObjectId;

exports.displayProfileUpdate = function(req, res) {
  Experimenter.findOne({
    _id: new ObjectId(req.params.accountId)
  }, function(err, exp) {
    if (err || !exp) {
      log.error("Could not retrieve experimenter on /a/:accountId/profile", err);
      res.send(500);
    }
    res.render("profile.jade", {
      name: exp.name,
      email: exp.email
    });
  });
};

exports.create = function(req, res) {
  var done, exp;
  exp = {
    username: req.body.username,
    name: req.body.name,
    email: req.body.email
  };
  Experimenter.hashPassword(req.body.rawPassword, done = function(err, pwd) {
    if (err) {
      log.error("Error on /experimenters POST", err);
      return res.send(500);
    }
    exp.passwordHash = pwd;
    Experimenter.create(exp, function(err, doc) {
      if (err) {
        log.error("Error on /experimenters POST", err);
        return res.send(500);
      }
      return res.status(200).send(doc);
    });
  });
};

exports.update = function(req, res) {
  var atpos, done, dotpos, exp;
  if (req.params.id !== req.session.userId) {
    return res.send(401);
  }
  if ((req.body.rawPassword && !req.body.confirmPass) || (!req.body.rawPassword && req.body.confirmPass) || (req.body.rawPassword !== req.body.confirmPass)) {
    return res.status(409).send("password conflict");
  }
  if (req.body.name || req.body.email || req.body.rawPassword) {
    exp = {};
    if (req.body.username) {
      exp.username = req.body.username;
    }
    if (req.body.name) {
      exp.name = req.body.name;
    }
    if (req.body.email) {
      atpos = req.body.email.indexOf("@");
      dotpos = req.body.email.lastIndexOf(".");
      if (atpos < 1 || dotpos < atpos || dotpos + 2 >= req.body.email.length || dotpos <= 2) {
        return res.status(409).send("email conflict");
      }
      exp.email = req.body.email;
    }
    if (req.body.rawPassword !== undefined) {
      Experimenter.hashPassword(req.body.rawPassword, done = function(err, pwd) {
        if (err) {
          log.error("Error on PUT /experimenters/" + req.params.id, err);
          return res.send(500);
        }
        exp.passwordHash = pwd;
        return updateExperimenter(req, res, exp);
      });
    } else {
      updateExperimenter(req, res, exp);
    }
  } else {
    res.send(403);
  }
};
