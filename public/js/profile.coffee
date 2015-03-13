
#global alert:true
submitUpdate = ->
  name = $("#name").val()
  email = $("#email").val()
  password = $("#password").val()
  confirmPass = $("#confirmPass").val()
  sendData = {}
  sendData.name = name  if name.length >= 1
  sendData.email = email  if email.length >= 1
  sendData.rawPassword = password  if password.length >= 1
  sendData.confirmPass = confirmPass  if confirmPass.length >= 1
  expId = location.pathname.split("/")[2]
  $.ajax
    type: "PUT"
    url: "/experimenters/" + expId
    data: sendData
    success: ->
      location.replace "./dashboard"
      return

    error: (jqXHR) ->
      if jqXHR.status is 409
        if jqXHR.responseText is "password conflict"
          alert "The passwords given did not match"
        else
          alert "Invalid email"
      else if jqXHR.status is 403
        alert "At least one field needs to be filled"
      else if jqXHR.status is 401
        alert "You are unauthorized to change this profile"
      else if jqXHR.status is 400
        alert "Did not match any experimenters"
      else # status 500
        alert "Internal error"
      return

  return
setButtons = ->
  $("#do-update").click submitUpdate
  return
main = ->
  setButtons()
  return
"use strict"
$(document).ready main
