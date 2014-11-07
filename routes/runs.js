'use strict';

var logger = require('winston');

var Run = require('../models/run-model').Run;

// GET /runs
exports.list = function (req, res) {
    return res.status(200).send('To Do');
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
