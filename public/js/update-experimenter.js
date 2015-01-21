'use strict';

function submitUpdate() {
    var name = $('#name').val();
    var username = $('#username').val();
    var email = $('#email').val();
    var password = $('#password').val();

    if(name.length < 1 && username.length < 1 && email.length < 1 && password.length < 1) {
        alert('At least one field needs to be filled');
        return;
    }

    var sendData = {};
    if(name.length >= 1) sendData.name = name;
    if(username.length >= 1) sendData.username = username;
    if(email.length >= 1) sendData.email = email;
    if(password.length >= 1) sendData.rawPassword = password;

    var expId = location.pathname.split('/')[2];
    $.ajax({
        type: 'PUT',
        url: '/experimenters/' + expId,
        data: sendData,
        success: function() {
            location.replace('./dashboard');
        },
        error: function() {}
    });
}

function setButtons() {
    $('#do-update').click(submitUpdate);
}

function main() {
    setButtons();
}

$(document).ready(main);
