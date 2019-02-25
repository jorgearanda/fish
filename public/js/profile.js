'use strict';
/*global alert:true, $:true*/

function submitUpdate() {
  var name = $('#name').val();
  var email = $('#email').val();
  var password = $('#password').val();
  var confirmPass = $('#confirmPass').val();

  var sendData = {};
  if (name.length >= 1) sendData.name = name;
  if (email.length >= 1) sendData.email = email;
  if (password.length >= 1) sendData.rawPassword = password;
  if (confirmPass.length >= 1) sendData.confirmPass = confirmPass;

  if (!valid(sendData)) return;

  var expId = location.pathname.split('/')[2];
  $.ajax({
    type: 'PUT',
    url: '/experimenters/' + expId,
    data: sendData,
    success: function() {
      location.replace('./dashboard');
    },
  });
}

function valid(data) {
  if (Object.keys(data).length === 0) {
    alert('At least one field needs to be filled');
    return false;
  }

  if ('rawPassword' in data && data.rawPassword !== data.confirmPass) {
    alert('The passwords given do not match');
    return false;
  }

  return true;
}

function setButtons() {
  $('#do-update').click(submitUpdate);
}

function main() {
  setButtons();
}

$(document).ready(main);
