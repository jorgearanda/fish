'use strict';
/*global document:true, location:true, $:true, alert:true, moment:true, io:true*/

var df = 'YYYY-MM-DD';
var lastMwRes = null;
var socketAdmin = io.connect('/admin');
var expId = window.location.pathname.split('/')[2];

var microworldsSuccess = function (mws) {
    if (_.isEqual(lastMwRes, mws)) return;

    lastMwRes = mws;

    var anyTest = false;
    var anyActive = false;
    var anyArchived = false;
    var testTable = '';
    var activeTable = '';
    var archivedTable = '';

    for (var i in mws) {
        if (mws[i].status === 'test') {
            anyTest = true;
            testTable += '<tr onclick="location.href=\'./microworlds/' + 
                mws[i]._id + '\'"><td>' + mws[i].name + '</td>' +
                '<td>' + mws[i].code + '</td>' +
                '<td>' + mws[i].desc + '</td></tr>';
        }

        if (mws[i].status === 'active') {
            anyActive = true;
            activeTable += '<tr onclick="location.href=\'./microworlds/' + 
                mws[i]._id + '\'"><td>' + mws[i].name + '</td>' + 
                '<td>' + mws[i].code + '</td>' +
                '<td>' + mws[i].desc + '</td>' +
                '<td>' + moment(mws[i].dateActive).format(df) + '</td>' + 
                '<td>' + mws[i].numCompleted + '</td>' + 
                '<td>' + mws[i].numAborted + '</td></tr>';
        }

        if (mws[i].status === 'archived') {
            anyArchived = true;
            archivedTable += '<tr onclick="location.href=\'./microworlds/' + 
                mws[i]._id + '\'"><td>' + mws[i].name + '</td>' + 
                '<td>' + mws[i].code + '</td>' +
                '<td>' + mws[i].desc + '</td>' +
                '<td>' + moment(mws[i].dateActive).format(df) + '</td>' + 
                '<td>' + mws[i].numCompleted + '</td>' + 
                '<td>' + mws[i].numAborted + '</td></tr>';
        }
    }

    $('#microworlds-test-loading').addClass('collapse');
    if (anyTest) {
        $('#microworlds-test-none').addClass('collapse');
        $('#microworlds-test-table-rows').html(testTable);
        $('#microworlds-test-table').removeClass('collapse');
    } else {
        $('#microworlds-test-none').removeClass('collapse');
        $('#microworlds-test-table').addClass('collapse');
    }

    $('#microworlds-active-loading').addClass('collapse');
    if (anyActive) {
        $('#microworlds-active-none').addClass('collapse');
        $('#microworlds-active-table-rows').html(activeTable);
        $('#microworlds-active-table').removeClass('collapse');
    } else {
        $('#microworlds-active-none').removeClass('collapse');
        $('#microworlds-active-table').addClass('collapse');
    }

    $('#microworlds-archived-loading').addClass('collapse');
    if (anyArchived) {
        $('#microworlds-archived-none').addClass('collapse');
        $('#microworlds-archived-table-rows').html(archivedTable);
        $('#microworlds-archived-table').removeClass('collapse');
    } else {
        $('#microworlds-archived-none').removeClass('collapse');
        $('#microworlds-archived-table').addClass('collapse');
    }
};

var microworldsError = function (jqXHR) {
    var errors = JSON.parse(jqXHR.responseText).errors;
    alert(errors);
};

var getMicroworlds = function () {
    $.ajax({
        type: 'GET',
        url: '/microworlds',
        error: microworldsError,
        success: microworldsSuccess
    });

    setTimeout(getMicroworlds, 60000);
};

var overrideSubmit = function () {
    return false;
};

var listSimulation = function(simulation) {
    var html = '<li><span class="simulation-list" id="new-simulation">Running: </span><span> Simulation ';
    html+= simulation.code + ' created on ' + simulation.time + ' ran by participants: <span class="participants">';
    for (var i = 0; i < simulation.participants.length; i++) {
        if (i != 0) {
            html+= ', ';
            if (i == simulation.participants.length - 1) {
                html+= 'and ';
            }
        }
        html+= simulation.participants[i];
    }
    html+= '</span></span></li>';

    $('#running-list').prepend(html);
    $('li').delay(300).animate({opacity : 1}, 500);
};

var currentRunningSimulations = function(simulations) {
    for (var oceanId in simulations) {
        if(simulations[oceanId].expId === expId) {
            listSimulation(simulations[oceanId]);
        }
    }
};

var newSimulation = function(simulation) {
    listSimulation(simulation);
}

var simulationDone = function(expCode, time) {
    var html = '<li><span class="simulation-list" id="done-simulation">Finished: </span><span> Simulation ' + expCode +
               ' created on ' + time;
    $('#running-list').prepend(html);
    $('li').delay(300).animate({opacity : 1}, 500);
}

socketAdmin.on('connect', function() {
    socketAdmin.emit('enterDashboard', expId);
});

socketAdmin.on('currentRunningSimulations', currentRunningSimulations);
socketAdmin.on('newSimulation', listSimulation);
socketAdmin.on('simulationDone', simulationDone);
// socketAdmin.on('newSimulation', listSimulation);

var main = function() {
    $('form').submit(overrideSubmit);
    getMicroworlds();
};

$(document).ready(main);
