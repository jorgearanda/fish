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
    $('.form-signin-heading').text(msgs.login_welcome);
    $('#code').prop('placeholder', msgs.login_simulationName + ' ');
    $('#pid').prop('placeholder', msgs.login_participantId + ' ');
    $('#login').text(msgs.login_getStarted);
}

function successfulLogin(mw) {
    location.href = '/fish?lang=' + lang +
        '&mwid=' + mw._id + 
        '&pid=' + $('#pid').val();
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
        url: '/participant-sessions',
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