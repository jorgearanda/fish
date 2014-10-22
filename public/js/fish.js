'use strict';
/* global io:true */

var lang = $.url().param('lang');
var msgs;
var socket = io.connect();
var mwId = $.url().param('mwid');
var pId = $.url().param('pid');
var ocean;
var st = {status: 'loading'};

if (lang && lang !== '' && lang.toLowerCase() in langs) {
    lang = lang.toLowerCase();
    msgs = langs[lang];
} else {
    msgs = langs.en;
    lang = 'en';
}

function loadLabels() {
    $('#read-rules').text(msgs.buttons_goFishing);
    $('#to-sea').text(msgs.buttons_goToSea);
    $('#return').text(msgs.buttons_return);
    $('#attempt-fish').text(msgs.buttons_castFish);
    updateStatus();
}

function updateRulesText() {
    var prepText = ocean.preparationText.replace(/\n/g, '<br />');
    $('#rules-text').html(prepText);
}

function displayRules() {
    updateRulesText();
    $('#rules-modal').modal('show');
}

function updateStatus() {
    var statusText = '';
    if (st.status === 'loading') {
        statusText = msgs.status_wait;
    } else if (st.status === 'running') {
        statusText = msgs.status_season + st.season + '. ';

        if (st.mysteryFish > 0) {
            statusText += msgs.status_fishBetween + st.certainFish +
                msgs.status_fishAnd + (st.certainFish + st.mysteryFish) +
                msgs.status_fishRemaining;
        } else {
            statusText += msgs.status_fishMax + st.certainFish +
                msgs.status_fishRemaining;
        }
    } else if (st.status === 'resting') {
        statusText = msgs.status_spawning;
    } else if (st.status === 'paused') {
        statusText = msgs.status_paused;
    } else {
        console.log('Unknown status: ' + st.status);
    }

    $('#status-label').text(statusText);
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

function goToSea() {
    socket.emit('goToSea');
}

function goToPort() {
    socket.emit('return');
}

function attemptToFish() {
    socket.emit('attemptToFish');
}

function warnInitialDelay() {
    console.log('Get ready to start');
}

function warnSeasonBeginning() {
}

function beginSeason(data) {
    console.log('Beginning season ' + data.season);
    console.log('Certain fish ' + data.certainFish);
    console.log('Mystery fish ' + data.mysteryFish);
}

function warnSeasonEnd() {
}

function receiveStatus(data) {
    console.log('Status: ' + JSON.stringify(data));
    st = data;
    updateStatus();
}

function endSeason(data) {
    console.log('Ending season ' + data.season);
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
socket.on('initial delay', warnInitialDelay);
socket.on('begin season', beginSeason);
socket.on('status', receiveStatus);
socket.on('warn season end', warnSeasonEnd);
socket.on('end season', endSeason);
socket.on('end run', endRun);
socket.on('pause', pause);
socket.on('resume', resume);

function main() {
    $('#read-rules').on('click', readRules);
    $('#to-sea').on('click', goToSea);
    $('#return').on('click', goToPort);
    $('#attempt-fish').on('click', attemptToFish);
    loadLabels();
}

$(document).ready(main);
