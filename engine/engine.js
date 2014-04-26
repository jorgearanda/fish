var log = require('winston');

var Microworld = require('../models/microworld-model').Microworld;

var oceans = {};

function Ocean (mw) {
    // TODO
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
        var name;

        socket.on('enterMicroworld', function (mwid, name) {
            ocean = getOceanFor(mwid); // TODO -- fixme. I'm actually returning an id
            oceans[ocean.id] = ocean;
            // TODO -- rework approach 


        });

        socket.on('join', function (oceanId, fisherName) {

            counters[id] = counters[id] ? counters[id] + 1 : 1;
            console.log(counters);
            myId = id;
            socket.join(id);
            io.sockets.in(id).emit('count', counters[id]);
        });

        socket.on('disconnect', function () {
            counters[myId] -= 1;
            console.log(counters);
            io.sockets.in(myId).emit('count', counters[myId]);
        });
    });
}