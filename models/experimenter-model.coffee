"use strict"
bcrypt = require("bcrypt")
mongoose = require("mongoose")
BCRYPT_COST = 12
Schema = mongoose.Schema
experimenterSchema = new Schema(
  username:
    type: String
    unique: true

  passwordHash: String
  name: String
  email: String
)
experimenterSchema.statics.hashPassword = hash = (rawPassword, next) ->
  bcrypt.hash rawPassword, BCRYPT_COST, next

experimenterSchema.statics.comparePasswords = (raw, hash, next) ->
  bcrypt.compare raw, hash, next

exports.Experimenter = mongoose.model("Experimenter", experimenterSchema)
