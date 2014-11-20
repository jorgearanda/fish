'use strict';

var runId;

function getRunId() {
    runId = $.url().segment(4);
}

function noRunResults(jqXHR) {
    alert(jqXHR.responseText);
}

function transposeResults(res) {
    var t = [];
    var season, gr, ge, fishStart, fishEnd;
    for (var i in res) {
        season = res[i].season;
        gr = res[i].groupRestraint ?
            res[i].groupRestraint.toFixed(3) : 'n/a';
        ge = res[i].groupEfficiency ?
            res[i].groupEfficiency.toFixed(3) : 'n/a';
        fishStart = res[i].fishStart;
        fishEnd = res[i].fishEnd;
        for (var j in res[i].fishers) {
            t.push({
                name: res[i].fishers[j].name,
                type: res[i].fishers[j].type,
                greed: res[i].fishers[j].type === 'bot' && res[i].fishers[j].greed ?
                    res[i].fishers[j].greed.toFixed(3) : 'n/a',
                season: season,
                fishStart: fishStart,
                fishEnd: fishEnd,
                fishTaken: res[i].fishers[j].fishTaken,
                profit: res[i].fishers[j].profit ?
                    res[i].fishers[j].profit.toFixed(2) : 'n/a',
                ir: res[i].fishers[j].individualRestraint ?
                    res[i].fishers[j].individualRestraint.toFixed(3) : 'n/a',
                gr: gr,
                ie: res[i].fishers[j].individualEfficiency ?
                    res[i].fishers[j].individualEfficiency.toFixed(3) : 'n/a',
                ge: ge
            });
        }
    }

    return t;
}

function gotRunResults(r) {
    $('#time').text('Time: ' + moment(r.time).format('llll'));
    $('#participants').text('Participant IDs: ' + r.participants);

    var transposed = transposeResults(r.results);
    var table = '';
    for (var i in transposed) {
        table += '<tr><td>' + transposed[i].name + '</td><td>' +
            transposed[i].type + '</td><td>' +
            transposed[i].greed + '</td><td>' +
            transposed[i].season + '</td><td>' +
            transposed[i].fishStart + '</td><td>' +
            transposed[i].fishEnd + '</td><td>' +
            transposed[i].fishTaken + '</td><td>' +
            transposed[i].profit + '</td><td>' +
            transposed[i].ir + '</td><td>' +
            transposed[i].gr + '</td><td>' +
            transposed[i].ie + '</td><td>' +
            transposed[i].ge + '</td></tr>';
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