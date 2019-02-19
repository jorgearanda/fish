'use strict';
/*global document:true, location:true, $:true, alert:true*/

var successfulLogin = function(user) {
  location.href = '/s/' + user._id + '/dashboard';
};

var badLogin = function(jqXHR) {
  var errors = JSON.parse(jqXHR.responseText).errors;
  alert(errors);
};

var attemptLogin = function() {
  var credentials = {
    username: $('#username').val(),
    password: $('#password').val(),
  };

  $.ajax({
    type: 'POST',
    url: '/superuser-sessions',
    data: credentials,
    error: badLogin,
    success: successfulLogin,
  });
};

var overrideSubmit = function() {
  return false;
};

var main = function() {
  $('form').submit(overrideSubmit);
  $('#login').click(attemptLogin);
};

$(document).ready(main);
