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
            log.info(om.oceans[clientOId]);
            io.sockets.in(clientOId).emit('ocean', om.oceans[clientOId]);
        };

        socket.on('readRules', function () {
            om.oceans[clientOId].readRules(clientPId);
            io.sockets.in(clientOId).emit('aFisherIsReady', clientPId);
        });

        socket.on('disconnect', function () {
            om.removeFisherFromOcean(clientOId, clientPId);
            io.sockets.in(clientOId).emit('yours', om.oceans[clientOId]);
        });
    });
};
