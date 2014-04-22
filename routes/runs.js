'use strict';

var async = require('async');
var log = require('winston');

var Microworld = require('../models/microworld-model.js').Microworld;

// POST /runs
exports.create = function (req, res) {
    var code = req.body.code;
    var pid = req.body.pid;
    if (!code || !pid) {
        return res.status(400).send('Missing experiment code or participant ID');
    }

    Microworld.findOne({
        code: code,
        status: { '$in': ['test', 'active'] }
    }, function onFound(err, mw) {
        if (err) {
            log.error('Error on POST /runs', err);
            return res.status(500).send({errors: 'Internal Server Error'});
        }
        if (!mw) {
            log.info('Failed run creation for ' + code);
            return res.status(409).send({errors: 'Invalid experiment code'});
        }

        log.info('Valid run creation for ' + code);
        return res.status(200).send(mw); // TODO - change
    });
};
