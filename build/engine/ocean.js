"use strict";
var Fisher, Microworld, Ocean, OceanLog, Run, io, ioAdmin;

Fisher = require("./fisher").Fisher;

Microworld = require("../models/microworld-model").Microworld;

OceanLog = require("./ocean-log").OceanLog;

Run = require("../models/run-model").Run;

io = void 0;

ioAdmin = void 0;

exports.Ocean = Ocean = function(mw, incomingIo, incomingIoAdmin, om) {
  var bot, botIdx;
  io = incomingIo;
  ioAdmin = incomingIoAdmin;
  this.time = new Date();
  this.id = this.time.getTime();
  this.status = "setup";
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
  this.om = om;
  this.log = new OceanLog(this.microworld.name + " " + this.id + " " + "(" + this.microworld.experimenter.username + ")");
  botIdx = 0;
  while (botIdx < mw.params.bots.length) {
    bot = mw.params.bots[botIdx];
    this.fishers.push(new Fisher(bot.name, "bot", bot, this));
    this.log.debug("Bot fisher " + bot.name + " joined.");
    botIdx++;
  }
  this.oceanOrder = "ocean_order_user_top";
  this.hasRoom = function() {
    return this.isInSetup() && this.fishers.length < this.microworld.params.numFishers;
  };
  this.allHumansIn = function() {
    return this.fishers.length === this.microworld.params.numFishers;
  };
  this.addFisher = function(pId) {
    this.fishers.push(new Fisher(pId, "human", null, this));
    this.log.info("Human fisher " + pId + " joined.");
  };
  this.removeFisher = function(pId) {
    var fisher, i;
    for (i in this.fishers) {
      fisher = this.fishers[i];
      if (!fisher.isBot() && fisher.name === pId) {
        this.fishers.splice(i, 1);
      }
    }
    this.log.info("Human fisher " + pId + " left.");
  };
  this.findFisherIndex = function(pId) {
    var i;
    for (i in this.fishers) {
      if (this.fishers[i].name === pId) {
        return parseInt(i, 10);
      }
    }
    return null;
  };
  this.getParams = function() {
    return this.microworld.params;
  };
  this.isInSetup = function() {
    return this.status === "setup";
  };
  this.isEveryoneReady = function() {
    var i;
    if (this.hasRoom()) {
      return false;
    }
    for (i in this.fishers) {
      if (!this.fishers[i].ready) {
        return false;
      }
    }
    return true;
  };
  this.isInInitialDelay = function() {
    return this.status === "initial delay";
  };
  this.isRunning = function() {
    return this.status === "running";
  };
  this.hasEveryoneReturned = function() {
    var i;
    for (i in this.fishers) {
      if (!this.fishers[i].hasReturned) {
        return false;
      }
    }
    return true;
  };
  this.isResting = function() {
    return this.status === "resting";
  };
  this.isPaused = function() {
    return this.status === "paused";
  };
  this.isNotOver = function() {
    return this.status !== "over";
  };
  this.isRemovable = function() {
    return this.status === "over";
  };
  this.canEndEarly = function() {
    return this.microworld.params.enableEarlyEnd;
  };
  this.shouldEndSeason = function() {
    return this.hasReachedSeasonDuration() || (this.canEndEarly() && this.secondsSinceAllReturned >= 3);
  };
  this.pause = function(pauseRequester) {
    if (this.isRunning() || this.isResting()) {
      this.log.info("Simulation paused by fisher " + pauseRequester);
      this.unpauseState = this.status;
      this.pausedBy = pauseRequester;
      this.status = "paused";
      io.sockets["in"](this.id).emit("pause");
      io.sockets["in"](this.id).emit("status", this.getSimStatus());
    }
  };
  this.resume = function(resumeRequester) {
    if (this.isPaused() && this.pausedBy === resumeRequester) {
      this.log.info("Simulation resumed by fisher " + resumeRequester);
      this.status = this.unpauseState;
      io.sockets["in"](this.id).emit("resume");
      io.sockets["in"](this.id).emit("status", this.getSimStatus());
    }
  };
  this.getSimStatus = function() {
    var i, status;
    status = {
      season: this.season,
      status: this.status,
      certainFish: this.certainFish,
      mysteryFish: this.mysteryFish,
      reportedMysteryFish: this.reportedMysteryFish,
      fishers: []
    };
    for (i in this.fishers) {
      status.fishers.push({
        name: this.fishers[i].name,
        seasonData: this.fishers[i].seasonData,
        money: this.fishers[i].money,
        totalFishCaught: this.fishers[i].totalFishCaught,
        status: this.fishers[i].status
      });
    }
    return status;
  };
  this.resetTimer = function() {
    this.seconds = 0;
  };
  this.tick = function() {
    this.seconds += 1;
    if (this.hasEveryoneReturned()) {
      this.secondsSinceAllReturned += 1;
    }
    this.log.debug("Tick. Seconds: " + this.seconds);
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
  this.readRules = function(pId) {
    var idx;
    idx = this.findFisherIndex(pId);
    if (idx !== null) {
      this.fishers[idx].ready = true;
    }
    this.log.info("Fisher " + pId + " is ready to start.");
  };
  this.attemptToFish = function(pId) {
    var idx;
    idx = this.findFisherIndex(pId);
    if (idx !== null) {
      this.fishers[idx].tryToFish();
    }
    io.sockets["in"](this.id).emit("status", this.getSimStatus());
  };
  this.goToSea = function(pId) {
    var idx;
    idx = this.findFisherIndex(pId);
    if (idx !== null) {
      this.fishers[idx].goToSea();
    }
    io.sockets["in"](this.id).emit("status", this.getSimStatus());
  };
  this.returnToPort = function(pId) {
    var idx;
    idx = this.findFisherIndex(pId);
    if (idx !== null) {
      this.fishers[idx].goToPort();
    }
    io.sockets["in"](this.id).emit("status", this.getSimStatus());
  };
  this.getHumansInOcean = function() {
    var humanList, i;
    humanList = [];
    for (i in this.fishers) {
      if (this.fishers[i].type === "human") {
        humanList.push(this.fishers[i].name);
      }
    }
    return humanList;
  };
  this.grabSimulationData = function() {
    var simulationData;
    simulationData = {};
    simulationData.expId = this.microworld.experimenter._id.toString();
    simulationData.code = this.microworld.code;
    simulationData.participants = this.getHumansInOcean();
    simulationData.time = (new Date(this.id)).toString();
    return simulationData;
  };
  this.getOceanReady = function() {
    var expId, simulationData;
    expId = this.microworld.experimenter._id.toString();
    this.status = "initial delay";
    this.log.info("All fishers ready to start.");
    io.sockets["in"](this.id).emit("initial delay");
    simulationData = this.grabSimulationData();
    this.om.trackedSimulations[this.id] = simulationData;
    ioAdmin.injs2coffeeworkaround(expId).emit("newSimulation", simulationData);
  };
  this.startNextSeason = function() {
    var i;
    this.season += 1;
    this.log.debug("Preparing to begin season " + this.season + ".");
    this.resetTimer();
    this.status = "running";
    this.secondsSinceAllReturned = 0;
    this.setAvailableFish();
    this.results.push({
      season: this.season,
      fishStart: this.certainFish + this.mysteryFish,
      fishers: []
    });
    for (i in this.fishers) {
      this.fishers[i].prepareFisherForSeason(this.season);
      this.results[this.season - 1].fishers.push({
        name: this.fishers[i].name,
        type: this.fishers[i].type
      });
    }
    this.log.info("Beginning season " + this.season + ".");
    io.sockets["in"](this.id).emit("begin season", this.getSimStatus());
  };
  this.endCurrentSeason = function(reason) {
    var fisherData, fisherResults, i, preRunFish, seasonResults, spawnFactor;
    for (i in this.fishers) {
      this.fishers[i].goToPort();
    }
    seasonResults = this.results[this.season - 1];
    preRunFish = this.microworld.params.certainFish + this.microworld.params.availableMysteryFish;
    spawnFactor = this.microworld.params.spawnFactor;
    this.results[this.season - 1].fishEnd = this.certainFish + this.mysteryFish;
    this.results[this.season - 1].groupRestraint = this.groupRestraint(this.results[this.season - 1]);
    this.results[this.season - 1].groupEfficiency = this.groupEfficiency(this.results[this.season - 1], preRunFish, spawnFactor);
    for (i in this.fishers) {
      fisherData = this.fishers[i].seasonData[this.season];
      fisherResults = this.results[this.season - 1].fishers[i];
      fisherResults.fishTaken = fisherData.fishCaught;
      fisherResults.greed = fisherData.greed;
      fisherResults.profit = fisherData.endMoney - fisherData.startMoney;
      fisherResults.individualRestraint = this.individualRestraint(this.results[this.season - 1], i);
      fisherResults.individualEfficiency = this.individualEfficiency(this.results[this.season - 1], i, preRunFish, spawnFactor);
    }
    if (this.season < this.microworld.params.numSeasons && reason !== "depletion") {
      this.status = "resting";
      this.resetTimer();
      this.log.info("Ending season " + this.season + ".");
      io.sockets["in"](this.id).emit("end season", {
        season: this.season
      });
    } else {
      this.endOcean(reason);
    }
  };
  this.runOcean = function() {
    var delay, duration, i, loop_;
    loop_ = true;
    delay = void 0;
    if (this.isInSetup()) {
      if (!this.allHumansIn()) {
        this.log.debug("Ocean loop - setup: waiting for humans.");
      } else if (!this.isEveryoneReady()) {
        this.log.debug("Ocean loop - setup: reading instructions.");
      } else {
        this.getOceanReady();
      }
    } else if (this.isInInitialDelay()) {
      delay = this.microworld.params.initialDelay;
      this.log.debug("Ocean loop - initial delay: " + this.seconds + " of " + delay + " seconds.");
      if (this.seconds + this.warnSeconds >= delay) {
        io.sockets["in"](this.id).emit("warn season start");
      }
      if (delay <= this.seconds) {
        this.log.debug("Ocean loop - initial delay: triggering season start.");
        this.startNextSeason();
      } else {
        this.tick();
      }
    } else if (this.isRunning()) {
      duration = this.microworld.params.seasonDuration;
      this.log.debug("Ocean loop: running: " + this.seconds + " of " + duration + " seconds.");
      for (i in this.fishers) {
        this.fishers[i].runBot();
      }
      io.sockets["in"](this.id).emit("status", this.getSimStatus());
      if (this.seconds + this.warnSeconds >= duration) {
        io.sockets["in"](this.id).emit("warn season end");
      }
      if (this.shouldEndSeason()) {
        this.log.debug("Ocean loop - running: triggering season end.");
        this.endCurrentSeason("time");
      } else {
        this.tick();
      }
    } else if (this.isResting()) {
      delay = this.microworld.params.seasonDelay;
      this.log.debug("Ocean loop - resting: " + this.seconds + " of " + delay + " seconds.");
      io.sockets["in"](this.id).emit("status", this.getSimStatus());
      if (this.seconds + this.warnSeconds >= delay) {
        io.sockets["in"](this.id).emit("warn season start");
      }
      if (delay <= this.seconds) {
        this.log.debug("Ocean loop - resting: triggering season start.");
        this.startNextSeason();
      } else {
        this.tick();
      }
    } else if (this.isPaused()) {
      this.log.debug("Ocean loop - paused.");
    } else {
      this.log.debug("Ocean loop - over: Stopping.");
      loop_ = false;
    }
    if (loop_) {
      setTimeout(this.runOcean.bind(this), 1000);
    }
  };
  this.setAvailableFish = function() {
    var maxFish, maxMystery, spawnFactor, spawnedFish, spawnedMystery;
    if (this.season === 1) {
      this.certainFish = this.microworld.params.certainFish;
      this.mysteryFish = this.microworld.params.availableMysteryFish;
      this.reportedMysteryFish = this.microworld.params.reportedMysteryFish;
    } else {
      spawnFactor = this.microworld.params.spawnFactor;
      spawnedFish = this.certainFish * spawnFactor;
      maxFish = this.microworld.params.maxFish;
      this.certainFish = Math.round(Math.min(spawnedFish, maxFish));
      spawnedMystery = this.mysteryFish * spawnFactor;
      maxMystery = this.microworld.params.availableMysteryFish;
      this.mysteryFish = Math.round(Math.min(spawnedMystery, maxMystery));
    }
  };
  this.areThereFish = function() {
    return (this.certainFish + this.mysteryFish) > 0;
  };
  this.getParticipants = function() {
    var i, participants;
    participants = [];
    for (i in this.fishers) {
      if (!this.fishers[i].isBot()) {
        participants.push(this.fishers[i].name);
      }
    }
    return participants;
  };
  this.endOcean = function(reason) {
    var onCreate, run, _this;
    this.status = "over";
    ioAdmin.injs2coffeeworkaround(this.microworld.experimenter._id.toString()).emit("simulationDone", this.grabSimulationData());
    io.sockets["in"](this.id).emit("end run", reason);
    if (this.microworld.status !== "active") {
      this.log.info("Simulation run not saved: in " + this.microworld.status + " status");
      return;
    }
    run = {
      time: this.time,
      participants: this.getParticipants(),
      results: this.results,
      log: this.log.entries,
      microworld: this.microworld
    };
    _this = this;
    Run.create(run, onCreate = function(err, doc) {
      if (err) {
        _this.log.error("Simulation run could not be saved: " + err);
      }
      if (doc) {
        _this.log.info("Simulation run saved with _id " + doc._id);
        Microworld.update({
          _id: _this.microworld._id
        }, {
          $inc: {
            numCompleted: 1
          }
        }, function(err, num) {
          if (err) {
            _this.log.error("Simulation count could not be incremented: ", err);
          }
        });
      }
    });
  };
  this.isSuccessfulCastAttempt = function() {
    return (this.certainFish + this.mysteryFish > 0) && Math.random() <= this.microworld.params.chanceCatch;
  };
  this.takeOneFish = function() {
    if (Math.floor(Math.random() * (this.certainFish + this.mysteryFish)) < this.certainFish) {
      this.certainFish -= 1;
    } else {
      this.mysteryFish -= 1;
      this.reportedMysteryFish -= 1;
    }
    if (!this.areThereFish()) {
      this.endCurrentSeason("depletion");
    }
  };
  this.individualRestraint = function(seasonData, fisherIndex) {
    var fishStart, fishTaken, numFishers;
    fishStart = seasonData.fishStart;
    numFishers = seasonData.fishers.length;
    fishTaken = seasonData.fishers[fisherIndex].fishTaken;
    if (fishStart === 0) {
      return undefined;
    }
    return (fishStart - numFishers * fishTaken) / fishStart;
  };
  this.groupRestraint = function(seasonData) {
    if (seasonData.fishStart === 0) {
      return undefined;
    }
    return seasonData.fishEnd / seasonData.fishStart;
  };
  this.individualEfficiency = function(seasonData, fisherIndex, preRunFish, spawnFactor) {
    var fishStart, fishTaken, numFishers;
    fishStart = seasonData.fishStart;
    numFishers = seasonData.fishers.length;
    fishTaken = seasonData.fishers[fisherIndex].fishTaken;
    if (preRunFish <= spawnFactor * fishStart) {
      return (fishStart - fishTaken * numFishers) * spawnFactor / preRunFish;
    } else {
      return (fishStart - fishTaken * numFishers) / fishStart;
    }
  };
  this.groupEfficiency = function(seasonData, preRunFish, spawnFactor) {
    var fishEnd, fishStart;
    fishStart = seasonData.fishStart;
    fishEnd = seasonData.fishEnd;
    if (preRunFish <= spawnFactor * fishStart) {
      return fishEnd * spawnFactor / preRunFish;
    } else {
      return fishEnd / fishStart;
    }
  };
};
