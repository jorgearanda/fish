'use strict';

var logger = require('winston');
var mongoose = require('mongoose');

var SimType = require('../models/sim-type-model').SimType;

// GET /sim-types
exports.list = function (req, res) {
   if (!req.session || !req.session.userId) return res.send(401);

   var query = { 'experimenter._id': req.session.userId };
   if (req.query.status) query.status = req.query.status;

   SimType.find().exec(function findCb(err, simTypes) {
      if (err) {
         logger.error('Error on GET /sim-types', err);
         return res.send(500);
      }

      return res.status(200).send(simTypes);
   });
};


// POST /sim-types
exports.create = function (req, res) {
   // TODO - these session validations can be performed by middleware
   if (!req.session || !req.session.userId) return res.send(401);

   // TODO - validate here again

   var st = {
      name: req.body.name,
      experimenter: {
         _id: req.session.userId,
         username: req.session.username
      },
      desc: req.body.desc,
      status: 'test',
      dateCreated: new Date(),
      dateActive: null,
      dateArchived: null,
      numCompleted: 0,
      numAborted: 0,
      params: req.body
   };

   // Don't repeat name and description
   delete st.params.name;
   delete st.params.desc;

   SimType.create(st, function onCreate(err, stRes) {
      // TODO - log errors
      if (err) return res.send(500);

      return res.status(200).send(stRes);
   });
}