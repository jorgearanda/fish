'use strict';

// Pausing a game, and resuming it after a countdown. install() adds these
// methods and their state to an Ocean (see ocean.js); they use the ocean's
// own state through `this`.
//
// The game can be paused for two reasons at once: a fisher pressed Pause
// (pausedBy), and/or a disconnected fisher is being waited for
// (ocean-disconnects.js). Play resumes only when neither applies, and then
// only after the resume countdown, run by the game loop.

exports.install = function(ocean, io) {
  ocean.unpauseState = null; // what the game was doing when it paused
  ocean.pausedBy = null;     // the fisher whose Pause button holds the game
  ocean.resumingIn = null;   // seconds left before play resumes

  // What the game is doing, or was doing before a pause
  ocean.currentPhase = function() {
    return this.isPaused() ? this.unpauseState : this.status;
  };

  // Stop the game clock (for any reason); false if there is nothing to pause
  ocean.enterPausedState = function() {
    if (this.isPaused() || !(this.isRunning() || this.isResting() || this.isInInitialDelay())) return false;
    this.unpauseState = this.status;
    this.status = 'paused';
    return true;
  };

  // A fisher's Pause button (during a season or the break after it)
  ocean.pause = function(pauseRequester) {
    if (this.isRunning() || this.isResting()) {
      this.log.info('Simulation paused by fisher ' + pauseRequester);
      this.pausedBy = pauseRequester;
      this.enterPausedState();
      io.sockets.in(this.id).emit('pause');
      io.sockets.in(this.id).emit('status', this.getSimStatus());
    }
  };

  ocean.resume = function(resumeRequester) {
    if (this.isPaused() && this.pausedBy === resumeRequester) {
      this.log.info('Simulation resumed by fisher ' + resumeRequester);
      this.pausedBy = null;
      this.resumeIfNothingHolds();
    }
  };

  // The countdown before play resumes: the microworld's initial delay, but at
  // least 2 and at most 5 seconds. The minimum is for the other players: a
  // reconnecting player knows the game is about to go on, but the others, who
  // were waiting, need a moment's warning that the pause is over.
  ocean.resumeCountdownSeconds = function() {
    var initialDelay = Math.round(this.microworld.params.initialDelay || 0);
    return Math.max(2, Math.min(5, initialDelay));
  };

  // Start the resume countdown once nothing holds the pause any more
  ocean.resumeIfNothingHolds = function() {
    if (this.isPaused() && !this.pausedBy && !this.isDisconnectPauseActive() && this.resumingIn === null) {
      var countdown = this.resumeCountdownSeconds();
      if (countdown <= 0) {
        this.finishResume();
        return;
      }
      this.resumingIn = countdown;
      this.log.info('Resuming in ' + countdown + ' s.');
      io.sockets.in(this.id).emit('status', this.getSimStatus());
    }
  };

  // Called every second by the game loop while paused
  ocean.advanceResumeCountdown = function() {
    if (this.resumingIn === null) return;
    if (this.pausedBy || this.isDisconnectPauseActive()) {
      // Paused again (Pause button, or another player dropped): start over later
      this.resumingIn = null;
      io.sockets.in(this.id).emit('status', this.getSimStatus());
      return;
    }
    this.resumingIn -= 1;
    if (this.resumingIn <= 0) {
      this.finishResume();
    } else {
      io.sockets.in(this.id).emit('status', this.getSimStatus());
    }
  };

  ocean.finishResume = function() {
    this.resumingIn = null;
    this.status = this.unpauseState;
    io.sockets.in(this.id).emit('resume');
    io.sockets.in(this.id).emit('status', this.getSimStatus());
  };

  // Length in seconds of the phase the game is in (or was in before a pause),
  // for the participants' clock
  ocean.getPhaseLength = function() {
    var phase = this.currentPhase();
    var params = this.microworld.params;
    if (phase === 'initial delay') return params.initialDelay;
    if (phase === 'running') return params.seasonDuration;
    if (phase === 'resting') return params.seasonDelay;
    return null;
  };
};
