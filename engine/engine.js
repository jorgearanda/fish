'use strict';

var log = require('winston');
var OceanManager = require('./ocean-manager').OceanManager;

exports.engine = function engine(io) {
    log.info('Starting engine');

    var om = new OceanManager(io);

    io.sockets.on('connection', function (socket) {
        var clientOId;
        var clientPId;

        socket.on('enterOcean', function (mwId, pId) {
            clientPId = pId;
            clientOId = om.assignFisherToOcean(mwId, pId, enteredOcean);
        });

        var enteredOcean = function (newOId) {
            clientOId = newOId;
            socket.join(clientOId);
            io.sockets.in(clientOId).emit('ocean', om.oceans[clientOId].getParams());
        };

        socket.on('readRules', function () {
            om.oceans[clientOId].readRules(clientPId);
            io.sockets.in(clientOId).emit('aFisherIsReady', clientPId);
        });

        socket.on('attemptToFish', function () {
            om.oceans[clientOId].attemptToFish(clientPId);
        });

        socket.on('goToSea', function () {
            om.oceans[clientOId].goToSea(clientPId);
        });

        socket.on('return', function () {
            om.oceans[clientOId].returnToPort(clientPId);
        });

        socket.on('requestPause', function () {
            om.oceans[clientOId].pause(clientPId);
        });

        socket.on('requestResume', function () {
            om.oceans[clientOId].resume(clientPId);
        });

        socket.on('disconnect', function () {
            om.removeFisherFromOcean(clientOId, clientPId);
            io.sockets.in(clientOId).emit('yours', om.oceans[clientOId].getParams());
        });
    });
};
