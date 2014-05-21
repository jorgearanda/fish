'use strict';

var log = require('winston');
var Microworld = require('../models/microworld-model').Microworld;
var om;

function Fisher(name, type, params) {
    this.name = name;
    this.type = type;
    this.params = params;
    this.ready = (this.type === 'bot');
    this.hasReturned = false;

    this.isBot = function () {
        return (this.type === 'bot');
    };
}

function Ocean(mw, io) {
    // TODO - need to pair this with the run-model schema
    this.id = new Date().getTime();
    this.io = io;
    this.status = 'setup';
    this.fishers = [];
    this.humanFishers = [];
    this.humansReady = [];
    this.microworld = mw;
    this.seconds = 0;
    this.secondsSinceAllReturned = 0;

    /////////////////////
    // Membership methods
    /////////////////////

    this.hasRoom = function () {
        return (this.humanFishers.length < this.microworld.numHumans);
    };

    this.allHumansIn = function () {
        return (this.humanFishers.length === this.microworld.numHumans);
    };

    this.addFisher = function (pId) {
        this.humanFishers.push(pId);
        log.info('Fisher ' + pId + ' has joined ocean ' + this.id);
        return;
    };

    this.removeFisher = function (pId) {
        var idx = this.humanFishers.indexOf(pId);
        if (idx > -1) {
            this.humanFishers.splice(idx, 1);
        }

        // Remove from humans ready list as well
        idx = this.humansReady.indexOf(pId);
        if (idx > -1) {
            this.humansReady.splice(idx, 1);
        }

        log.info('Fisher ' + pId + ' has been removed from ocean ' + this.id);
    };

    /////////////////
    // Status methods
    /////////////////

    this.isInInstructions = function () {
        return (this.status === 'instructions'); // Humans still reading
    };

    this.isEveryoneReady = function () {
        return (this.allHumansIn() && 
            this.humanFishers.length === this.humansReady.length);
    };
    
    this.isReadying = function () {
        return (this.status === 'readying'); // before first season
    };
    
    this.isRunning = function () {
        return (this.status === 'running');
    };

    this.hasEveryoneReturned = function () {
        for (var fisher in this.fishers) {
            if (!this.fishers[fisher].hasReturned) {
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

    //////////////////////////
    // Time management methods
    //////////////////////////

    this.resetTimer = function () {
        this.seconds = 0;
    };

    this.tick = function () {
        this.seconds += 1;
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
        this.humansReady.push(pId);
        log.info('Fisher ' + pId + ' is ready to start at ocean ' + this.id);
        io.sockets.in(this.id).emit('aFisherIsReady', pId);
        return;
    };

    this.getOceanReady = function () {
        if (this.isEveryoneReady()) {
            this.status = 'readying';
            log.info('All fishers at ocean ' + this.id + ' are ready to start');
            io.sockets.in(this.id).emit('readying');
        }
    };



}

function OceanManager(io) {
    this.oceans = {};
    this.io = io;

    this.createOcean = function (mwId, cb) {
        Microworld.findOne({_id: mwId}, function onFound(err, mw) {
            // TODO - handle errors
            var ocean = new Ocean(mw, io);
            this.oceans[ocean.id] = ocean;
            log.info('Created ocean ' + ocean.id);

            return cb(null, ocean.id);
        }.bind(this));
    };

    this.deleteOcean = function (oId) {
        delete this.oceans[oId];
        return;
    };

    this.assignFisherToOcean = function (mwId, pId, cb) {
        var oKeys = Object.keys(this.oceans);
        var oId = null;

        for (var i in oKeys) {
            oId = oKeys[i];
            if (this.oceans[oId].microworld._id === mwId &&
                    this.oceans[oId].hasRoom()) {
                this.oceans[oId].addFisher(pId);
                return cb(oId);
            }
        }

        this.createOcean(mwId, function onCreated(err, oId) {
            // TODO - handle errors
            this.oceans[oId].addFisher(pId);
            return cb(oId);
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
            if (this.oceans[oId].isRemovable()) {
                this.deleteOcean(oId);
            }
        }
        return;
    };
}

exports.engine = function engine(io) {
    om = new OceanManager(io);

    io.sockets.on('connection', function (socket) {
        var clientOId;
        var clientPId;

        socket.on('enterOcean', function (mwId, pId) {
            clientPId = pId;
            clientOId = om.assignFisherToOcean(mwId, pId, enteredOcean);
        });

        var enteredOcean = function (newOId) {
            clientOId = newOId;
            socket.join(clientOId);
            io.sockets.in(clientOId).emit('ocean', om.oceans[clientOId]);
        };

        socket.on('readRules', function () {
            om.oceans[clientOId].readRules(clientPId);
        });

        socket.on('disconnect', function () {
            om.removeFisherFromOcean(clientOId, clientPId);
            io.sockets.in(clientOId).emit('yours', om.oceans[clientOId]);
        });
    });
};
