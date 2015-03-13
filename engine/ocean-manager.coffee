"use strict"
log = require("winston")
Microworld = require("../models/microworld-model").Microworld
Ocean = require("./ocean").Ocean
exports.OceanManager = OceanManager = (io, ioAdmin) ->
  @oceans = {}
  @io = io
  @ioAdmin = ioAdmin
  
  # simulations currently tracked
  @trackedSimulations = {}
  @createOcean = (mwId, cb) ->
    Microworld.findOne
      _id: mwId
    
    # TODO - handle errors
    , (onFound = (err, mw) ->
      ocean = new Ocean(mw, @io, @ioAdmin, this)
      @oceans[ocean.id] = ocean
      ocean.log.info "Ocean created."
      ocean.runOcean()
      cb null, ocean.id
    ).bind(this)
    return

  @deleteOcean = (oId) ->
    delete @oceans[oId]

    delete @trackedSimulations[oId]

    return

  @assignFisherToOcean = (mwId, pId, cb) ->
    oKeys = Object.keys(@oceans)
    oId = null
    for i of oKeys
      oId = oKeys[i]
      if @oceans[oId].microworld._id.toString() is mwId and @oceans[oId].hasRoom()
        @oceans[oId].addFisher pId
        return cb(oId)
    
    # TODO - handle errors
    @createOcean mwId, (onCreated = (err, oId) ->
      @oceans[oId].addFisher pId
      cb oId
    ).bind(this)
    return

  @removeFisherFromOcean = (oId, pId) ->
    @oceans[oId].removeFisher pId
    return

  @purgeOceans = ->
    oKeys = Object.keys(@oceans)
    oId = undefined
    for i of oKeys
      oId = oKeys[i]
      expId = undefined
      time = undefined
      if @oceans[oId].isRemovable()
        log.info "Purging ocean " + @oceans[oId].microworld.name + " " + oId + " (" + @oceans[oId].microworld.experimenter.username + ")"
        @deleteOcean oId
    setTimeout @purgeOceans.bind(this), 5000
    return

  @purgeOceans()
  return
