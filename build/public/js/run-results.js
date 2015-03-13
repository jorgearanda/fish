var getRunId, getRunResults, gotRunResults, main, noRunResults, runId, transposeResults;

getRunId = function() {
  var runId;
  runId = $.url().segment(4);
};

noRunResults = function(jqXHR) {
  alert(jqXHR.responseText);
};

transposeResults = function(res) {
  var fishEnd, fishStart, ge, gr, i, j, season, t;
  t = [];
  season = void 0;
  gr = void 0;
  ge = void 0;
  fishStart = void 0;
  fishEnd = void 0;
  for (i in res) {
    season = res[i].season;
    gr = (res[i].groupRestraint !== undefined ? res[i].groupRestraint.toFixed(3) : "n/a");
    ge = (res[i].groupEfficiency !== undefined ? res[i].groupEfficiency.toFixed(3) : "n/a");
    fishStart = res[i].fishStart;
    fishEnd = res[i].fishEnd;
    for (j in res[i].fishers) {
      t.push({
        name: res[i].fishers[j].name,
        type: res[i].fishers[j].type,
        greed: (res[i].fishers[j].type === "bot" && res[i].fishers[j].greed !== undefined ? res[i].fishers[j].greed.toFixed(3) : "n/a"),
        season: season,
        fishStart: fishStart,
        fishEnd: fishEnd,
        fishTaken: res[i].fishers[j].fishTaken,
        profit: (res[i].fishers[j].profit !== undefined ? res[i].fishers[j].profit.toFixed(2) : "n/a"),
        ir: (res[i].fishers[j].individualRestraint !== undefined ? res[i].fishers[j].individualRestraint.toFixed(3) : "n/a"),
        gr: gr,
        ie: (res[i].fishers[j].individualEfficiency !== undefined ? res[i].fishers[j].individualEfficiency.toFixed(3) : "n/a"),
        ge: ge
      });
    }
  }
  return t;
};

gotRunResults = function(r) {
  var i, table, transposed;
  $("#time").text("Time: " + moment(r.time).format("llll"));
  $("#participants").text("Participant IDs: " + r.participants);
  transposed = transposeResults(r.results);
  table = "";
  for (i in transposed) {
    table += "<tr><td>" + transposed[i].name + "</td><td>" + transposed[i].type + "</td><td>" + transposed[i].greed + "</td><td>" + transposed[i].season + "</td><td>" + transposed[i].fishStart + "</td><td>" + transposed[i].fishEnd + "</td><td>" + transposed[i].fishTaken + "</td><td>" + transposed[i].profit + "</td><td>" + transposed[i].ir + "</td><td>" + transposed[i].gr + "</td><td>" + transposed[i].ie + "</td><td>" + transposed[i].ge + "</td></tr>";
  }
  $("#run-results-table-rows").html(table);
  table = "";
  for (i in r.log) {
    table += "<tr><td>" + r.log[i] + "</td></tr>";
  }
  $("#log-table-rows").html(table);
};

getRunResults = function() {
  $.ajax({
    type: "GET",
    url: "/runs/" + runId,
    error: noRunResults,
    success: gotRunResults
  });
};

main = function() {
  getRunId();
  getRunResults();
};

"use strict";

runId = void 0;

$(document).ready(main);
