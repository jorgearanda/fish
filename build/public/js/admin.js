"use strict";
var attemptLogin, badLogin, main, overrideSubmit, successfulLogin;

successfulLogin = function(user) {
  location.href = "/a/" + user._id + "/dashboard";
};

badLogin = function(jqXHR) {
  var errors;
  errors = JSON.parse(jqXHR.responseText).errors;
  alert(errors);
};

attemptLogin = function() {
  var credentials;
  credentials = {
    username: $("#username").val(),
    password: $("#password").val()
  };
  $.ajax({
    type: "POST",
    url: "/sessions",
    data: credentials,
    error: badLogin,
    success: successfulLogin
  });
};

overrideSubmit = function() {
  return false;
};

main = function() {
  $("form").submit(overrideSubmit);
  $("#login").click(attemptLogin);
};

$(document).ready(main);
