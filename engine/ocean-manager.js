'use strict';

var Microworld = require('../models/microworld-model').Microworld;
var Ocean = require('./ocean').Ocean;

exports.OceanManager = function OceanManager(io) {
    this.oceans = {};
    this.io = io;

    this.createOcean = function (mwId, cb) {
        Microworld.findOne({_id: mwId}, function onFound(err, mw) {
            // TODO - handle errors
            var ocean = new Ocean(mw, this.io);
            this.oceans[ocean.id] = ocean;
            ocean.log.info('Ocean created.');
            ocean.runOcean();

            return cb(null, ocean.id);
        }.bind(this));
    };

    this.deleteOcean = function (oId) {
        delete this.oceans[oId];
        return;
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
        return;
    };

    this.purgeOceans = function () {
        var oKeys = Object.keys(this.oceans);
        var oId;

        for (var i in oKeys) {
            oId = oKeys[i];
            if (this.oceans[oId].isRemovable()) {
                this.deleteOcean(oId);
            }
        }
        return;
    };
};
