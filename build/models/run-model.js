"use strict";
var ObjectId, Schema, mongoose, runSchema;

mongoose = require("mongoose");

Schema = mongoose.Schema;

ObjectId = Schema.ObjectId;

runSchema = new Schema({
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
          type: {
            type: String
          },
          fishTaken: Number,
          profit: Number,
          greed: Number,
          greedSpread: Number,
          individualRestraint: Number,
          individualEfficiency: Number
        }
      ]
    }
  ],
  log: [String],
  microworld: {}
});

exports.Run = mongoose.model("Run", runSchema);
