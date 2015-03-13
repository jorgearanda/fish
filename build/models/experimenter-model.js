"use strict";
var BCRYPT_COST, Schema, bcrypt, experimenterSchema, hash, mongoose;

bcrypt = require("bcrypt");

mongoose = require("mongoose");

BCRYPT_COST = 12;

Schema = mongoose.Schema;

experimenterSchema = new Schema({
  username: {
    type: String,
    unique: true
  },
  passwordHash: String,
  name: String,
  email: String
});

experimenterSchema.statics.hashPassword = hash = function(rawPassword, next) {
  return bcrypt.hash(rawPassword, BCRYPT_COST, next);
};

experimenterSchema.statics.comparePasswords = function(raw, hash, next) {
  return bcrypt.compare(raw, hash, next);
};

exports.Experimenter = mongoose.model("Experimenter", experimenterSchema);
