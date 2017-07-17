'use strict';

var log = require('winston');

var Microworld = require('../models/microworld-model').Microworld;
var Ocean = require('./ocean').Ocean;

/**
 * @namespace OceanManager
 */
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

    /**
     * A function to ensure that fishers' pIds are unique. Also checks<br>
     * against bots pIDs
     * @param {String} mwId - Microworld ID
     * @param {String} oId  - Ocean ID
     * @param {String} pId  - Fishers' pID
     * @param {String} socketId - Socket ID of the user
     * @param {Function} cb - Callback function
     * @see OceanManager.assignFisherToOcean
     */
    this.safeAddFisher = function (mwId, oId, pId, socketId, cb) {
        Microworld.findOne({_id: mwId}, function onFound(err, mw) {
            if (mw.usedPIDs.indexOf(pId) !== -1 || mw.params.bots.indexOf(pId) !== -1) {
              // PIDs have been registered before
              io.sockets.in(socketId).emit('conflict pid', pId);
              return;
            }
            // if the pId cannot be found (including bots), then do the following
            this.oceans[oId].addFisher(pId);
            
            // update list of used participant IDs for this microworld
            Microworld.update({_id : mwId}, { $push : { usedPIDs : pId } }, function(err) {
                if (err) {
                  ocean.log.error(err.message);
                  return io.sockets.in(socketId).emit('observe failure');
                }
                return cb(oId);
            });
        }.bind(this));
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
