'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var microworldSchema = new Schema({
    name: {
        type: String,
        unique: true
    },
    experimenter: {
        _id: ObjectId,
        username: String
    },
    code: String,
    desc: String,
    status: String,
    dateCreated: Date,
    dateActive: Date,
    dateArchived: Date,
    numCompleted: Number,
    numAborted: Number,
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
        }],
        oceanOrder: String
    }
});

exports.Microworld = mongoose.model('Microworld', microworldSchema);
