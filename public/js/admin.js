'use strict';
/*global document:true, location:true, $:true, alert:true*/

var successfulLogin = function (user) {
   location.href = '/a/' + user._id + '/dashboard';
};

var badLogin = function (jqXHR) {
   console.log(jqXHR.responseText);
   var errors = JSON.parse(jqXHR.responseText).errors;
   alert(errors);
};

var attemptLogin = function () {
   var credentials = {
      username: $('#username').val(),
      password: $('#password').val()
   };

   $.ajax({
      type: 'POST',
      url: '/sessions',
      data: credentials,
      error: badLogin,
      success: successfulLogin
   });
};

var overrideSubmit = function () {
   return false;
};

var main = function() {
   $('form').submit(overrideSubmit);
   $('#login').click(attemptLogin);
};

$(document).ready(main);
