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
    this.trackedAbandonParticipants = {};

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
        return;
    };

    this.safeAddFisher = function (mwId, oId, pId, cb, socketId) {
        Microworld.findOne({ _id : mwId }, function onFound(err, mw) {
        }.bind(this));

        // A function to ensure that fishers' (including bots)
        // pIds are unique. Used in assignFisherToOcean
        if(this.oceans[oId].findFisherIndex(pId) === null) {
            this.oceans[oId].addFisher(pId);
            return cb(oId);
        } else {
            io.sockets.in(socketId).emit('conflict pid', pId);
        }
        return;
    }

    this.assignFisherToOcean = function (mwId, pId, cb, socketId) {
        var oKeys = Object.keys(this.oceans);
        var oId = null;

        for (var i in oKeys) {
            oId = oKeys[i];
            if (this.oceans[oId].microworld._id.toString() === mwId &&
                    this.oceans[oId].hasRoom()) {
                return this.safeAddFisher(mwId, oId, pId, cb, socketId);
            }
        }

        this.createOcean(mwId, function onCreated(err, oId) {
            // TODO - handle errors
            return this.safeAddFisher(mwId, oId, pId, cb, socketId);
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
            var expId;
            var time;
            if (this.oceans[oId].isRemovable()) {
                log.info('Purging ocean ' + this.oceans[oId].microworld.name + ' ' + oId +
                    ' (' + this.oceans[oId].microworld.experimenter.username + ')');
                this.deleteOcean(oId);
            }
        }

        setTimeout(this.purgeOceans.bind(this), 5000);
        return;
    };

    this.purgeOceans();
};
