'use strict';

var log = require('winston');

var Microworld = require('../models/microworld-model').Microworld;
var Ocean = require('./ocean').Ocean;

exports.OceanManager = function OceanManager(io, ioAdmin) {
    this.oceans = {};
    this.io = io;
    this.ioAdmin = ioAdmin;
    // simulations currently tracked
    this.trackedSimulations = {};

    this.createOcean = function (mwId, cb) {
        Microworld.findOne({_id: mwId}, function onFound(err, mw) {
            // TODO - handle errors
            var ocean = new Ocean(mw, this.io, this.ioAdmin, this);
            this.oceans[ocean.id] = ocean;
            ocean.log.info('Ocean created.');
            ocean.runOcean();

            return cb(null, ocean.id);
        }.bind(this));
    };

    this.deleteOcean = function (oId) {
        delete this.oceans[oId];
        delete this.trackedSimulations[oId];
    };

    this.assignFisherToOcean = function (mwId, pId, cb) {
        var oKeys = Object.keys(this.oceans);
        var oId = null;

        for (var i in oKeys) {
            oId = oKeys[i];
            if (this.oceans[oId].microworld._id.toString() === mwId &&
                    this.oceans[oId].hasRoom()) {
                this.oceans[oId].addFisher(pId);
                return cb(oId);
            }
        }

        this.createOcean(mwId, function onCreated(err, oId) {
            // TODO - handle errors
            this.oceans[oId].addFisher(pId);
            return cb(oId);
        }.bind(this));
    };

    this.removeFisherFromOcean = function (oId, pId) {
        this.oceans[oId].removeFisher(pId);
    };

    this.purgeOceans = function () {
        var oKeys = Object.keys(this.oceans);
        var oId;

        for (var i in oKeys) {
            oId = oKeys[i];
            var expId;
            var time;
            if (this.oceans[oId].isRemovable()) {
                log.info('Purging ocean ' + this.oceans[oId].microworld.name + ' ' + oId +
                    ' (' + this.oceans[oId].microworld.experimenter.username + ')');
                this.deleteOcean(oId);
            }
        }

        setTimeout(this.purgeOceans.bind(this), 5000);
    };

    this.purgeOceans();
};
