'use strict';

var log = require('winston');
var OceanManager = require('./ocean-manager').OceanManager;

exports.engine = function engine(io, ioAdmin) {
    log.info('Starting engine');

    var om = new OceanManager(io, ioAdmin);

    io.sockets.on('connection', function (socket) {
        var clientOId;
        var clientPId;

        socket.on('enterOcean', function (mwId, pId) {
            clientPId = pId;
            clientOId = om.assignFisherToOcean(mwId, pId, enteredOcean);
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
                om.removeFisherFromOcean(myOId, myPId);
            });
        };
    });

    ioAdmin.on('connection', function(socket) {
        var expId;

        socket.on('enterDashboard', function(experimenterId) {
            expId = experimenterId;
            log.info('Experimenter ' + expId + ' is viewing dashboard');
            om.experimenters[expId] = true;
            socket.join(expId);
            socket.emit('currentRunningSimulations', om.simulations);
        });

        socket.on('disconnect', function() {
            log.info('Experimenter ' + expId + ' disconnected from dashboard');
            // delete from list of observing experimenters
            delete om.experimenters[expId];
        });
    });
};
