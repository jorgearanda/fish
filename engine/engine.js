var log = require('winston');

exports.engine = function engine(io) {
    var counters = {};

    io.sockets.on('connection', function (socket) {
        var myId;

        socket.on('join', function (id) {
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