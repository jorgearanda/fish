"use strict";
var OceanManager, engine, log;

log = require("winston");

OceanManager = require("./ocean-manager").OceanManager;

exports.engine = engine = function(io, ioAdmin) {
  var om;
  log.info("Starting engine");
  om = new OceanManager(io, ioAdmin);
  io.sockets.on("connection", function(socket) {
    var clientOId, clientPId, enteredOcean;
    clientOId = void 0;
    clientPId = void 0;
    socket.on("enterOcean", function(mwId, pId) {
      clientPId = pId;
      clientOId = om.assignFisherToOcean(mwId, pId, enteredOcean);
    });
    enteredOcean = function(newOId) {
      var myOId, myPId;
      myOId = newOId;
      myPId = clientPId;
      socket.join(myOId);
      socket.emit("ocean", om.oceans[myOId].getParams());
      socket.on("readRules", function() {
        om.oceans[myOId].readRules(myPId);
        io.sockets["in"](myOId).emit("aFisherIsReady", myPId);
      });
      socket.on("attemptToFish", function() {
        om.oceans[myOId].attemptToFish(myPId);
      });
      socket.on("goToSea", function() {
        om.oceans[myOId].goToSea(myPId);
      });
      socket.on("return", function() {
        om.oceans[myOId].returnToPort(myPId);
      });
      socket.on("requestPause", function() {
        om.oceans[myOId].pause(myPId);
      });
      socket.on("requestResume", function() {
        om.oceans[myOId].resume(myPId);
      });
      socket.on("disconnect", function() {
        var ocean, simulationData;
        if (!om.oceans[myOId].isInSetup() && !om.oceans[myOId].isRemovable()) {
          ocean = om.oceans[myOId];
          simulationData = ocean.grabSimulationData();
          simulationData.participants = [myPId];
          ioAdmin.injs2coffeeworkaround(ocean.microworld.experimenter._id.toString()).emit("simulationInterrupt", simulationData);
        }
        om.removeFisherFromOcean(myOId, myPId);
      });
    };
  });
  ioAdmin.on("connection", function(socket) {
    var expId;
    expId = void 0;
    socket.on("enterDashboard", function(experimenterId) {
      expId = experimenterId;
      log.info("Experimenter " + expId + " is viewing dashboard");
      socket.join(expId);
      socket.emit("currentRunningSimulations", om.trackedSimulations);
    });
    socket.on("disconnect", function() {
      log.info("Experimenter " + expId + " disconnected from dashboard");
    });
  });
};
