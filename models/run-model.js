'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var runSchema = new Schema({
    time: Date,
    results: [{
        season: Number,
        fishStart: Number,
        fishEnd: Number,
        groupRestraint: Number,
        groupEfficiency: Number,
        fishers: [{
            name: String,
            type: String,
            fishTaken: Number,
            profit: Number,
            individualRestraint: Number,
            individualEfficiency: Number
        }]
    }],
    log: [{
        time: Date,
        entry: String
    }],
    microworld: {
        _id: ObjectId,
        name: String,
        experimenter: {
            _id: ObjectId,
            username: String
        },
        code: String,
        params: {
            numFishers: Number,
            numHumans: Number,
            numSeasons: Number,
            seasonDuration: Number,
            initialDelay: Number,
            seasonDelay: Number,
            enableEarlyEnd: Boolean,
            enablePause: Boolean,
            fishValue: Number,
            costDeparture: Number,
            costSecond: Number,
            costCast: Number,
            currencySymbol: String,
            certainFish: Number,
            availableMysteryFish: Number,
            reportedMysteryFish: Number,
            maxFish: Number,
            spawnFactor: Number,
            chanceCatch: Number,
            showFishers: Boolean,
            showFisherNames: Boolean,
            showFisherStatus: Boolean,
            showNumCaught: Boolean,
            showFisherBalance: Boolean,
            preparationText: String,
            endDepletionText: String,
            endTimeText: String,
            bots: [{
                name: String,
                greed: Number,
                trend: String,
                predictability: String,
                probAction: Number,
                attemptsSecond: Number
            }]
        }
    }
});

exports.Run = mongoose.model('Run', runSchema);
