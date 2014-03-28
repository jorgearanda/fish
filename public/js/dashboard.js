'use strict';
/*global document:true, location:true, $:true, alert:true, moment:true*/

var df = 'YYYY-MM-DD';
var st = [];

var simTypesSuccess = function (simTypes) {
   if (_.isEqual(st, simTypes)) return;

   st = simTypes;

   var anyTest = false;
   var anyActive = false;
   var anyArchived = false;
   var testTable = '';
   var activeTable = '';
   var archivedTable = '';

   for (var i in simTypes) {
      if (simTypes[i].status === 'test') {
         anyTest = true;
         testTable += '<tr onclick="location.href=\'/sim-types/' + 
            simTypes[i]._id + '\'"><td>' + simTypes[i].name + '</td>' +
            '<td>' + simTypes[i].code + '</td>' +
            '<td>' + simTypes[i].desc + '</td></tr>';
      }

      if (simTypes[i].status === 'active') {
         anyActive = true;
         activeTable += '<tr onclick="location.href=\'/sim-types/' + 
            simTypes[i]._id + '\'"><td>' + simTypes[i].name + '</td>' + 
            '<td>' + simTypes[i].desc + '</td>' +
            '<td>' + moment(simTypes[i].dateActive).format(df) + '</td>' + 
            '<td>' + simTypes[i].numCompleted + '</td>' + 
            '<td>' + simTypes[i].numAborted + '</td></tr>';
      }

      if (simTypes[i].status === 'archived') {
         anyArchived = true;
         archivedTable += '<tr onclick="location.href=\'/sim-types/' + 
            simTypes[i]._id + '\'"><td>' + simTypes[i].name + '</td>' + 
            '<td>' + simTypes[i].desc + '</td>' +
            '<td>' + moment(simTypes[i].dateActive).format(df) + '</td>' + 
            '<td>' + simTypes[i].numCompleted + '</td>' + 
            '<td>' + simTypes[i].numAborted + '</td></tr>';
      }
   }

   $('#sim-types-test-loading').addClass('collapse');
   if (anyTest) {
      $('#sim-types-test-none').addClass('collapse');
      $('#sim-types-test-table-rows').html(testTable);
      $('#sim-types-test-table').removeClass('collapse');
   } else {
      $('#sim-types-test-none').removeClass('collapse');
      $('#sim-types-test-table').addClass('collapse');
   }

   $('#sim-types-active-loading').addClass('collapse');
   if (anyActive) {
      $('#sim-types-active-none').addClass('collapse');
      $('#sim-types-active-table-rows').html(activeTable);
      $('#sim-types-active-table').removeClass('collapse');
   } else {
      $('#sim-types-active-none').removeClass('collapse');
      $('#sim-types-active-table').addClass('collapse');
   }

   $('#sim-types-archived-loading').addClass('collapse');
   if (anyArchived) {
      $('#sim-types-archived-none').addClass('collapse');
      $('#sim-types-archived-table-rows').html(archivedTable);
      $('#sim-types-archived-table').removeClass('collapse');
   } else {
      $('#sim-types-archived-none').removeClass('collapse');
      $('#sim-types-archived-table').addClass('collapse');
   }
};

var simTypesError = function (jqXHR) {
   var errors = JSON.parse(jqXHR.responseText).errors;
   alert(errors);
};

var getSimTypes = function () {
   $.ajax({
      type: 'GET',
      url: '/sim-types',
      error: simTypesError,
      success: simTypesSuccess
   });

   setTimeout(getSimTypes, 60000);
};

var overrideSubmit = function () {
   return false;
};

var main = function() {
   $('form').submit(overrideSubmit);
   getSimTypes();
};

$(document).ready(main);