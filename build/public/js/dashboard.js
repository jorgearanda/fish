"use strict";
var currentRunningSimulations, df, displaySimulationStatus, expId, getMicroworlds, lastMwRes, main, microworldsError, microworldsSuccess, newSimulation, overrideSubmit, simulationDone, simulationInterrupt, socketAdmin;

df = "YYYY-MM-DD";

lastMwRes = null;

socketAdmin = io.connect("/admin");

expId = window.location.pathname.split("/")[2];

microworldsSuccess = function(mws) {
  var activeTable, anyActive, anyArchived, anyTest, archivedTable, i, testTable;
  if (_.isEqual(lastMwRes, mws)) {
    return;
  }
  lastMwRes = mws;
  anyTest = false;
  anyActive = false;
  anyArchived = false;
  testTable = "";
  activeTable = "";
  archivedTable = "";
  for (i in mws) {
    if (mws[i].status === "test") {
      anyTest = true;
      testTable += "<tr onclick=\"location.href='./microworlds/" + mws[i]._id + "'\"><td>" + mws[i].name + "</td>" + "<td>" + mws[i].code + "</td>" + "<td>" + mws[i].desc + "</td></tr>";
    }
    if (mws[i].status === "active") {
      anyActive = true;
      activeTable += "<tr onclick=\"location.href='./microworlds/" + mws[i]._id + "'\"><td>" + mws[i].name + "</td>" + "<td>" + mws[i].code + "</td>" + "<td>" + mws[i].desc + "</td>" + "<td>" + moment(mws[i].dateActive).format(df) + "</td>" + "<td>" + mws[i].numCompleted + "</td>" + "<td>" + mws[i].numAborted + "</td></tr>";
    }
    if (mws[i].status === "archived") {
      anyArchived = true;
      archivedTable += "<tr onclick=\"location.href='./microworlds/" + mws[i]._id + "'\"><td>" + mws[i].name + "</td>" + "<td>" + mws[i].code + "</td>" + "<td>" + mws[i].desc + "</td>" + "<td>" + moment(mws[i].dateActive).format(df) + "</td>" + "<td>" + mws[i].numCompleted + "</td>" + "<td>" + mws[i].numAborted + "</td></tr>";
    }
  }
  $("#microworlds-test-loading").addClass("collapse");
  if (anyTest) {
    $("#microworlds-test-none").addClass("collapse");
    $("#microworlds-test-table-rows").html(testTable);
    $("#microworlds-test-table").removeClass("collapse");
  } else {
    $("#microworlds-test-none").removeClass("collapse");
    $("#microworlds-test-table").addClass("collapse");
  }
  $("#microworlds-active-loading").addClass("collapse");
  if (anyActive) {
    $("#microworlds-active-none").addClass("collapse");
    $("#microworlds-active-table-rows").html(activeTable);
    $("#microworlds-active-table").removeClass("collapse");
  } else {
    $("#microworlds-active-none").removeClass("collapse");
    $("#microworlds-active-table").addClass("collapse");
  }
  $("#microworlds-archived-loading").addClass("collapse");
  if (anyArchived) {
    $("#microworlds-archived-none").addClass("collapse");
    $("#microworlds-archived-table-rows").html(archivedTable);
    $("#microworlds-archived-table").removeClass("collapse");
  } else {
    $("#microworlds-archived-none").removeClass("collapse");
    $("#microworlds-archived-table").addClass("collapse");
  }
};

microworldsError = function(jqXHR) {
  var errors;
  errors = JSON.parse(jqXHR.responseText).errors;
  alert(errors);
};

getMicroworlds = function() {
  $.ajax({
    type: "GET",
    url: "/microworlds",
    error: microworldsError,
    success: microworldsSuccess
  });
  setTimeout(getMicroworlds, 60000);
};

overrideSubmit = function() {
  return false;
};

displaySimulationStatus = function(simulation, eventStatus) {
  var html, i, rowBootstrapClass;
  rowBootstrapClass = void 0;
  if (eventStatus === "Currently running") {
    rowBootstrapClass = "";
  } else if (eventStatus === "Finished run") {
    rowBootstrapClass = "info";
  } else {
    rowBootstrapClass = "warning";
  }
  html = "<tr class =" + rowBootstrapClass + "><td>" + simulation.code + "</td>" + "<td>" + simulation.time + "<td>";
  i = 0;
  while (i < simulation.participants.length) {
    if (i !== 0) {
      html += ", ";
      if (i === simulation.participants.length - 1) {
        html += "and ";
      }
    }
    html += simulation.participants[i];
    i++;
  }
  html += "</td><td>" + eventStatus + "</td></tr>";
  $("#tracked-simulations-row").prepend(html);
  $("tr").delay(300).animate({
    opacity: 1
  }, 500);
};

currentRunningSimulations = function(simulations) {
  var oceanId;
  for (oceanId in simulations) {
    if (simulations[oceanId].expId === expId) {
      displaySimulationStatus(simulations[oceanId], "Currently running");
    }
  }
};

newSimulation = function(simulation) {
  displaySimulationStatus(simulation, "Currently running");
};

simulationDone = function(simulation) {
  displaySimulationStatus(simulation, "Finished run");
};

simulationInterrupt = function(simulation) {
  displaySimulationStatus(simulation, "Participant abandoned simulation run");
};

socketAdmin.on("connect", function() {
  socketAdmin.emit("enterDashboard", expId);
});

socketAdmin.on("currentRunningSimulations", currentRunningSimulations);

socketAdmin.on("newSimulation", newSimulation);

socketAdmin.on("simulationDone", simulationDone);

socketAdmin.on("simulationInterrupt", simulationInterrupt);

main = function() {
  $("form").submit(overrideSubmit);
  getMicroworlds();
};

$(document).ready(main);
