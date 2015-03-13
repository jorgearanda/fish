"use strict"

#global document:true, location:true, $:true, alert:true
successfulLogin = (user) ->
  location.href = "/a/" + user._id + "/dashboard"
  return

badLogin = (jqXHR) ->
  errors = JSON.parse(jqXHR.responseText).errors
  alert errors
  return

attemptLogin = ->
  credentials =
    username: $("#username").val()
    password: $("#password").val()

  $.ajax
    type: "POST"
    url: "/sessions"
    data: credentials
    error: badLogin
    success: successfulLogin

  return

overrideSubmit = ->
  false

main = ->
  $("form").submit overrideSubmit
  $("#login").click attemptLogin
  return

$(document).ready main
