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
    var prepText = ocean.preparationText.replace(/\n/g, '<br />');
    $('#rules-text').html(prepText);
}

function displayRules() {
    updateRulesText();
    $('#rules-modal').modal('show');
}

function updateCosts() {
    if (ocean.fishValue !== 0) {
        $('#revenue-fish').text(msgs.costs_fishValue + ' ' +
            ocean.currencySymbol + ocean.fishValue).show();
    } else {
        $('#revenue-fish').hide();
    }

    if (ocean.costDeparture !== 0) {
        $('#cost-departure').text(msgs.costs_costLeave + ' ' +
            ocean.currencySymbol + ocean.costDeparture);
    } else {
        $('#cost-departure').hide();
    }

    if (ocean.costCast !== 0) {
        $('#cost-cast').text(msgs.costs_costCast + ' ' +
            ocean.currencySymbol + ocean.costCast);
    } else {
        $('#cost-cast').hide();
    }

    if (ocean.costSecond !== 0) {
        $('#cost-second').text(msgs.costs_costSecond + ' ' +
            ocean.currencySymbol + ocean.costSecond);
    } else {
        $('#cost-second').hide();
    }
}

function updateFisherNames() {
}

function setVisibleFisherFields() {
}

function setupOcean(o) {
    console.log('Entered an ocean. Setting up.');
    ocean = o;
    displayRules();
    updateCosts();
}

function readRules() {
    socket.emit('readRules');
}

function beginSeason() {
}

function warnSeasonEnd() {
}

function endSeason() {
}

function endRun() {
}

function pause() {
}

function resume() {
}

socket.on('connect', function () {
    console.log('Socket connected. Requesting to enter an ocean.');
    socket.emit('enterOcean', mwId, pId);
});

socket.on('ocean', setupOcean);
socket.on('begin season', beginSeason);
socket.on('warn season end', warnSeasonEnd);
socket.on('end season', endSeason);
socket.on('end run', endRun);
socket.on('pause', pause);
socket.on('resume', resume);

socket.on('yours', function (ocean) {
    console.log(ocean);
});

function main() {
    $('#read-rules').on('click', readRules);
    loadLabels();
}

$(document).ready(main);
