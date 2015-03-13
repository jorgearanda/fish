"use strict"

#global document:true, location:true, $:true, alert:true, moment:true, io:true
df = "YYYY-MM-DD"
lastMwRes = null
socketAdmin = io.connect("/admin")
expId = window.location.pathname.split("/")[2]
microworldsSuccess = (mws) ->
  return  if _.isEqual(lastMwRes, mws)
  lastMwRes = mws
  anyTest = false
  anyActive = false
  anyArchived = false
  testTable = ""
  activeTable = ""
  archivedTable = ""
  for i of mws
    if mws[i].status is "test"
      anyTest = true
      testTable += "<tr onclick=\"location.href='./microworlds/" + mws[i]._id + "'\"><td>" + mws[i].name + "</td>" + "<td>" + mws[i].code + "</td>" + "<td>" + mws[i].desc + "</td></tr>"
    if mws[i].status is "active"
      anyActive = true
      activeTable += "<tr onclick=\"location.href='./microworlds/" + mws[i]._id + "'\"><td>" + mws[i].name + "</td>" + "<td>" + mws[i].code + "</td>" + "<td>" + mws[i].desc + "</td>" + "<td>" + moment(mws[i].dateActive).format(df) + "</td>" + "<td>" + mws[i].numCompleted + "</td>" + "<td>" + mws[i].numAborted + "</td></tr>"
    if mws[i].status is "archived"
      anyArchived = true
      archivedTable += "<tr onclick=\"location.href='./microworlds/" + mws[i]._id + "'\"><td>" + mws[i].name + "</td>" + "<td>" + mws[i].code + "</td>" + "<td>" + mws[i].desc + "</td>" + "<td>" + moment(mws[i].dateActive).format(df) + "</td>" + "<td>" + mws[i].numCompleted + "</td>" + "<td>" + mws[i].numAborted + "</td></tr>"
  $("#microworlds-test-loading").addClass "collapse"
  if anyTest
    $("#microworlds-test-none").addClass "collapse"
    $("#microworlds-test-table-rows").html testTable
    $("#microworlds-test-table").removeClass "collapse"
  else
    $("#microworlds-test-none").removeClass "collapse"
    $("#microworlds-test-table").addClass "collapse"
  $("#microworlds-active-loading").addClass "collapse"
  if anyActive
    $("#microworlds-active-none").addClass "collapse"
    $("#microworlds-active-table-rows").html activeTable
    $("#microworlds-active-table").removeClass "collapse"
  else
    $("#microworlds-active-none").removeClass "collapse"
    $("#microworlds-active-table").addClass "collapse"
  $("#microworlds-archived-loading").addClass "collapse"
  if anyArchived
    $("#microworlds-archived-none").addClass "collapse"
    $("#microworlds-archived-table-rows").html archivedTable
    $("#microworlds-archived-table").removeClass "collapse"
  else
    $("#microworlds-archived-none").removeClass "collapse"
    $("#microworlds-archived-table").addClass "collapse"
  return

microworldsError = (jqXHR) ->
  errors = JSON.parse(jqXHR.responseText).errors
  alert errors
  return

getMicroworlds = ->
  $.ajax
    type: "GET"
    url: "/microworlds"
    error: microworldsError
    success: microworldsSuccess

  setTimeout getMicroworlds, 60000
  return

overrideSubmit = ->
  false

displaySimulationStatus = (simulation, eventStatus) ->
  rowBootstrapClass = undefined
  if eventStatus is "Currently running"
    rowBootstrapClass = ""
  else if eventStatus is "Finished run"
    rowBootstrapClass = "info"
  else
    
    # must be an interruption
    rowBootstrapClass = "warning"
  html = "<tr class =" + rowBootstrapClass + "><td>" + simulation.code + "</td>" + "<td>" + simulation.time + "<td>"
  i = 0

  while i < simulation.participants.length
    unless i is 0
      html += ", "
      html += "and "  if i is simulation.participants.length - 1
    html += simulation.participants[i]
    i++
  html += "</td><td>" + eventStatus + "</td></tr>"
  $("#tracked-simulations-row").prepend html
  $("tr").delay(300).animate
    opacity: 1
  , 500
  return

currentRunningSimulations = (simulations) ->
  for oceanId of simulations
    displaySimulationStatus simulations[oceanId], "Currently running"  if simulations[oceanId].expId is expId
  return

newSimulation = (simulation) ->
  displaySimulationStatus simulation, "Currently running"
  return

simulationDone = (simulation) ->
  displaySimulationStatus simulation, "Finished run"
  return

simulationInterrupt = (simulation) ->
  displaySimulationStatus simulation, "Participant abandoned simulation run"
  return

socketAdmin.on "connect", ->
  socketAdmin.emit "enterDashboard", expId
  return

socketAdmin.on "currentRunningSimulations", currentRunningSimulations
socketAdmin.on "newSimulation", newSimulation
socketAdmin.on "simulationDone", simulationDone
socketAdmin.on "simulationInterrupt", simulationInterrupt
main = ->
  $("form").submit overrideSubmit
  getMicroworlds()
  return

$(document).ready main
