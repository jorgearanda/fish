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

function successfulLogin(run) {
    // TODO - determine if we add the pid here or if it's embedded in the
    // run document
    location.href = '/runs/' + run._id + '?lang=' + lang;
}

function badLogin (jqXHR) {
    var errors = JSON.parse(jqXHR.responseText).errors;
    alert(errors);
}

function attemptLogin() {
    var credentials = {
        code: $('#code').val(),
        pid: $('#pid').val()
    };

    $.ajax({
        type: 'POST',
        url: '/runs',
        data: credentials,
        error: badLogin,
        success: successfulLogin
    });
}

function overrideSubmit() {
    return false;
}

function main() {
    loadLabels();
    $('form').submit(overrideSubmit);
    $('#login').click(attemptLogin);
}

$(document).ready(main);