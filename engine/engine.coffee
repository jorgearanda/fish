"use strict"
log = require("winston")
OceanManager = require("./ocean-manager").OceanManager
exports.engine = engine = (io, ioAdmin) ->
  log.info "Starting engine"
  om = new OceanManager(io, ioAdmin)
  io.sockets.on "connection", (socket) ->
    clientOId = undefined
    clientPId = undefined
    socket.on "enterOcean", (mwId, pId) ->
      clientPId = pId
      clientOId = om.assignFisherToOcean(mwId, pId, enteredOcean)
      return

    enteredOcean = (newOId) ->
      myOId = newOId
      myPId = clientPId
      socket.join myOId
      socket.emit "ocean", om.oceans[myOId].getParams()
      socket.on "readRules", ->
        om.oceans[myOId].readRules myPId
        io.sockets.in(myOId).emit "aFisherIsReady", myPId
        return

      socket.on "attemptToFish", ->
        om.oceans[myOId].attemptToFish myPId
        return

      socket.on "goToSea", ->
        om.oceans[myOId].goToSea myPId
        return

      socket.on "return", ->
        om.oceans[myOId].returnToPort myPId
        return

      socket.on "requestPause", ->
        om.oceans[myOId].pause myPId
        return

      socket.on "requestResume", ->
        om.oceans[myOId].resume myPId
        return

      socket.on "disconnect", ->
        if not om.oceans[myOId].isInSetup() and not om.oceans[myOId].isRemovable()
          
          # disconnected before ocean i.e before simulation run has finished
          # and setup phase is completed
          ocean = om.oceans[myOId]
          simulationData = ocean.grabSimulationData()
          
          # replace participants gotten by calling grabSimulationData with the one currently disconnecting
          simulationData.participants = [myPId]
          ioAdmin.injs2coffeeworkaround(ocean.microworld.experimenter._id.toString()).emit "simulationInterrupt", simulationData
        om.removeFisherFromOcean myOId, myPId
        return

      return

    return

  ioAdmin.on "connection", (socket) ->
    expId = undefined
    socket.on "enterDashboard", (experimenterId) ->
      expId = experimenterId
      log.info "Experimenter " + expId + " is viewing dashboard"
      socket.join expId
      socket.emit "currentRunningSimulations", om.trackedSimulations
      return

    socket.on "disconnect", ->
      log.info "Experimenter " + expId + " disconnected from dashboard"
      return

    return

  return
