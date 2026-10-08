'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var runSchema = new Schema({
  time: Date,
  participants: [String],
  results: [
    {
      season: Number,
      fishStart: Number,
      fishEnd: Number,
      groupRestraint: Number,
      groupEfficiency: Number,
      fishers: [
        {
          name: String,
          type: { type: String },
          fishPlanned: String,
          fishTaken: Number,
          profit: Number,
          greed: Number,
          greedSpread: Number,
          individualRestraint: Number,
          individualEfficiency: Number,
        },
      ],
    },
  ],
  // One record per participant who joined (see src/engine/device-info.js)
  devices: [
    {
      participant: String,
      deviceClass: String,
      brand: String,
      model: String,
      os: String,
      osVersion: String,
      browser: String,
      browserVersion: String,
      inAppBrowser: String,
      touch: Boolean,
      screenWidth: Number,
      screenHeight: Number,
      viewportWidth: Number,
      viewportHeight: Number,
      pixelRatio: Number,
      language: String,
      userAgent: String,
      recordedAt: Date,
    },
  ],
  // Why the run ended: time, depletion, nohumans, or disconnect
  endReason: String,
  // Disconnects, reconnects and their consequences, in order (see ocean.js Disconnect Handling)
  connectionEvents: [
    {
      participant: String,
      event: String, // disconnected, sent to port, reconnected, removed, game ended
      time: Date,
      season: Number,
      second: Number,
      phase: String, // what the game was doing: initial delay, running, resting
      resultsSeason: Number, // the season this counts toward (a break counts toward the next)
      count: Number, // nth disconnect of this participant
      secondsAway: Number, // on reconnect
      reason: String, // for removed / game ended
    },
  ],
  log: [String],
  microworld: {},
});

exports.Run = mongoose.model('Run', runSchema);
