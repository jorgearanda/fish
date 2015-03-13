var attemptLogin, badLogin, lang, loadLabels, main, msgs, overrideSubmit, successfulLogin;

loadLabels = function() {
  document.title = msgs.login_title;
  $(".form-signin-heading").text(msgs.login_welcome);
  $("#code").prop("placeholder", msgs.login_simulationName + " ");
  $("#pid").prop("placeholder", msgs.login_participantId + " ");
  $("#login").text(msgs.login_getStarted);
};

successfulLogin = function(mw) {
  location.href = "/fish?lang=" + lang + "&mwid=" + mw._id + "&pid=" + $("#pid").val();
};

badLogin = function(jqXHR) {
  var errors;
  errors = JSON.parse(jqXHR.responseText).errors;
  alert(errors);
};

attemptLogin = function() {
  var credentials;
  credentials = {
    code: $("#code").val(),
    pid: $("#pid").val()
  };
  $.ajax({
    type: "POST",
    url: "/participant-sessions",
    data: credentials,
    error: badLogin,
    success: successfulLogin
  });
};

overrideSubmit = function() {
  return false;
};

main = function() {
  loadLabels();
  $("form").submit(overrideSubmit);
  $("#login").click(attemptLogin);
};

"use strict";

lang = $.url().param("lang");

msgs = void 0;

if (lang && lang !== "" && lang.toLowerCase() in langs) {
  lang = lang.toLowerCase();
  msgs = langs[lang];
} else {
  msgs = langs.en;
  lang = "en";
}

$(document).ready(main);
