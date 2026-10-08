'use strict';

// Disconnect handling: what happens when a fisher's connection drops during
// a game. install() adds these methods and their state to an Ocean (see
// ocean.js); they use the ocean's own state through `this`.
//
// Microworld params: disconnectHandlingEnabled, disconnectGracePeriod,
// disconnectDuringGrace ('pause' or 'continue'), disconnectsAllowed,
// disconnectLostAction ('end' or 'remove'). Off by default: a dropped fisher
// is removed at once (engine.js). Pausing itself is in ocean-pause.js.
//
// Every disconnect and its consequences are recorded in connectionEvents,
// which is saved with the run, also when handling is off.

exports.install = function(ocean, io, ioAdmin) {
  ocean.connectionEvents = [];   // saved with the run
  ocean.disconnected = {};       // pId -> { since, deadline, timer } while in the grace period
  ocean.lostParticipants = {};   // pId -> reason; these may not rejoin
  ocean.disconnectPauseShown = false;

  ocean.isGameInProgress = function() {
    return this.isInInitialDelay() || this.isRunning() || this.isResting() || this.isPaused();
  };

  ocean.disconnectHandlingApplies = function() {
    return !!this.microworld.params.disconnectHandlingEnabled && this.isGameInProgress();
  };

  ocean.recordConnectionEvent = function(pId, event, extra) {
    var phase = this.currentPhase();
    var record = {
      participant: pId,
      event: event,
      time: new Date(),
      season: this.season,
      second: this.seconds,
      phase: phase,
      // The break between seasons (and the countdown before season 1) leads
      // up to the next season, so events there count toward that season
      resultsSeason: phase === 'resting' || phase === 'initial delay' ? this.season + 1 : this.season,
    };
    for (var key in extra || {}) record[key] = extra[key];
    this.connectionEvents.push(record);
    this.log.info('Connection: fisher ' + pId + ' ' + event + (record.reason ? ' (' + record.reason + ')' : '') +
      (record.secondsAway !== undefined ? ' after ' + record.secondsAway + ' s' : ''));
  };

  ocean.isFisherDisconnected = function(pId) {
    return pId in this.disconnected;
  };

  ocean.isLost = function(pId) {
    return pId in this.lostParticipants;
  };

  // Was in the game when it started (playersAtStart is set in getOceanReady)
  ocean.hasPlayed = function(pId) {
    return this.playersAtStart.indexOf(pId) !== -1;
  };

  ocean.isDisconnectPauseActive = function() {
    return this.microworld.params.disconnectDuringGrace === 'pause' && Object.keys(this.disconnected).length > 0;
  };

  ocean.fisherDisconnected = function(pId) {
    var idx = this.findFisherIndex(pId);
    if (idx === null || this.isFisherDisconnected(pId)) return;
    var params = this.microworld.params;
    var fisher = this.fishers[idx];

    fisher.disconnectCount = (fisher.disconnectCount || 0) + 1;
    this.recordConnectionEvent(pId, 'disconnected', { count: fisher.disconnectCount });

    // An absent fisher shouldn't keep paying for time at sea
    if (fisher.status === 'At sea') {
      fisher.goToPort();
      this.recordConnectionEvent(pId, 'sent to port');
    }

    if (fisher.disconnectCount > params.disconnectsAllowed) {
      this.loseFisher(pId, 'too many disconnects');
      return;
    }

    var graceMs = params.disconnectGracePeriod * 1000;
    this.disconnected[pId] = {
      since: Date.now(),
      deadline: Date.now() + graceMs,
      timer: setTimeout(this.loseFisher.bind(this, pId, 'grace period expired'), graceMs),
    };
    this.updateDisconnectPause();
    io.sockets.in(this.id).emit('status', this.getSimStatus());
  };

  ocean.fisherReconnected = function(pId) {
    var away = this.disconnected[pId];
    if (!away) return;
    clearTimeout(away.timer);
    delete this.disconnected[pId];
    this.recordConnectionEvent(pId, 'reconnected', { secondsAway: Math.round((Date.now() - away.since) / 1000) });
    this.updateDisconnectPause();
    io.sockets.in(this.id).emit('status', this.getSimStatus());
  };

  // Pause (or keep paused) while anyone is being waited for, and tell the
  // players how long the longest wait can still take
  ocean.updateDisconnectPause = function() {
    if (this.microworld.params.disconnectDuringGrace !== 'pause') return;
    if (this.isDisconnectPauseActive()) {
      this.enterPausedState();
      var _this = this;
      var deadline = Math.max.apply(null, Object.keys(this.disconnected).map(function(p) {
        return _this.disconnected[p].deadline;
      }));
      this.disconnectPauseShown = true;
      io.sockets.in(this.id).emit('disconnectPause', { secondsLeft: Math.ceil((deadline - Date.now()) / 1000) });
    } else if (this.disconnectPauseShown) {
      this.disconnectPauseShown = false;
      io.sockets.in(this.id).emit('disconnectPauseOver');
      this.resumeIfNothingHolds();
    }
  };

  // The grace period ran out, or the fisher went over their allowed disconnects
  ocean.loseFisher = function(pId, reason) {
    var away = this.disconnected[pId];
    if (away) {
      clearTimeout(away.timer);
      delete this.disconnected[pId];
    }
    if (this.isRemovable()) return;
    this.lostParticipants[pId] = reason;

    if (this.microworld.params.disconnectLostAction === 'remove') {
      this.recordConnectionEvent(pId, 'removed', { reason: reason });
      var simulationData = this.grabSimulationData();
      simulationData.participants = [pId];
      ioAdmin.in(this.microworld.experimenter._id.toString()).emit('simulationInterrupt', simulationData);
      this.removeFisher(pId);
      if (!this.isRemovable()) {
        this.updateDisconnectPause();
        io.sockets.in(this.id).emit('status', this.getSimStatus());
      }
    } else {
      this.recordConnectionEvent(pId, 'game ended', { reason: reason });
      this.endOcean('disconnect');
    }
  };

  ocean.clearDisconnectTimers = function() {
    for (var pId in this.disconnected) clearTimeout(this.disconnected[pId].timer);
    this.disconnected = {};
  };

  // What a fisher rejoining a game in progress needs to rebuild their screen
  ocean.getRejoinState = function() {
    return { status: this.getSimStatus() };
  };
};
