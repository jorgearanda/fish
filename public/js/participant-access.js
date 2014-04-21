'use strict';
/* global document:true, $:true, langs:true */

var lang = $.url().param('lang');
var msgs;

if (lang && lang !== '' && lang.toLowerCase() in langs) {
    lang = lang.toLowerCase();
    msgs = langs[lang];
} else {
    msgs = langs.en;
    lang = 'en';
}

function loadLabels() {
    document.title = msgs.login_title;
    $('h3').text(msgs.login_welcome);
    $('#code').prop('placeholder', msgs.login_simulationName + ' ');
    $('#pid').prop('placeholder', msgs.login_participantId + ' ');
    $('#login').text(msgs.login_getStarted);
}

function main() {
    loadLabels();
}

$(document).ready(main);