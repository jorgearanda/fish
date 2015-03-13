getRunId = ->
  runId = $.url().segment(4)
  return
noRunResults = (jqXHR) ->
  alert jqXHR.responseText
  return
transposeResults = (res) ->
  t = []
  season = undefined
  gr = undefined
  ge = undefined
  fishStart = undefined
  fishEnd = undefined
  for i of res
    season = res[i].season
    gr = (if res[i].groupRestraint isnt `undefined` then res[i].groupRestraint.toFixed(3) else "n/a")
    ge = (if res[i].groupEfficiency isnt `undefined` then res[i].groupEfficiency.toFixed(3) else "n/a")
    fishStart = res[i].fishStart
    fishEnd = res[i].fishEnd
    for j of res[i].fishers
      t.push
        name: res[i].fishers[j].name
        type: res[i].fishers[j].type
        greed: (if res[i].fishers[j].type is "bot" and res[i].fishers[j].greed isnt `undefined` then res[i].fishers[j].greed.toFixed(3) else "n/a")
        season: season
        fishStart: fishStart
        fishEnd: fishEnd
        fishTaken: res[i].fishers[j].fishTaken
        profit: (if res[i].fishers[j].profit isnt `undefined` then res[i].fishers[j].profit.toFixed(2) else "n/a")
        ir: (if res[i].fishers[j].individualRestraint isnt `undefined` then res[i].fishers[j].individualRestraint.toFixed(3) else "n/a")
        gr: gr
        ie: (if res[i].fishers[j].individualEfficiency isnt `undefined` then res[i].fishers[j].individualEfficiency.toFixed(3) else "n/a")
        ge: ge

  t
gotRunResults = (r) ->
  $("#time").text "Time: " + moment(r.time).format("llll")
  $("#participants").text "Participant IDs: " + r.participants
  transposed = transposeResults(r.results)
  table = ""
  for i of transposed
    table += "<tr><td>" + transposed[i].name + "</td><td>" + transposed[i].type + "</td><td>" + transposed[i].greed + "</td><td>" + transposed[i].season + "</td><td>" + transposed[i].fishStart + "</td><td>" + transposed[i].fishEnd + "</td><td>" + transposed[i].fishTaken + "</td><td>" + transposed[i].profit + "</td><td>" + transposed[i].ir + "</td><td>" + transposed[i].gr + "</td><td>" + transposed[i].ie + "</td><td>" + transposed[i].ge + "</td></tr>"
  $("#run-results-table-rows").html table
  table = ""
  for i of r.log
    table += "<tr><td>" + r.log[i] + "</td></tr>"
  $("#log-table-rows").html table
  return
getRunResults = ->
  $.ajax
    type: "GET"
    url: "/runs/" + runId
    error: noRunResults
    success: gotRunResults

  return
main = ->
  getRunId()
  getRunResults()
  return
"use strict"
runId = undefined
$(document).ready main
