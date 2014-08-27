'use strict';

var Fisher = require('./fisher').Fisher;
var OceanLog = require('./ocean-log').OceanLog;

var io;

exports.Ocean = function Ocean(mw, incomingIo) {
    io = incomingIo;

    this.time = new Date();
    this.id = this.time.getTime();
    this.status = 'setup';
    this.fishers = [];
    this.season = 0;
    this.seconds = 0;
    this.secondsSinceAllReturned = 0;
    this.certainFish = 0;
    this.mysteryFish = 0;
    this.microworld = mw;
    this.results = [];
    this.log = new OceanLog(this.id);
    
    for (var botIdx = 0; botIdx < mw.params.bots.length; botIdx++) {
        var bot = mw.params.bots[botIdx];
        this.fishers.push(new Fisher(bot.name, 'bot', bot, this));
        this.log.info('Bot fisher ' + bot.name + ' joined.');
    }

    /////////////////////
    // Membership methods
    /////////////////////

    this.hasRoom = function () {
        return (this.fishers.length < this.microworld.numFishers);
    };

    this.allHumansIn = function () {
        return (this.fishers.length === this.microworld.numFishers);
    };

    this.addFisher = function (pId) {
        this.fishers.push(new Fisher(pId, 'human'));
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

    this.isInInstructions = function () {
        return (this.status === 'instructions'); // Humans still reading
    };

    this.isEveryoneReady = function () {
        if (this.hasRoom()) return false;
        for (var i in this.fishers) {
            if (!this.fishers[i].ready) return false;
        }
        return true;
    };
    
    this.isReadying = function () {
        return (this.status === 'readying'); // before first season
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
        this.getOceanReady();
        return;
    };

    this.getOceanReady = function () {
        if (this.isEveryoneReady()) {
            this.status = 'readying';
            this.log.info('All fishers ready to start.');
            io.sockets.in(this.id).emit('readying');
        }
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

            this.results.fishers.push({
                name: this.fishers[i].name,
                type: this.fishers[i].type,
            });
        }

        this.log.info('Beginning season ' + this.season + '.');
        io.sockets.in(this.id).emit('beginSeason', {
            season: this.season,
            certainFish: this.certainFish,
            mysteryFish: this.mysteryFish,
            fishers: this.fishers
        });
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
            io.sockets.in(this.id).emit('endSeason', {
                season: this.season
            });
        } else {
            this.endOcean();
        }
    };

    this.runOcean = function () {
        // States: instructions, readying, running, resting, paused, over
        var loop = true;
        var delay;
        if (!this.allHumansIn()) {
            this.log.debug('Ocean loop - waiting for humans.');
        } else if (this.isInInstructions()) {
            this.log.debug('Ocean loop - reading instructions.');
        } else if (this.isReadying()) {
            delay = this.microworld.params.initialDelay;
            this.log.debug('Ocean loop - readying: ' + this.seconds +
                ' of ' + delay + ' seconds.');

            if (delay <= this.seconds) {
                this.log.debug('Ocean loop - triggering season start.');
                this.startNextSeason();
            } else {
                this.tick();
            }
        } else if (this.isRunning()) {
            var duration = this.microworld.params.seasonDuration;
            this.log.debug('Ocean loop - running: ' + this.seconds +
                ' of ' + duration + ' seconds.');

            if (duration <= this.seconds) {
                this.log.debug('Ocean loop - triggering season end.');
                this.endCurrentSeason();
            } else {
                this.tick();
            }
        } else if (this.isResting()) {
            delay = this.microworld.params.seasonDelay;
            this.log.debug('Ocean loop - resting: ' + this.seconds +
                ' of ' + delay + ' seconds.');

            if (delay <= this.seconds) {
                this.log.debug('Ocean loop - triggering season start.');
                this.startNextSeason();
            } else {
                this.tick();
            }
        } else if (this.isPaused()) {
            this.log.debug('Ocean loop - paused.');
        } else { // over
            this.log.debug('Stopping ocean loop - ocean has reached Over state.');
            loop = false;
        }

        if (loop) {
            setTimeout(this.runOcean, 1000);
        } else {
            this.endOcean();
        }
    };

    this.setAvailableFish = function () {
        if (this.season === 1) {
            this.certainFish = this.microworld.params.certainFish;
            this.mysteryFish = this.microworld.params.availableMysteryFish;
        } else {
            var spawnedFish = this.certainFish * this.spawnFactor;
            var maxFish = this.microworld.params.maxFish;
            this.certainFish = Math.round(Math.min(spawnedFish, maxFish));

            var spawnedMystery = this.mysteryFish * this.spawnFactor;
            var maxMystery = this.microworld.params.availableMysteryFish;
            this.mysteryFish = Math.round(Math.min(spawnedMystery, maxMystery));
        }
    };

    this.checkForDepletion = function () {

    };

    this.endOcean = function () {

    };

    this.isSuccessfulCastAttempt = function () {

    };

    this.removeOneFish = function () {

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
