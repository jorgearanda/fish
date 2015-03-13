
# global document:true, $:true, langs:true 
loadLabels = ->
  document.title = msgs.login_title
  $(".form-signin-heading").text msgs.login_welcome
  $("#code").prop "placeholder", msgs.login_simulationName + " "
  $("#pid").prop "placeholder", msgs.login_participantId + " "
  $("#login").text msgs.login_getStarted
  return
successfulLogin = (mw) ->
  location.href = "/fish?lang=" + lang + "&mwid=" + mw._id + "&pid=" + $("#pid").val()
  return
badLogin = (jqXHR) ->
  errors = JSON.parse(jqXHR.responseText).errors
  alert errors
  return
attemptLogin = ->
  credentials =
    code: $("#code").val()
    pid: $("#pid").val()

  $.ajax
    type: "POST"
    url: "/participant-sessions"
    data: credentials
    error: badLogin
    success: successfulLogin

  return
overrideSubmit = ->
  false
main = ->
  loadLabels()
  $("form").submit overrideSubmit
  $("#login").click attemptLogin
  return
"use strict"
lang = $.url().param("lang")
msgs = undefined
if lang and lang isnt "" and lang.toLowerCase() of langs
  lang = lang.toLowerCase()
  msgs = langs[lang]
else
  msgs = langs.en
  lang = "en"
$(document).ready main
