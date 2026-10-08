'use strict';

var buildDeviceRecord = require('./device-info').buildDeviceRecord;
var Fisher = require('./fisher').Fisher;
var Microworld = require('../models/microworld-model').Microworld;
var OceanLog = require('./ocean-log').OceanLog;
var Run = require('../models/run-model').Run;

var io;
var ioAdmin;

exports.Ocean = function Ocean(mw, incomingIo, incomingIoAdmin, om) {
  io = incomingIo;
  ioAdmin = incomingIoAdmin;

  this.time = new Date();
  this.id = this.time.getTime();
  this.status = 'setup';
  this.fishers = [];
  this.season = 0;
  this.seconds = 0;
  this.warnSeconds = 3;
  this.secondsSinceAllReturned = 0;
  this.certainFish = 0;
  this.mysteryFish = 0;
  this.reportedMysteryFish = 0;
  this.microworld = mw;
  this.results = [];
  // Device records by participant ID; kept even if the participant later drops out
  this.devices = {};
  this.playersAtStart = [];     // humans in the game when it started (set in getOceanReady)
  this.endReason = null;        // why the game ended (endOcean)
  this.om = om;
  this.catchIntentSeason = 0;
  this.catchIntentDisplaySeason = 0;
  this.log = new OceanLog(
    this.microworld.name + ' ' + this.id + ' ' + '(' + this.microworld.experimenter.username + ')'
  );

  for (var botIdx = 0; botIdx < mw.params.bots.length; botIdx++) {
    var bot = mw.params.bots[botIdx];
    var botFisher = new Fisher(bot.name, 'bot', bot, this);
    var kMs = (botIdx * 60 + Math.random() * 60) * 1000;
    botFisher.entryTime = Date.now() - kMs;
    botFisher.readyTime = Date.now() - kMs;
    this.fishers.push(botFisher);
    this.log.debug('Bot fisher ' + bot.name + ' joined.');
  }
  this.oceanOrder = 'ocean_order_user_top';

  // Track how many fishers of each class are still needed
  if (mw.params.fisherClassesEnabled && mw.params.fisherClassCounts) {
    this.classesNeeded = Object.assign({}, mw.params.fisherClassCounts);
    // Subtract bots that already have classes assigned
    for (var bi = 0; bi < this.fishers.length; bi++) {
      var botClass = this.fishers[bi].params.fClass;
      if (botClass && this.classesNeeded[botClass] > 0) {
        this.classesNeeded[botClass]--;
      }
    }
  } else {
    this.classesNeeded = null;
  }

  /////////////////////
  // Membership methods
  /////////////////////

  this.hasRoom = function() {
    return this.isInSetup() && this.fishers.length < this.microworld.params.numFishers;
  };

  this.needsClass = function(fClass) {
    if (!this.classesNeeded) return true;
    return (this.classesNeeded[fClass] || 0) > 0;
  };

  this.allHumansIn = function() {
    return this.fishers.length === this.microworld.params.numFishers;
  };

  this.hasNoHumans = function() {
    for (var i in this.fishers) {
      if (this.fishers[i].isHuman()) {
        return false;
      }
    }
    return true;
  };


  this.addFisher = function(pId, pParams) {
    var validatedParams = pParams || {};
    if (this.microworld.params.fisherClassesEnabled) {
      var validClasses = this.microworld.params.fisherClasses || [];
      if (validClasses.length > 0) {
        if (!validatedParams.fClass) {
          validatedParams.fClass = validClasses[0];
        } else {
          // Case-insensitive lookup: use the canonical (capitalized) class name
          var inputLower = validatedParams.fClass.toLowerCase();
          var matched = validClasses.filter(function(c) { return c.toLowerCase() === inputLower; });
          validatedParams.fClass = matched.length > 0 ? matched[0] : validClasses[0];
        }
      }
    }
    this.fishers.push(new Fisher(pId, 'human', validatedParams, this));
    if (this.classesNeeded && validatedParams.fClass && this.classesNeeded[validatedParams.fClass] > 0) {
      this.classesNeeded[validatedParams.fClass]--;
    }
    this.log.info('Human fisher ' + pId + ' joined.');
    return;
  };

  this.removeFisher = function(pId) {
    for (var i in this.fishers) {
      var fisher = this.fishers[i];
      if (fisher.isHuman() && fisher.name === pId) {
        this.clearAllAbortTimers(pId);
        this.resume(pId); // just in case this fisher paused the game just before leaving!
        if (this.classesNeeded && fisher.params.fClass) {
          this.classesNeeded[fisher.params.fClass] = (this.classesNeeded[fisher.params.fClass] || 0) + 1;
        }
        this.fishers.splice(i, 1);
        this.log.info('Human fisher ' + pId + ' left.');
      }
    }
    if (this.hasNoHumans()) {
      // Ocean used to hang around for other humans to show up.
      // That can lead to problems if the corresponding microworld is still in test mode and gets changed.
      // Experimenter will assume incorrectly that when the ocean eventually runs, that it has the latest settings. 
      this.endOceanForLackOfHumans();
    }
  };

  this.findFisherIndex = function(pId) {
    for (var i in this.fishers) {
      if (this.fishers[i].name === pId) {
        return parseInt(i, 10);
      }
    }

    return null;
  };

  /////////////////
  // Status methods
  /////////////////

  this.getParams = function() {
    // TODO - need to send more than the initial params perhaps?
    return this.microworld.params;
  };

  this.isInSetup = function() {
    // At least one participant still needs to read instructions
    return this.status === 'setup';
  };

  this.isEveryoneReady = function() {
    if (this.hasRoom()) return false;
    for (var i in this.fishers) {
      if (!this.fishers[i].ready) return false;
    }
    return true;
  };

  this.isInInitialDelay = function() {
    // Before first season
    return this.status === 'initial delay';
  };

  this.isRunning = function() {
    return this.status === 'running';
  };

  this.hasEveryoneReturned = function() {
    for (var i in this.fishers) {
      if (!this.fishers[i].hasReturned) {
        return false;
      }
    }
    return true;
  };

  this.isResting = function() {
    return this.status === 'resting'; // between seasons
  };

  this.isPaused = function() {
    return this.status === 'paused';
  };

  this.isNotOver = function() {
    return this.status !== 'over';
  };

  this.isRemovable = function() {
    return this.status === 'over';
  };

  this.canEndEarly = function() {
    return this.microworld.params.enableEarlyEnd;
  };

  this.shouldEndSeason = function() {
    return this.hasReachedSeasonDuration() || (this.canEndEarly() && this.secondsSinceAllReturned >= 3);
  };

  this.catchIntentIsEnabled = function() {
    return this.microworld.params.catchIntentionsEnabled;
  }

  this.catchIntentIsActive = function(season) {
    return this.catchIntentIsEnabled() 
      && season <= this.microworld.params.numSeasons
      && this.microworld.params.catchIntentSeasons.indexOf(season) >= 0;
  }

  this.profitSeasonIsDisabled = function() {
    return this.microworld.params.profitSeasonDisabled;
  }

  this.profitTotalIsDisabled = function() {
    return this.microworld.params.profitTotalDisabled;
  }

  this.profitGapIsDisabled = function() {
    return !this.microworld.params.fisherAdvantageEnabled ||
           this.microworld.params.profitGapDisabled;
  }

  this.profitDisplayIsDisabled = function() {
    return this.profitSeasonIsDisabled() &&
           this.profitTotalIsDisabled() &&
           this.profitGapIsDisabled();
  }

  this.setDelayForSeason = function(season) {
    this.seasonDelayInEffect = this.catchIntentIsActive(season)
    ?  this.microworld.params.seasonDelay + this.microworld.params.catchIntentExtraTime
    :  this.microworld.params.seasonDelay;
  }

  // Pausing and resuming (pause, resume, the resume countdown, the clock's
  // phase length), and what happens when a fisher's connection drops
  // (grace period, lost fishers, rejoining, connection records)
  require('./ocean-pause').install(this, io);
  require('./ocean-disconnects').install(this, io, ioAdmin);

  this.getSimStatus = function() {
    var status = {
      season: this.season,
      status: this.status,
      certainFish: this.certainFish,
      mysteryFish: this.mysteryFish,
      certainSpawn: this.certainSpawn,
      reportedMysteryFish: this.reportedMysteryFish,
      catchIntentSeason: this.catchIntentSeason,
      catchIntentDisplaySeason: this.catchIntentDisplaySeason,
      // For the clock: seconds into the current phase, and its length
      seconds: this.seconds,
      phaseLength: this.getPhaseLength(),
      resumingIn: this.resumingIn,
      fishers: [],
    };

    for (var i in this.fishers) {
      status.fishers.push({
        name: this.fishers[i].name,
        params: this.fishers[i].params,
        seasonData: this.fishers[i].seasonData,
        money: this.fishers[i].money,
        totalFishCaught: this.fishers[i].totalFishCaught,
        totalCasts: this.fishers[i].totalCasts,
        totalDepartures: this.fishers[i].totalDepartures,
        totalSecondsAtSea: this.fishers[i].totalSecondsAtSea,
        status: this.fishers[i].status,
      });
    }

    return status;
  };

  //////////////////////////
  // Time management methods
  //////////////////////////

  this.resetTimer = function() {
    this.seconds = 0;
  };

  this.tick = function() {
    this.seconds += 1;
    if (this.hasEveryoneReturned()) this.secondsSinceAllReturned += 1;
    this.log.debug('Tick. Seconds: ' + this.seconds);
  };

  this.hasReachedInitialDelay = function() {
    return this.seconds >= this.microworld.params.initialDelay;
  };

  this.hasReachedSeasonDelay = function() {
    return this.seconds >= this.microworld.params.seasonDelay;
  };

  this.hasReachedSeasonDuration = function() {
    return this.seconds >= this.microworld.params.seasonDuration;
  };

  this.hasReachedCatchIntentDialogDuration = function() {
    return this.seconds >= this.microworld.params.catchIntentDialogDuration;
  };

  //////////////////////
  // Preparation methods
  //////////////////////

  this.readRules = function(pId) {
    var idx = this.findFisherIndex(pId);
    if (idx !== null) {
      this.fishers[idx].ready = true;
      this.fishers[idx].readyTime = Date.now();
    }
    this.clearReadRulesTimer(pId);
    this.startLobbyWaitTimer(pId);
    this.log.info('Fisher ' + pId + ' is ready to start.');
    return;
  };

  this.getLobbyStatus = function() {
    var numFishers = this.microworld.params.numFishers;
    var slots = [];
    for (var i = 0; i < this.fishers.length; i++) {
      var f = this.fishers[i];
      slots.push({ pId: f.name, entryTime: f.entryTime, readyTime: f.readyTime });
    }
    while (slots.length < numFishers) {
      slots.push(null);
    }
    return { slots: slots };
  };

  ////////////////////////////
  // Abort / timeout methods
  ////////////////////////////

  this.setFisherNotifier = function(pId, socketId, notifyFn) {
    var idx = this.findFisherIndex(pId);
    if (idx !== null) {
      this.fishers[idx].notify = notifyFn;
      this.fishers[idx].socketId = socketId;
      this.startReadRulesTimer(pId);
    }
  };

  this.isCurrentSocket = function(pId, socketId) {
    var idx = this.findFisherIndex(pId);
    if (idx === null) return false;
    return this.fishers[idx].socketId === socketId;
  };

  this.getSocketId = function(pId) {
    var idx = this.findFisherIndex(pId);
    return idx !== null ? this.fishers[idx].socketId : null;
  };

  this.startReadRulesTimer = function(pId) {
    var idx = this.findFisherIndex(pId);
    if (idx === null) return;
    var fisher = this.fishers[idx];
    var timeoutMins = this.microworld.params.readRulesTimeout;
    if (!timeoutMins || fisher.ready) return;
    this.clearReadRulesTimer(pId);
    var self = this;
    fisher.readRulesTimer = setTimeout(function() {
      fisher.readRulesTimer = null;
      self.onPlayerTimeout(pId, 'readingRules');
    }, timeoutMins * 60 * 1000);
  };

  this.clearReadRulesTimer = function(pId) {
    var idx = this.findFisherIndex(pId);
    if (idx === null) return;
    var fisher = this.fishers[idx];
    if (fisher.readRulesTimer) {
      clearTimeout(fisher.readRulesTimer);
      fisher.readRulesTimer = null;
    }
  };

  this.startLobbyWaitTimer = function(pId) {
    var idx = this.findFisherIndex(pId);
    if (idx === null) return;
    var fisher = this.fishers[idx];
    var timeoutMins = this.microworld.params.lobbyWaitTimeout;
    if (!timeoutMins) return;
    this.clearLobbyWaitTimer(pId);
    var self = this;
    fisher.lobbyWaitTimer = setTimeout(function() {
      fisher.lobbyWaitTimer = null;
      self.onPlayerTimeout(pId, 'lobbyWait');
    }, timeoutMins * 60 * 1000);
  };

  this.clearLobbyWaitTimer = function(pId) {
    var idx = this.findFisherIndex(pId);
    if (idx === null) return;
    var fisher = this.fishers[idx];
    if (fisher.lobbyWaitTimer) {
      clearTimeout(fisher.lobbyWaitTimer);
      fisher.lobbyWaitTimer = null;
    }
  };

  this.clearAllAbortTimers = function(pId) {
    this.clearReadRulesTimer(pId);
    this.clearLobbyWaitTimer(pId);
  };

  this.onPlayerTimeout = function(pId, stage) {
    var idx = this.findFisherIndex(pId);
    if (idx === null) return;
    var fisher = this.fishers[idx];
    fisher.timeoutCount += 1;
    this.log.info('Fisher ' + pId + ' timed out (stage: ' + stage + ', count: ' + fisher.timeoutCount + ')');
    var maxTimeouts = this.microworld.params.maxTimeouts;
    if (fisher.timeoutCount >= maxTimeouts) {
      if (fisher.notify) fisher.notify('forceAbort', {});
    } else {
      if (fisher.notify) fisher.notify('abortPrompt', { stage: stage });
    }
  };

  this.keepReading = function(pId) {
    this.startReadRulesTimer(pId);
  };

  this.keepWaiting = function(pId) {
    this.startLobbyWaitTimer(pId);
  };

  this.attemptToFish = function(pId) {
    var idx = this.findFisherIndex(pId);
    // Ignore attempts that arrive late (e.g. over a slow network) after the
    // season has ended, during a pause, or after the fisher returned to port
    if (idx !== null && this.isRunning() && this.fishers[idx].status === 'At sea') {
      this.fishers[idx].tryToFish();
    } else if (idx !== null) {
      this.log.info('Ignoring fishing attempt by ' + pId + ' (ocean: ' + this.status +
        ', fisher: ' + this.fishers[idx].status + ').');
    }
    io.sockets.in(this.id).emit('status', this.getSimStatus());
    return;
  };

  this.recordIntendedCatch = function(pId, numFish) {
    var idx = this.findFisherIndex(pId);
    if (idx !== null) this.fishers[idx].recordIntendedCatch(numFish);
    // the following is true ONLY for fisher idx!!! 
    // this.catchIntentDisplaySeason = this.catchIntentSeason;
    // Tell fisher idx to remove the dialog and display the intent column
    // socket.emit('stop asking intent');
    io.sockets.in(this.id).emit('status', this.getSimStatus());
    return;
  };
  
  this.goToSea = function(pId) {
    var idx = this.findFisherIndex(pId);
    // Same as attemptToFish: a late departure must not carry over into the rest period
    if (idx !== null && this.isRunning()) {
      this.fishers[idx].goToSea();
    } else if (idx !== null) {
      this.log.info('Ignoring departure by ' + pId + ' (ocean: ' + this.status + ').');
    }
    io.sockets.in(this.id).emit('status', this.getSimStatus());
    return;
  };

  this.returnToPort = function(pId) {
    var idx = this.findFisherIndex(pId);
    if (idx !== null) this.fishers[idx].goToPort();
    io.sockets.in(this.id).emit('status', this.getSimStatus());
    return;
  };

  this.getHumansInOcean = function() {
    var humanList = [];
    for (var i in this.fishers) {
      if (this.fishers[i].type === 'human') {
        humanList.push(this.fishers[i].name);
      }
    }
    return humanList;
  };

  this.grabSimulationData = function() {
    var simulationData = {};
    simulationData.oceanId = this.id;
    simulationData.expId = this.microworld.experimenter._id.toString();
    simulationData.code = this.microworld.code;
    simulationData.participants = this.getHumansInOcean();
    simulationData.time = new Date(this.id).toString();
    return simulationData;
  };

  this.getOceanReady = function() {
    for (var fi in this.fishers) {
      this.clearAllAbortTimers(this.fishers[fi].name);
    }
    var expId = this.microworld.experimenter._id.toString();
    this.status = 'initial delay';
    this.playersAtStart = this.getHumansInOcean();
    this.log.info('All fishers ready to start.');
    io.sockets.in(this.id).emit('initial delay');

    var simulationData = this.grabSimulationData();
    this.om.trackedSimulations[this.id] = simulationData;
    ioAdmin.in(expId).emit('newSimulation', simulationData);
  };

  this.startNextSeason = function() {
    this.season += 1;
    this.log.debug('Preparing to begin season ' + this.season + '.');

    this.resetTimer();
    this.status = 'running';
    this.secondsSinceAllReturned = 0;
    this.setAvailableFish();

    // Record starting data
    this.results.push({
      season: this.season,
      fishStart: this.certainFish + this.mysteryFish,
      fishers: [],
    });

    for (var i in this.fishers) {
      this.fishers[i].prepareFisherForSeason(this.season);

      this.results[this.season - 1].fishers.push({
        name: this.fishers[i].name,
        type: this.fishers[i].type,
      });
    }

    this.catchIntentSeason = this.catchIntentIsActive(this.season) ? this.season : 0;
    this.catchIntentDisplaySeason = this.catchIntentSeason;

    // TODO: Need to get proper numbers for certain and mystery fish on seasons after first!
    this.log.info('Beginning season ' + this.season + '.');
    let status = this.getSimStatus();
    io.sockets.in(this.id).emit('begin season', status);
  };

  this.endCurrentSeason = function(reason) {
    // Bring all fishers back to port
    for (var i in this.fishers) {
      this.fishers[i].goToPort();
    }

    // Record end data
    var seasonResults = this.results[this.season - 1];
    var preRunFish = this.microworld.params.certainFish + this.microworld.params.availableMysteryFish;
    var spawnFactor = this.microworld.params.spawnFactor;
    this.results[this.season - 1].fishEnd = this.certainFish + this.mysteryFish;
    this.results[this.season - 1].groupRestraint = this.groupRestraint(this.results[this.season - 1]);
    this.results[this.season - 1].groupEfficiency = this.groupEfficiency(
      this.results[this.season - 1],
      preRunFish,
      spawnFactor
    );

    for (i in this.fishers) {
      var fisherData = this.fishers[i].seasonData[this.season];
      var fisherResults = this.results[this.season - 1].fishers[i];
      fisherResults.fishPlanned = fisherData.catchIntent;
      fisherResults.fishTaken = fisherData.fishCaught;
      fisherResults.greed = fisherData.greed;
      fisherResults.profit = fisherData.endMoney - fisherData.startMoney;
      fisherResults.individualRestraint = this.individualRestraint(this.results[this.season - 1], i);
      fisherResults.individualEfficiency = this.individualEfficiency(
        this.results[this.season - 1],
        i,
        preRunFish,
        spawnFactor
      );
    }

    if (this.season < this.microworld.params.numSeasons && reason !== 'depletion' && reason !== 'nohumans') {
      this.status = 'resting';
      this.resetTimer();
      this.log.info('Ending season ' + this.season + '.');
      io.sockets.in(this.id).emit('end season', {
        status: this.status,
        season: this.season,
      });
      if (this.catchIntentIsActive(this.season+1)) {
        this.catchIntentSeason = this.season+1;
        for (i in this.fishers) {
          this.fishers[i].prepareToAskCatchIntent();
        }
        io.sockets.in(this.id).emit('start asking intent');
      }
      else { 
        this.catchIntentSeason = 0;
      }
    } else {
      this.endOcean(reason);
    }
  };

  this.runOcean = function() {
    // States: setup, initial delay, running, resting, paused, over
    var loop = true;
    var delay;
    if (this.isInSetup()) {
      if (!this.allHumansIn()) {
        this.log.debug('Ocean loop - setup: waiting for humans.');
      } else if (!this.isEveryoneReady()) {
        this.log.debug('Ocean loop - setup: reading instructions.');
      } else {
        // Everyone ready!
        this.getOceanReady();
      }
    } else if (this.isInInitialDelay()) {
      delay = this.microworld.params.initialDelay;
      // For the participants' clock ("Starting in ...")
      io.sockets.in(this.id).emit('status', this.getSimStatus());
      this.log.debug('Ocean loop - initial delay: ' + this.seconds + ' of ' + delay + ' seconds.');

      if (this.seconds + this.warnSeconds >= delay) {
        io.sockets.in(this.id).emit('warn season start');
      }

      if (delay <= this.seconds) {
        this.log.debug('Ocean loop - initial delay: triggering season start.');
        this.startNextSeason();
      } else {
        this.tick();
      }
    } else if (this.isRunning()) {
      var duration = this.microworld.params.seasonDuration;
      this.log.debug('Ocean loop: running: ' + this.seconds + ' of ' + duration + ' seconds.');

      for (var i in this.fishers) {
        this.fishers[i].runBot();
      }

      io.sockets.in(this.id).emit('status', this.getSimStatus());

      if (this.seconds + this.warnSeconds >= duration) {
        io.sockets.in(this.id).emit('warn season end');
      }

      if (this.shouldEndSeason()) {
        this.log.debug('Ocean loop - running: triggering season end.');
        this.endCurrentSeason('time');
      } else {
        this.tick();
      }
    } else if (this.isResting()) {
      delay = this.microworld.params.seasonDelay;
      this.log.debug('Ocean loop - resting: ' + this.seconds + ' of ' + delay + ' seconds.');
      this.setAvailableSpawn(delay);

      if (this.catchIntentSeason > this.season) {
        this.getBotsCatchIntent();
        if (this.hasReachedCatchIntentDialogDuration()) {
          io.sockets.in(this.id).emit('stop asking intent');
          this.catchIntentDisplaySeason = this.catchIntentSeason;
        }
      }

      io.sockets.in(this.id).emit('status', this.getSimStatus());

      if (this.seconds + this.warnSeconds >= delay) {
        io.sockets.in(this.id).emit('warn season start');
      }

      if (delay <= this.seconds) {
        this.log.debug('Ocean loop - resting: triggering season start.');
        this.startNextSeason();
      } else {
        this.tick();
      }
    } else if (this.isPaused()) {
      this.log.debug('Ocean loop - paused.');
      this.advanceResumeCountdown();
    } else {
      // over
      this.log.debug('Ocean loop - over: Stopping.');
      loop = false;
    }

    if (loop) {
      setTimeout(this.runOcean.bind(this), 1000);
    }
  };

  this.getBotsCatchIntent = function() {
    for (var i in this.fishers) {
      if (this.fishers[i].isBot()) {
        this.fishers[i].maybeGetBotCatchIntent();
      }
    }
  };

  this.setAvailableFish = function() {
    if (this.season === 1) {
      this.certainFish = this.microworld.params.certainFish;
      this.mysteryFish = this.microworld.params.availableMysteryFish;
      this.reportedMysteryFish = this.microworld.params.reportedMysteryFish;
    } else {
      var spawnFactor = this.microworld.params.spawnFactor;
      var spawnedFish = this.certainFish * spawnFactor;
      var maxFish = this.microworld.params.maxFish;
      this.certainFish = Math.round(Math.min(spawnedFish, maxFish));

      var spawnedMystery = this.mysteryFish * spawnFactor;
      var maxMystery = this.microworld.params.availableMysteryFish;
      this.mysteryFish = Math.round(Math.min(spawnedMystery, maxMystery));
    }
    this.certainSpawn = 0;
  };

  this.setAvailableSpawn = function(delay) {
    // This method is called every clock tick in between seasons to compute gradually spawning fish
    // so that the client can visually represent the growing number of fish in the ocean
    var spawnFactor = this.microworld.params.spawnFactor;
    var spawnedFish = this.certainFish * spawnFactor;
    var maxFish = this.microworld.params.maxFish;
    var certainNewFish = Math.round(Math.min(spawnedFish, maxFish)) - this.certainFish;
    this.certainSpawn = delay <= 0 ? 0 : Math.round(certainNewFish * this.seconds / delay);
  };

  this.areThereFish = function() {
    return this.certainFish + this.mysteryFish > 0;
  };

  this.recordDevice = function(pId, rawInfo) {
    var record = buildDeviceRecord(pId, rawInfo);
    this.devices[pId] = record;
    this.log.info('Fisher ' + pId + ' device: ' + [record.deviceClass, record.brand, record.model,
      record.os + ' ' + record.osVersion, record.browser + ' ' + record.browserVersion,
      record.inAppBrowser].filter(Boolean).join(', '));
  };

  this.getDevices = function() {
    var _this = this;
    return Object.keys(this.devices).map(function(pId) { return _this.devices[pId]; });
  };

  this.getParticipants = function() {
    var participants = [];
    for (var i in this.fishers) {
      if (!this.fishers[i].isBot()) {
        participants.push(this.fishers[i].name);
      }
    }

    return participants;
  };

  this.endOceanForLackOfHumans = function() {
    // All humans have left - this could happen any time, 
    // including naturally at the end of a complete run, 
    // so be careful how to terminate and avoid recursion!
    if (this.status === 'running' || this.status === 'paused') {
      this.endCurrentSeason('nohumans');
    }
    else if (this.status !== 'over') {
      this.endOcean('nohumans');
    }
  }

  this.endOcean = function(reason) {
    this.status = 'over';
    this.endReason = reason;
    this.clearDisconnectTimers();
    // No longer running: a dashboard opened from now on shouldn't list it. The
    // ocean itself stays until the purge, so late events can still find it.
    if (this.om && this.om.trackedSimulations) delete this.om.trackedSimulations[this.id];
    ioAdmin.in(this.microworld.experimenter._id.toString()).emit('simulationDone', this.grabSimulationData());
    io.sockets.in(this.id).emit('end run', reason);

    if (this.microworld.status !== 'active') {
      this.log.info('Simulation run not saved: in ' + this.microworld.status + ' status');
      return;
    }

    var run = {
      time: this.time,
      participants: this.getParticipants(),
      results: this.results,
      devices: this.getDevices(),
      endReason: reason,
      connectionEvents: this.connectionEvents,
      log: this.log.entries,
      microworld: this.microworld,
    };
    var _this = this;

    Run.create(run, function onCreate(err, doc) {
      if (err) {
        _this.log.error('Simulation run could not be saved: ' + err);
      }

      if (doc) {
        _this.log.info('Simulation run saved with _id ' + doc._id);
        Microworld.update({ _id: _this.microworld._id }, { $inc: { numCompleted: 1 } }, function(err, num) {
          if (err) {
            _this.log.error('Simulation count could not be incremented: ', err);
          }
        });
      }
    });
  };

  this.isSuccessfulCastAttempt = function() {
    return this.certainFish + this.mysteryFish > 0 && Math.random() <= this.microworld.params.chanceCatch;
  };

  this.takeOneFish = function() {
    if (Math.floor(Math.random() * (this.certainFish + this.mysteryFish)) < this.certainFish) {
      this.certainFish -= 1;
    } else {
      this.mysteryFish -= 1;
      this.reportedMysteryFish -= 1;
    }

    if (!this.areThereFish()) this.endCurrentSeason('depletion');
  };

  /////////////////////////////
  // Metric calculation methods
  /////////////////////////////

  this.individualRestraint = function(seasonData, fisherIndex) {
    var fishStart = seasonData.fishStart;
    var numFishers = seasonData.fishers.length;
    var fishTaken = seasonData.fishers[fisherIndex].fishTaken;

    if (fishStart === 0) return undefined;
    return (fishStart - numFishers * fishTaken) / fishStart;
  };

  this.groupRestraint = function(seasonData) {
    if (seasonData.fishStart === 0) return undefined;
    return seasonData.fishEnd / seasonData.fishStart;
  };

  this.individualEfficiency = function(seasonData, fisherIndex, preRunFish, spawnFactor) {
    var fishStart = seasonData.fishStart;
    var numFishers = seasonData.fishers.length;
    var fishTaken = seasonData.fishers[fisherIndex].fishTaken;

    if (preRunFish <= spawnFactor * fishStart) {
      // Not endangered
      return ((fishStart - fishTaken * numFishers) * spawnFactor) / preRunFish;
    } else {
      // Endangered
      return (fishStart - fishTaken * numFishers) / fishStart;
    }
  };

  this.groupEfficiency = function(seasonData, preRunFish, spawnFactor) {
    var fishStart = seasonData.fishStart;
    var fishEnd = seasonData.fishEnd;

    if (preRunFish <= spawnFactor * fishStart) {
      // Not endangered
      return (fishEnd * spawnFactor) / preRunFish;
    } else {
      // Endangered
      return fishEnd / fishStart;
    }
  };
};
