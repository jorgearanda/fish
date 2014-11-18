'use strict';

var runId;

function getRunId() {
    runId = $.url().segment(4);
}

function noRunResults(jqXHR) {
    alert(jqXHR.responseText);
}

function gotRunResults(r) {
    console.log(r);
    var table = '';
    for (var i in r.results) {
        table += '<tr><td>' + r.results[i].season+ '</td></tr>'
    }

    $('#run-results-table-rows').html(table);

    table = '';
    for (var i in r.log) {
        table += '<tr><td>' + r.log[i] + '</td></tr>'
    }

    $('#log-table-rows').html(table);
}

function getRunResults() {
    $.ajax({
        type: 'GET',
        url: '/runs/' + runId,
        error: noRunResults,
        success: gotRunResults
    });
}

function main() {
    getRunId();
    getRunResults();
}

$(document).ready(main);