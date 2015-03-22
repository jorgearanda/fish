'use strict';

var log = require('winston');
var OceanManager = require('./ocean-manager').OceanManager;

exports.engine = function engine(io, ioAdmin) {
    log.info('Starting engine');

    var om = new OceanManager(io, ioAdmin);

    io.sockets.on('connection', function (socket) {
        var clientOId;
        var clientPId;
        var observerMode;

        socket.on('enterOcean', function (mwId, pId, oId, observer) {
            clientPId = pId;
            observerMode = observer;
            if(!observer) {
                // not an observer, than must be a participant
                clientOId = om.assignFisherToOcean(mwId, pId, enteredOcean);
            } else {
                enteredOcean(oId);
            }
        });

        var enteredOcean = function (newOId) {
            var myOId = newOId;
            var myPId = clientPId;
            socket.join(myOId);
            socket.emit('ocean', om.oceans[myOId].getParams());
            

            socket.on('readRules', function () {
                om.oceans[myOId].readRules(myPId);
                io.sockets.in(myOId).emit('aFisherIsReady', myPId);
            });

            socket.on('attemptToFish', function () {
                om.oceans[myOId].attemptToFish(myPId);
            });

            socket.on('goToSea', function () {
                om.oceans[myOId].goToSea(myPId);
            });

            socket.on('return', function () {
                om.oceans[myOId].returnToPort(myPId);
            });

            socket.on('requestPause', function () {
                om.oceans[myOId].pause(myPId);
            });

            socket.on('requestResume', function () {
                om.oceans[myOId].resume(myPId);
            });

            socket.on('disconnect', function () {
                if(!om.oceans[myOId].isInSetup() && !om.oceans[myOId].isRemovable()) {
                    // disconnected before ocean i.e before simulation run has finished
                    // and setup phase is completed
                    var ocean = om.oceans[myOId];
                    var simulationData = ocean.grabSimulationData();
                    // replace participants gotten by calling grabSimulationData
                    // with the one currently disconnecting
                    simulationData.participants = [myPId];
                   
                    // keep track of all disconnected participants 
                    if(myOId in om.trackedAbandonParticipants) {
                        om.trackedAbandonParticipants[myOId].participants.push(myPId);
                    } else {
                        om.trackedAbandonParticipants[myOId] = ocean.grabSimulationData();
                        om.trackedAbandonParticipants[myOId].participants = [myPId];
                    }
                    ioAdmin.in(ocean.microworld.experimenter._id.toString()).emit('simulationInterrupt', simulationData);
                }
                om.removeFisherFromOcean(myOId, myPId);
            });
        };
    });

    ioAdmin.on('connection', function(socket) {
        var expId;

        socket.on('enterDashboard', function(experimenterId) {
            expId = experimenterId;
            log.info('Experimenter ' + expId + ' is viewing dashboard');
            socket.join(expId);
            socket.emit('postTracked', om.trackedSimulations, om.trackedAbandonParticipants);
        });

        socket.on('disconnect', function() {
            log.info('Experimenter ' + expId + ' disconnected from dashboard');
        });
    });
};
