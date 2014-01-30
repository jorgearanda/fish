'use strict';

var logger = require('winston');
var mongoose = require('mongoose');

var SimType = require('../models/sim-type-model').SimType;

// GET /sim-types
exports.list = function (req, res) {
   if (!req.session || !req.session.userId) return res.send(401);

   var query = { 'experimenter._id': req.session.userId };
   if (req.query.status) query.status = req.query.status;
   console.log(query);

   SimType.find().exec(function findCb(err, simTypes) {
      if (err) {
         logger.error('Error on GET /sim-types', err);
         return res.send(500);
      }

      return res.status(200).send(simTypes);
   });
};
