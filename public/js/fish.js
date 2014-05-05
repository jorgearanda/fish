'use strict';
/* global io:true */

var lang = $.url().param('lang');
var msgs;
var socket = io.connect();
var mwId = $.url().param('mwid');
var pId = $.url().param('pid');
var ocean;

if (lang && lang !== '' && lang.toLowerCase() in langs) {
    lang = lang.toLowerCase();
    msgs = langs[lang];
} else {
    msgs = langs.en;
    lang = 'en';
}

function loadLabels() {
    $('#read-rules').text(msgs.buttons_goFishing);
}

function updateRulesText() {
    console.log('trying to update text');
    var prepText = ocean.microworld.params.preparationText.replace(/\n/g, '<br />');

    $('#rules-text').html(prepText);
}

function displayRules() {
    updateRulesText();
    $('#rules-modal').modal('show');
}

function setupOcean() {
    displayRules();
}

socket.on('connect', function () {
    console.log('Socket connected. Requesting to enter an ocean.');
    socket.emit('enterOcean', mwId, pId);
});

socket.on('ocean', function (o) {
    console.log('Entered an ocean. Setting up.');
    ocean = o;
    setupOcean();
});

socket.on('yours', function (ocean) {
    console.log(ocean);
});

function main() {
    loadLabels();
}

$(document).ready(main);
