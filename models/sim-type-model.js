'use strict';

var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var simTypeSchema = new Schema({
   name: {
      type: String,
      unique: true
   },
   experimenter: {
      _id: ObjectId,
      username: String
   },
   desc: String,
   dateCreated: Date,
   dateActive: Date,
   dateArchived: Date,
   numCompleted: Number,
   numAborted: Number,
   params: {} // TODO: Fill out
});

exports.SimType = mongoose.model('SimType', simTypeSchema);
