"use strict";
var Chance, Microworld, async, logger;

async = require("async");

Chance = require("chance");

logger = require("winston");

Microworld = require("../models/microworld-model").Microworld;

exports.list = function(req, res) {
  var findCb, query;
  query = {
    "experimenter._id": req.session.userId
  };
  if (req.query.status) {
    query.status = req.query.status;
  }
  Microworld.find(query).exec(findCb = function(err, microworlds) {
    if (err) {
      logger.error("Error on GET /microworlds", err);
      return res.send(500);
    }
    return res.status(200).send(microworlds);
  });
};

exports.show = function(req, res) {
  var foundCb;
  Microworld.findOne({
    _id: req.params.id
  }, foundCb = function(err, mw) {
    if (err) {
      logger.error("Error on GET /microworlds/" + req.params.id, err);
      return res.send(500);
    }
    return res.status(200).send(mw);
  });
};

exports.create = function(req, res) {
  var chance, createMicroworld, foundNewCode, generateCode, resolve, st, tries;
  st = {
    name: req.body.name,
    experimenter: {
      _id: req.session.userId,
      username: req.session.username
    },
    desc: req.body.desc,
    status: "test",
    dateCreated: new Date(),
    dateActive: null,
    dateArchived: null,
    numCompleted: 0,
    numAborted: 0,
    params: req.body
  };
  delete st.params.name;
  delete st.params.desc;
  chance = new Chance();
  foundNewCode = false;
  tries = 0;
  async.waterfall([
    generateCode = function(next) {
      var checkIfFound, newCode;
      return async.doUntil((newCode = function(cb) {
        var onFound;
        st.code = chance.string({
          length: 6,
          pool: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        });
        tries += 1;
        Microworld.findOne({
          code: st.code
        }, onFound = function(err, found) {
          if (err) {
            return cb(err);
          }
          if (tries > 10) {
            return cb({
              message: "Error generating microworld code: " + "too many tries"
            });
          }
          if (!found) {
            foundNewCode = true;
          }
          return cb();
        });
      }), (checkIfFound = function() {
        return foundNewCode;
      }), function(err) {
        if (err) {
          return next({
            status: 500,
            message: err.message
          });
        }
        return next();
      });
    }, createMicroworld = function(next) {
      var onCreate;
      if (st.params.clone) {
        st.name = st.name + " clone " + st.code;
      }
      return Microworld.create(st, onCreate = function(err, stRes) {
        if (err) {
          return next({
            status: 500,
            message: err.message
          });
        }
        return next(null, stRes);
      });
    }
  ], resolve = function(err, stRes) {
    if (err) {
      if (err.status === 500) {
        logger.error("Error on POST /microworlds: ", err);
      }
      return res.status(err.status).send(err.message);
    }
    return res.status(200).send(stRes);
  });
};

exports.update = function(req, res) {
  var mw, onUpdate;
  mw = {
    name: req.body.name,
    desc: req.body.desc,
    params: req.body
  };
  if (req.body.changeTo && req.body.changeTo === "active") {
    mw.status = "active";
    mw.dateActive = new Date();
    mw.dateArchived = null;
  }
  if (req.body.changeTo && req.body.changeTo === "archived") {
    mw.status = "archived";
    mw.dateArchived = new Date();
  }
  delete mw.params.name;
  delete mw.params.desc;
  delete mw.params.changeTo;
  Microworld.update({
    _id: req.params.id
  }, mw, onUpdate = function(err) {
    if (err) {
      logger.error("Error on PUT /microworlds/" + req.params.id, err);
      return res.send(500);
    }
    return res.send(204);
  });
};

exports["delete"] = function(req, res) {
  var onDelete;
  Microworld.remove({
    _id: req.params.id
  }, onDelete = function(err) {
    if (err) {
      logger.error("Error on DELETE /microworlds/" + req.params.id, err);
      return res.send(500);
    }
    return res.send(204);
  });
};
