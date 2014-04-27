'use strict';

var log = require('winston');

var Microworld = require('../models/microworld-model').Microworld;

var oceans = {};

function Ocean (mw) {
    this.id = new Date().getTime();
    this.fishers = [];
    this.microworld = mw;

    this.addFisher = function (pid) {
        this.fishers.push(pid);
        return;
    };

    this.removeFisher = function (pid) {
        var idx = this.fishers.indexOf(pid);
        if (idx > -1) {
            this.fishers.splice(idx, 1);
        }
    };
    // TODO - complete
}

function getOceanFor(mwid) {
    // Do we have an ocean with available slots?
    var keys = Object.keys(oceans);
    var oid;
    for (var i in keys) {
        oid = keys[i];
        if (oceans[oid] && oceans[oid].hasRoom()) {
            // Found one; return that
            return oid;
        }
    }

    // If we're still here, create that ocean
    Microworld.find({_id: mwid}, function onFound(err, mw) {
        if (err || !mw) console.log('Panic!'); // TODO fixme

        var newOcean = new Ocean(mw);
        oceans[newOcean.id] = newOcean;
        return newOcean.id;
    });
}

exports.engine = function engine(io) {
    var counters = {};

    io.sockets.on('connection', function (socket) {
        var ocean;
        var myId;

        socket.on('enterOcean', function (mwid, pid) {
            ocean = getOceanFor(mwid); // TODO -- fixme. I'm actually returning an id
            myId = ocean.id;
            ocean.addFisher(pid);
            console.log(ocean.fishers);
            socket.join(myId);
            io.sockets.in(myId).emit('count', ocean.fishers.length);
            // TODO -- revise
        });

        socket.on('join', function (id) {
            // TODO - take out
            counters[id] = counters[id] ? counters[id] + 1 : 1;
            console.log(counters);
            myId = id;
            socket.join(id);
            io.sockets.in(id).emit('count', counters[id]);
        });

        socket.on('disconnect', function (pid) {
            // TODO - revise
            ocean.removeFisher();
            console.log(ocean.fishers);
            io.sockets.in(myId).emit('count', ocean.fishers.length);
        });
    });
};
