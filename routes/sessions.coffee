"use strict"
async = require("async")
log = require("winston")
Experimenter = require("../models/experimenter-model.js").Experimenter
Microworld = require("../models/microworld-model.js").Microworld

# POST /sessions
exports.createSession = (req, res) ->
  username = req.body.username
  password = req.body.password
  return res.status(400).send("Missing username or password")  if not username or not password
  async.waterfall [
    findExperimenter = (next) ->
      Experimenter.findOne
        username: username
      , onFound = (err, exp) ->
        if err
          return next(
            message: err.message
            status: 500
          )
        unless exp
          return next(
            message: "Invalid credentials"
            status: 409
          )
        next null, exp

    checkPassword = (exp, next) ->
      Experimenter.comparePasswords password, exp.passwordHash, onCompared = (err, match) ->
        if err
          return next(
            message: err.message
            status: 500
          )
        unless match
          return next(
            message: "Invalid credentials"
            status: 409
          )
        next null, exp

  ], resolve = (err, exp) ->
    if err and err.status is 500
      log.error "Error on POST /sessions", err
      return res.status(500).send(errors: "Internal Server Error")
    if err
      log.info "Failed login for " + username
      return res.status(err.status).send(errors: err.message)
    req.session.username = username
    req.session.userId = exp._id
    log.info "Valid login for " + username
    res.status(200).send exp

  return


# POST /participant-sessions
exports.participantSession = (req, res) ->
  code = req.body.code
  pid = req.body.pid
  return res.status(400).send("Missing experiment code or participant ID")  if not code or not pid
  Microworld.findOne
    code: code
    status:
      $in: [
        "test"
        "active"
      ]
  , onFound = (err, mw) ->
    if err
      log.error "Error on POST /runs", err
      return res.status(500).send(errors: "Internal Server Error")
    unless mw
      log.info "Failed participant session creation for " + code
      return res.status(409).send(errors: "Invalid experiment code")
    log.info "Valid run creation for " + code
    res.status(200).send mw

  return
