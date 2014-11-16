'use strict';

var log = require('winston');

var Experimenter = require('../models/experimenter-model').Experimenter;

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
