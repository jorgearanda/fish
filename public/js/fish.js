'use strict';
/* global io:true */

var socket = io.connect();
var mwId = $.url().param('mwid');
var pId = $.url().param('pid');

socket.on('connect', function () {
    console.log('connected');
    socket.emit('enterOcean', mwId, pId);
});

socket.on('yours', function (ocean) {
    console.log(ocean);
});
