'use strict';
/* global io:true */

var socket = io.connect();
var mwId = $.url().param('mwid');
var pId = $.url().param('pid');

socket.on('connect', function () {
    console.log('connected');
    socket.emit('join', mwId);
});

socket.on('count', function (i) {
    console.log('count: ' + i);
});
