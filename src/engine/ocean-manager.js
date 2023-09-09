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
    Microworld.findOne(
      { _id: mwId },
      function onFound(err, mw) {
        // TODO - handle errors
        var ocean = new Ocean(mw, this.io, this.ioAdmin, this);
        this.oceans[ocean.id] = ocean;
        ocean.log.info('Ocean created.');
        ocean.runOcean();

        return cb(null, ocean.id);
      }.bind(this)
    );
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
      if (this.oceans[oId].microworld._id.toString() === mwId && this.oceans[oId].hasRoom()) {
        this.oceans[oId].addFisher(pId);
        return cb(oId);
      }
    }

    this.createOcean(
      mwId,
      function onCreated(err, oId) {
        // TODO - handle errors
        this.oceans[oId].addFisher(pId);
        return cb(oId);
      }.bind(this)
    );
  };

  this.removeFisherFromOcean = function (oId, pId) {
    this.oceans[oId].removeFisher(pId);
  };

  this.purgeOceans = function () {
    const PURGE_INTERVAL = 5 * 60 * 1000; // 5 minutes [originally 5 seconds!]
    var oKeys = Object.keys(this.oceans);
    var oId;

    for (var i in oKeys) {
      oId = oKeys[i];
      var expId;
      var time;
      if (this.oceans[oId].isRemovable()) {
        if (this.oceans[oId].purgeScheduled) {
          log.info(
            'Purging ocean ' +
            this.oceans[oId].microworld.name +
            ' ' +
            oId +
            ' (' +
            this.oceans[oId].microworld.experimenter.username +
            ')'
          );
          this.deleteOcean(oId);
        }
        else {  // .purgeScheduled is undefined
          /* 
           * [JKoomen] Wait with the actual purge until the next scheduled run of this function.
           * Since this function runs on a fixed schedule, it could happen that the function runs 
           * just a split second after some ocean is declared removable in response to some event.
           * BUT, events can arrive out of order, especially if there are non-trivial delays due
           * to, say, a FISH client in Europe sending an event (socket message) to a FISH server in the USA.
           * SO, waiting to do the actual purge until the next cycle gives all the ocean's events
           * at least PURGE_INTERVAL msecs to arrive and be acted on without null pointer exceptions.
           */
          log.debug(
            'Scheduled: purging ocean ' +
            this.oceans[oId].microworld.name +
            ' ' +
            oId +
            ' (' +
            this.oceans[oId].microworld.experimenter.username +
            ')'
          );
          this.oceans[oId].purgeScheduled = true;
        }
      }
    }

    setTimeout(this.purgeOceans.bind(this), PURGE_INTERVAL);
  };

  this.purgeOceans();
};
