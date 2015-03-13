
# GET /account/:id/profile

# POST /experimenters

# For now at least, we assume validation client-side

# PUT /experimenters/:id

# unauthorized access
updateExperimenter = (req, res, exp) ->
  Experimenter.update
    _id: new ObjectId(req.params.id)
  , exp, (err, numUpdated) ->
    if err
      log.error "Error on PUT /experimenters/" + req.params.id, err
      return res.send(500)
    
    # no experimenters updated, bad PUT request
    return res.send(400)  if numUpdated is 0
    res.send 204

  return
"use strict"
log = require("winston")
Experimenter = require("../models/experimenter-model").Experimenter
ObjectId = require("mongoose").Types.ObjectId
exports.displayProfileUpdate = (req, res) ->
  Experimenter.findOne
    _id: new ObjectId(req.params.accountId)
  , (err, exp) ->
    if err or not exp
      log.error "Could not retrieve experimenter on /a/:accountId/profile", err
      res.send 500
    res.render "profile.jade",
      name: exp.name
      email: exp.email

    return

  return

exports.create = (req, res) ->
  exp =
    username: req.body.username
    name: req.body.name
    email: req.body.email

  Experimenter.hashPassword req.body.rawPassword, done = (err, pwd) ->
    if err
      log.error "Error on /experimenters POST", err
      return res.send(500)
    exp.passwordHash = pwd
    Experimenter.create exp, (err, doc) ->
      if err
        log.error "Error on /experimenters POST", err
        return res.send(500)
      res.status(200).send doc

    return

  return

exports.update = (req, res) ->
  return res.send(401)  unless req.params.id is req.session.userId
  return res.status(409).send("password conflict")  if (req.body.rawPassword and not req.body.confirmPass) or (not req.body.rawPassword and req.body.confirmPass) or (req.body.rawPassword isnt req.body.confirmPass)
  if req.body.name or req.body.email or req.body.rawPassword
    exp = {}
    exp.username = req.body.username  if req.body.username
    exp.name = req.body.name  if req.body.name
    if req.body.email
      atpos = req.body.email.indexOf("@")
      dotpos = req.body.email.lastIndexOf(".")
      return res.status(409).send("email conflict")  if atpos < 1 or dotpos < atpos or dotpos + 2 >= req.body.email.length or dotpos <= 2
      exp.email = req.body.email
    if req.body.rawPassword isnt `undefined`
      Experimenter.hashPassword req.body.rawPassword, done = (err, pwd) ->
        if err
          log.error "Error on PUT /experimenters/" + req.params.id, err
          return res.send(500)
        exp.passwordHash = pwd
        updateExperimenter req, res, exp

    else
      updateExperimenter req, res, exp
  else
    res.send 403
  return
