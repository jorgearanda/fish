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
        if (err) {
          log.error('Error finding microworld: ' + err);
          return cb(new Error('Database error while finding microworld'));
        }

        if (!mw) {
          log.warn('Attempted to create ocean for non-existent microworld: ' + mwId);
          return cb(new Error('Microworld not found'));
        }

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

  // Resolve incoming fisher's class using a microworld's params
  function resolveClass(mwParams, pParams) {
    if (!mwParams.fisherClassesEnabled) return null;
    var validClasses = mwParams.fisherClasses || [];
    if (validClasses.length === 0) return null;
    var fClass = pParams && pParams.fClass;
    if (!fClass) return validClasses[0];
    var inputLower = fClass.toLowerCase();
    var matched = validClasses.filter(function(c) { return c.toLowerCase() === inputLower; });
    return matched.length > 0 ? matched[0] : validClasses[0];
  }

  // isRejoin: the participant's page was already in a game and has reconnected
  // (browser auto-reconnect, or back from the back/forward cache), as opposed
  // to a fresh visit
  this.assignFisherToOcean = function (mwId, pId, pParams, cb, isRejoin) {
    var oKeys = Object.keys(this.oceans);
    var oId = null;

    for (var i in oKeys) {
      oId = oKeys[i];
      var ocean = this.oceans[oId];
      if (ocean.microworld._id.toString() !== mwId) continue;

      // Lost after disconnecting: may not rejoin, nor start over in a new group
      if (ocean.isLost(pId)) {
        log.info('Fisher ' + pId + ' was lost from ocean ' + oId + ' and may not rejoin');
        return cb(null, 'lost');
      }

      // Reconnect: fisher is already in this ocean (e.g. browser refresh or second tab)
      if (ocean.findFisherIndex(pId) !== null) {
        log.info('Fisher ' + pId + ' reconnected to existing ocean ' + oId);
        return cb(oId);
      }

      if (ocean.hasRoom()) {
        var resolvedClass = resolveClass(ocean.microworld.params, pParams);
        if (resolvedClass === null || ocean.needsClass(resolvedClass)) {
          ocean.addFisher(pId, pParams);
          return cb(oId);
        }
      }
    }

    // A reconnecting page whose game has ended, or which was removed from a
    // game still in progress, must not be seated in a new group. (A fresh
    // visit may start a new game, e.g. to reuse test IDs.)
    if (isRejoin) {
      for (var j in oKeys) {
        var played = this.oceans[oKeys[j]];
        if (!played || played.microworld._id.toString() !== mwId || !played.hasPlayed(pId)) continue;
        if (played.isRemovable()) {
          log.info('Fisher ' + pId + ' reconnected after their game in ocean ' + oKeys[j] + ' ended');
          return cb(null, 'gameOver', { endReason: played.endReason });
        }
        log.info('Fisher ' + pId + ' reconnected after being removed from ocean ' + oKeys[j]);
        return cb(null, 'removed');
      }
    }

    this.createOcean(
      mwId,
      function onCreated(err, oId) {
        if (err) {
          log.error('Failed to assign fisher to ocean: ' + err.message);
          return cb(null); // Return null to indicate failure
        }
        this.oceans[oId].addFisher(pId, pParams);
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
