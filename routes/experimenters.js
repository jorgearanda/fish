'use strict';

var log = require('winston');

var Experimenter = require('../models/experimenter-model').Experimenter;
var ObjectId = require('mongoose').Types.ObjectId;

// POST /experimenters
exports.create = function (req, res) {
   // For now at least, we assume validation client-side
   var exp = {
      username: req.body.username,
      name: req.body.name,
      email: req.body.email
   };

   Experimenter.hashPassword(req.body.rawPassword, function done(err, pwd) {
      if (err) {
         log.error('Error on /experimenters POST', err);
         return res.send(500);
      }

      exp.passwordHash = pwd;
      Experimenter.create(exp, function (err, doc) {
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
    if (req.params.id != req.session.userId) {
        // unauthorized access
        return res.send(401);
    }

    var exp = {};
    if (req.body.username) exp.username = req.body.username;
    if (req.body.name) exp.name = req.body.name;
    if (req.body.email) exp.email = req.body.email;

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
}

function updateExperimenter(req, res, exp) {
    Experimenter.update({ _id : ObjectId(req.params.id) }, exp, function (err, numUpdated, rawRes) {
       if (err) {
           log.error('Error on PUT /experimenters/' + req.params.id, err);
           return res.send(500);
       }

       if(numUpdated == 0) {
           // no experimenters updated, bad PUT request
           return res.send(400);
       }

       return res.send(204);
    });
}
