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

var displaySimulationStatus = function(simulation, eventStatus, OId) {
    var rowBootstrapClass;
    if(eventStatus === 'Currently running') {
        rowBootstrapClass = '';
    } else if(eventStatus === 'Finished run') {
        rowBootstrapClass = 'info';
    } else {
        // must be an interruption
        rowBootstrapClass = 'warning';
    }

    var html = '<tr class =' + rowBootstrapClass + '><td>' + simulation.code + '</td>' + '<td>' + simulation.time + '<td>';
    for (var i = 0; i < simulation.participants.length; i++) {
        if (i != 0) {
            html+= ', ';
            if (i == simulation.participants.length - 1) {
                html+= 'and ';
            }
        }
        
        var participant = simulation.participants[i];
        if(eventStatus == 'Currently running') {
            // right now language defaults to english (en)
            // link to allow experimenters to observe running participants

            // build URL query string
            var params = { lang : "en", mwid : simulation.mwId, pid : participant, oid : simulation.timestamp, observer : true }
            var paramStr = $.param(params);
            html+= '<a id = "' + simulation.timestamp + '-' + participant + '" href=/fish?' + paramStr + '>';
        } else {
            // remove link, disable observing for that participant
            $('#' + simulation.timestamp + '-' + participant).removeAttr('href');
        }
        html+= simulation.participants[i];

        if(eventStatus == 'Currently running') {
            html+= '</a>';
        }
    }
    html+= '</td><td>' + eventStatus + '</td></tr>';

    $('#tracked-simulations-row').prepend(html);
    $('tr').delay(300).animate({opacity : 1}, 500);
};

var currentTrackedSimulationsAndAbandon = function(simulationsTracked, abandonTracked) {
    // this order must be retained, do not switch
    for (var oceanId in simulationsTracked) {
        if(simulationsTracked[oceanId].expId === expId) {
            displaySimulationStatus(simulationsTracked[oceanId], 'Currently running');
        }
    }

    for(var oceanId in abandonTracked) {
        if(abandonTracked[oceanId].expId == expId) {
            displaySimulationStatus(abandonTracked[oceanId], 'Participant abandoned simulation run');
        }
    }
};

var newSimulation = function (simulation) {
    displaySimulationStatus(simulation, 'Currently running');
}

var simulationDone = function (simulation) {
    displaySimulationStatus(simulation, 'Finished run');
}

var simulationInterrupt = function (simulation) {
    displaySimulationStatus(simulation, 'Participant abandoned simulation run');
}

socketAdmin.on('connect', function() {
    socketAdmin.emit('enterDashboard', expId);
});

socketAdmin.on('postTracked', currentTrackedSimulationsAndAbandon);
socketAdmin.on('newSimulation', newSimulation);
socketAdmin.on('simulationDone', simulationDone);
socketAdmin.on('simulationInterrupt', simulationInterrupt);

var main = function() {
    $('form').submit(overrideSubmit);
    getMicroworlds();
};

$(document).ready(main);
