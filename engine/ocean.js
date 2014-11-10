'use strict';

var Fisher = require('./fisher').Fisher;
var Microworld = require('../models/microworld-model').Microworld;
var OceanLog = require('./ocean-log').OceanLog;
var Run = require('../models/run-model').Run;

var io;

exports.Ocean = function Ocean(mw, incomingIo) {
    io = incomingIo;

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
    this.microworld = mw;
    this.results = [];
    this.log = new OceanLog(this.id);

    for (var botIdx = 0; botIdx < mw.params.bots.length; botIdx++) {
        var bot = mw.params.bots[botIdx];
        this.fishers.push(new Fisher(bot.name, 'bot', bot, this));
        this.log.debug('Bot fisher ' + bot.name + ' joined.');
    }

    /////////////////////
    // Membership methods
    /////////////////////

    this.hasRoom = function () {
        return (this.fishers.length < this.microworld.params.numFishers);
    };

    this.allHumansIn = function () {
        return (this.fishers.length === this.microworld.params.numFishers);
    };

    this.addFisher = function (pId) {
        this.fishers.push(new Fisher(pId, 'human', null, this));
        this.log.info('Human fisher ' + pId + ' joined.');
        return;
    };

    this.removeFisher = function (pId) {
        for (var i in this.fishers) {
            var fisher = this.fishers[i];
            if (!fisher.isBot() && fisher.name === pId) {
                this.fishers.splice(i, 1);
            }
        }
        this.log.info('Human fisher ' + pId + ' left.');
    };

    this.findFisherIndex = function (pId) {
        for (var i in this.fishers) {
            if (this.fishers[i].name === pId) {
                return i;
            }
        }

        return null;
    };

    /////////////////
    // Status methods
    /////////////////

    this.getParams = function () {
        // TODO - need to send more than the initial params perhaps?
        return this.microworld.params;
    };

    this.isInSetup = function () {
        // At least one participant still needs to read instructions
        return (this.status === 'setup');
    };

    this.isEveryoneReady = function () {
        if (this.hasRoom()) return false;
        for (var i in this.fishers) {
            if (!this.fishers[i].ready) return false;
        }
        return true;
    };
    
    this.isInInitialDelay = function () {
        // Before first season
        return (this.status === 'initial delay');
    };
    
    this.isRunning = function () {
        return (this.status === 'running');
    };

    this.hasEveryoneReturned = function () {
        for (var i in this.fishers) {
            if (!this.fishers[i].hasReturned) {
                return false;
            }
        }
        return true;
    };

    this.isResting = function () {
        return (this.status === 'resting'); // between seasons
    };
    
    this.isPaused = function () {
        return (this.status === 'paused');
    };
    
    this.isNotOver = function () {
        return (this.status !== 'over');
    };

    this.isRemovable = function () {
        return (this.status === 'over');
    };

    this.canEndEarly = function () {
        return (this.microworld.params.enableEarlyEnd);
    };

    this.shouldEndSeason = function () {
        return (this.hasReachedSeasonDuration() ||
            (this.canEndEarly() && this.secondsSinceAllReturned >= 3));
    };

    this.pause = function () {

    };

    this.resume = function () {

    };

    this.getSimStatus = function () {
        var status = {
            season: this.season,
            status: this.status,
            certainFish: this.certainFish,
            mysteryFish: this.mysteryFish,
            fishers: []
        }

        for (var i in this.fishers) {
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

    //////////////////////////
    // Time management methods
    //////////////////////////

    this.resetTimer = function () {
        this.seconds = 0;
    };

    this.tick = function () {
        this.seconds += 1;
        this.log.debug('Tick. Seconds: ' + this.seconds);
    };

    this.timeStep = function () {

    };

    this.hasReachedInitialDelay = function () {
        return (this.seconds >= this.microworld.params.initialDelay);
    };

    this.hasReachedSeasonDelay = function () {
        return (this.seconds >= this.microworld.params.seasonDelay);
    };

    this.hasReachedSeasonDuration = function () {
        return (this.seconds >= this.microworld.params.seasonDuration);
    };

    //////////////////////
    // Preparation methods
    //////////////////////

    this.readRules = function (pId) {
        var idx = this.findFisherIndex(pId);
        if (idx) this.fishers[idx].ready = true;
        this.log.info('Fisher ' + pId + ' is ready to start.');
        return;
    };

    this.attemptToFish = function (pId) {
        var idx = this.findFisherIndex(pId);
        if (idx) this.fishers[idx].tryToFish();
        io.sockets.in(this.id).emit('status', this.getSimStatus());
        return;
    };

    this.goToSea = function (pId) {
        var idx = this.findFisherIndex(pId);
        if (idx) this.fishers[idx].goToSea();
        io.sockets.in(this.id).emit('status', this.getSimStatus());
        return;
    };

    this.returnToPort = function (pId) {
        var idx = this.findFisherIndex(pId);
        if (idx) this.fishers[idx].goToPort();
        io.sockets.in(this.id).emit('status', this.getSimStatus());
        return;
    };

    this.getOceanReady = function () {
        this.status = 'initial delay';
        this.log.info('All fishers ready to start.');
        io.sockets.in(this.id).emit('initial delay');
    };

    this.startNextSeason = function () {
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
            fishers: []
        });

        for (var i in this.fishers) {
            this.fishers[i].prepareFisherForSeason(this.season);

            this.results[this.season - 1].fishers.push({
                name: this.fishers[i].name,
                type: this.fishers[i].type,
            });
        }

        // TODO: Need to get proper numbers for certain and mystery fish on seasons after first!
        this.log.info('Beginning season ' + this.season + '.');
        io.sockets.in(this.id).emit('begin season', this.getSimStatus());
    };

    this.endCurrentSeason = function () {
        // Bring all fishers back to port
        for (var i in this.fishers) {
            this.fishers[i].goToPort();
        }

        // Record end data
        var seasonResults = this.results[this.season - 1];
        var preRunFish = this.microworld.params.certainFish + this.microworld.params.availableMysteryFish;
        var spawnFactor = this.microworld.params.spawnFactor;
        seasonResults.fishEnd = this.certainFish + this.mysteryFish;
        seasonResults.groupRestraint = this.groupRestraint(seasonResults);
        seasonResults.groupEfficiency = this.groupEfficiency(seasonResults, preRunFish, spawnFactor);

        for (i in this.fishers) {
            var fisherData = this.fishers[i].seasonData[this.season];
            var fisherResults = seasonResults.fishers[i];
            fisherResults.fishTaken = fisherData.fishCaught;
            fisherResults.profit = fisherData.endMoney - fisherData.startMoney;
            fisherResults.individualRestraint =
                this.individualRestraint(seasonResults, i);
            fisherResults.individualEfficiency =
                this.individualEfficiency(seasonResults, i, preRunFish, spawnFactor);
        }

        if (this.season < this.microworld.params.numSeasons) {
            this.status = 'resting';
            this.resetTimer();
            this.log.info('Ending season ' + this.season + '.');
            io.sockets.in(this.id).emit('end season', {
                season: this.season
            });
        } else {
            this.endOcean('time');
        }
    };

    this.runOcean = function () {
        // States: setup, initial delay, running, resting, paused, over
        var loop = true;
        var delay;
        if (this.isInSetup()) {
            if (!this.allHumansIn()) {
                this.log.debug('Ocean loop - setup: waiting for humans.');
            } else if (!this.isEveryoneReady()) {
                this.log.debug('Ocean loop - setup: reading instructions.')
            } else {
                // Everyone ready!
                this.getOceanReady();
            }
        } else if (this.isInInitialDelay()) {
            delay = this.microworld.params.initialDelay;
            this.log.debug('Ocean loop - initial delay: ' + this.seconds +
                ' of ' + delay + ' seconds.');

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
            this.log.debug('Ocean loop: running: ' + this.seconds +
                ' of ' + duration + ' seconds.');

            for (var i in this.fishers) {
                this.fishers[i].runBot();
            }

            io.sockets.in(this.id).emit('status', this.getSimStatus());

            if (this.seconds + this.warnSeconds >= duration) {
                io.sockets.in(this.id).emit('warn season end');
            }

            if (duration <= this.seconds) {
                this.log.debug('Ocean loop - running: triggering season end.');
                this.endCurrentSeason();
            } else {
                this.tick();
            }
        } else if (this.isResting()) {
            delay = this.microworld.params.seasonDelay;
            this.log.debug('Ocean loop - resting: ' + this.seconds +
                ' of ' + delay + ' seconds.');
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
        } else { // over
            this.log.debug('Ocean loop - over: Stopping.');
            loop = false;
        }

        if (loop) {
            setTimeout(this.runOcean.bind(this), 1000);
        }
    };

    this.setAvailableFish = function () {
        if (this.season === 1) {
            this.certainFish = this.microworld.params.certainFish;
            this.mysteryFish = this.microworld.params.availableMysteryFish;
        } else {
            var spawnFactor = this.microworld.params.spawnFactor;
            var spawnedFish = this.certainFish * spawnFactor;
            var maxFish = this.microworld.params.maxFish;
            this.certainFish = Math.round(Math.min(spawnedFish, maxFish));

            var spawnedMystery = this.mysteryFish * spawnFactor;
            var maxMystery = this.microworld.params.availableMysteryFish;
            this.mysteryFish = Math.round(Math.min(spawnedMystery, maxMystery));
        }
    };

    this.areThereFish = function () {
        return (this.certainFish + this.mysteryFish) > 0;
    };

    this.endOcean = function (reason) {
        this.status = 'over';
        io.sockets.in(this.id).emit('end run', reason);

        if (this.microworld.status !== 'active') {
            this.log.info('Simulation run not saved: in ' +
                this.microworld.status + ' status');
            return;
        }

        var run = {
            time: this.time,
            results: this.results,
            log: this.log.entries,
            microworld: this.microworld
        };
        var _this = this;

        Run.create(run, function onCreate(err, doc) {
            if (err) {
                _this.log.error('Simulation run could not be saved: ' + err);
            }

            if (doc) {
                _this.log.info('Simulation run saved with _id ' + doc._id);
                console.log(_this.microworld._id);
                Microworld.update({_id: _this.microworld._id},
                    {$inc: {numCompleted: 1}}, function (err, num) {
                        if (err) console.log(err);
                        if (num !== 1) console.log(num);
                    });
            }
        });
    };

    this.isSuccessfulCastAttempt = function () {
        return ((this.certainFish + this.mysteryFish > 0) &&
            Math.random() <= this.microworld.params.chanceCatch);
    };

    this.takeOneFish = function () {
        if (Math.floor(Math.random() *
                (this.certainFish + this.mysteryFish)) < this.certainFish) {
            this.certainFish -= 1;
        } else {
            this.mysteryFish -= 1;
        }

        if (!this.areThereFish()) this.endOcean('depletion');
    };

    // Metric calculations
    this.individualRestraint = function (seasonData, fisherIndex) {
        var fishStart = seasonData.fishStart;
        var numFishers = seasonData.fishers.length;
        var fishTaken = seasonData.fishers[fisherIndex].fishTaken;

        if (fishStart === 0) return undefined;
        return (fishStart - numFishers * fishTaken) / fishStart;
    };

    this.groupRestraint = function (seasonData) {
        if (seasonData.fishStart === 0) return undefined;
        return seasonData.fishEnd / seasonData.fishStart;
    };

    this.individualEfficiency = function (seasonData, fisherIndex, preRunFish, spawnFactor) {
        var fishStart = seasonData.fishStart;
        var numFishers = seasonData.fishers.length;
        var fishTaken = seasonData.fishers[fisherIndex].fishTaken;

        if (preRunFish <= spawnFactor * fishStart) {
            // Not endangered
            return (fishStart - fishTaken * numFishers) * spawnFactor / preRunFish;
        } else {
            // Endangered
            return (fishStart - fishTaken * numFishers) / fishStart;
        }
    };

    this.groupEfficiency = function (seasonData, preRunFish, spawnFactor) {
        var fishStart = seasonData.fishStart;
        var fishEnd = seasonData.fishEnd;

        if (preRunFish <= spawnFactor * fishStart) {
            // Not endangered
            return fishEnd * spawnFactor / preRunFish;
        } else {
            // Endangered
            return fishEnd / fishStart;
        }
    };
};
