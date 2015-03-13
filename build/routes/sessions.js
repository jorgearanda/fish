"use strict";
var Experimenter, Microworld, async, log;

async = require("async");

log = require("winston");

Experimenter = require("../models/experimenter-model.js").Experimenter;

Microworld = require("../models/microworld-model.js").Microworld;

exports.createSession = function(req, res) {
  var checkPassword, findExperimenter, password, resolve, username;
  username = req.body.username;
  password = req.body.password;
  if (!username || !password) {
    return res.status(400).send("Missing username or password");
  }
  async.waterfall([
    findExperimenter = function(next) {
      var onFound;
      return Experimenter.findOne({
        username: username
      }, onFound = function(err, exp) {
        if (err) {
          return next({
            message: err.message,
            status: 500
          });
        }
        if (!exp) {
          return next({
            message: "Invalid credentials",
            status: 409
          });
        }
        return next(null, exp);
      });
    }, checkPassword = function(exp, next) {
      var onCompared;
      return Experimenter.comparePasswords(password, exp.passwordHash, onCompared = function(err, match) {
        if (err) {
          return next({
            message: err.message,
            status: 500
          });
        }
        if (!match) {
          return next({
            message: "Invalid credentials",
            status: 409
          });
        }
        return next(null, exp);
      });
    }
  ], resolve = function(err, exp) {
    if (err && err.status === 500) {
      log.error("Error on POST /sessions", err);
      return res.status(500).send({
        errors: "Internal Server Error"
      });
    }
    if (err) {
      log.info("Failed login for " + username);
      return res.status(err.status).send({
        errors: err.message
      });
    }
    req.session.username = username;
    req.session.userId = exp._id;
    log.info("Valid login for " + username);
    return res.status(200).send(exp);
  });
};

exports.participantSession = function(req, res) {
  var code, onFound, pid;
  code = req.body.code;
  pid = req.body.pid;
  if (!code || !pid) {
    return res.status(400).send("Missing experiment code or participant ID");
  }
  Microworld.findOne({
    code: code,
    status: {
      $in: ["test", "active"]
    }
  }, onFound = function(err, mw) {
    if (err) {
      log.error("Error on POST /runs", err);
      return res.status(500).send({
        errors: "Internal Server Error"
      });
    }
    if (!mw) {
      log.info("Failed participant session creation for " + code);
      return res.status(409).send({
        errors: "Invalid experiment code"
      });
    }
    log.info("Valid run creation for " + code);
    return res.status(200).send(mw);
  });
};
