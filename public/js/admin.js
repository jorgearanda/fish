'use strict';
/*global document:true, location:true, io:true, console:true, $:true */

var socket = io.connect();

socket.on('connect', function () {
   console.log('Connected to server.');
});

socket.on('user-valid', function() {
   location.href = 'mainadmin.html?uid=' + $('#uid').val();
});

socket.on('user-not-valid', function() {
   $('#login').prop('disabled', false);
   $('.status-message')
      .toggleClass('red')
      .text('User invalid. Please try again.');
});

var ValidateUser = function () {
   var uid = $('#uid').val();
   $('#login').prop('disabled', true);
   $('.status-message').text('');
   socket.emit('validate user', uid);
};

var Main = function() {
   $('#login').click(ValidateUser);
};

$(document).ready(Main);
