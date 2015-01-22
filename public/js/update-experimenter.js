'use strict';

function submitUpdate() {
    var name = $('#name').val();
    var username = $('#username').val();
    var email = $('#email').val();
    var password = $('#password').val();

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
        error: function() {
            alert("An error occurred while trying to update your profile.\nPossible causes are invalid email or no fields are filled");
        }
    });
}

function setButtons() {
    $('#do-update').click(submitUpdate);
}

function main() {
    setButtons();
}

$(document).ready(main);
