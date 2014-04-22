'use strict';

var socket = io.connect();
var id = $.url().param('id');

socket.on('connect', function () {
    console.log('connected');
    socket.emit('join', id);
});

socket.on('count', function (i) {
    console.log('count: ' + i);
});
