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

        // make a room with one's own socket ID, uniqueness
        // assumed from socket IO
        socket.join(socket.id);
        socket.on('enterOcean', function (mwId, pId, oId, observer) {
            clientPId = pId;
            observerMode = observer;
            if(!observer) {
                // not an observer, than must be a participant
                clientOId = om.assignFisherToOcean(mwId, pId, enteredOcean, socket.id);
            } else {
                enteredOcean(oId);
            }
        });

        var enteredOcean = function (newOId) {
            var myOId = newOId;
            var myPId = clientPId;
            socket.join(myOId);
            socket.emit('ocean', om.oceans[myOId].getParams());
            if(observerMode && om.oceans[myOId].status !== 'initial delay') {
                // in observer mode and the ocean's status is not initial delay,
                // this means the simulation is running so emit to myself this status
                socket.in(socket.id).emit('synchronize observer', om.oceans[myOId].getSimStatus());
            }
            

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
                if(!observerMode) {
                    // not in observer mode, then yes do all these things
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
                        // notify all observing experimenters of my disconnection
                        io.sockets.in(myOId).emit('participant dc', myPId);
                        // notify all experimenters in dashboard of my disconnection
                        ioAdmin.in(ocean.microworld.experimenter._id.toString()).emit('simulationInterrupt', simulationData);
                    }
                    om.removeFisherFromOcean(myOId, myPId);
                } else {
                    om.oceans[myOId].log.info('An observer has finished observing participant ' + myPId);
                }
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
