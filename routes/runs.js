'use strict';

var logger = require('winston');

var Run = require('../models/run-model').Run;

// GET /runs
exports.list = function (req, res) {
    var query = { 'experimenter._id': req.session.userId };
    if (req.query.mw) query['microworld._id'] = req.query.mw;
    var fields = {_id: 1, time: 1, participants: 1};

    Run.find(query, fields, function found(err, runs) {
        if (err) {
            logger.error('Error on GET /runs', err);
            return res.send(500);
        }

        return res.status(200).send(runs)
    });
};


// GET /runs/:id
exports.show = function (req, res) {
    Run.findOne({
        _id: req.params.id
    }, function foundCb(err, run) {
        if (err) {
            logger.error('Error on GET /runs/' + req.params.id, err);
            return res.send(500);
        }

        return res.status(200).send(run);
    });
};
