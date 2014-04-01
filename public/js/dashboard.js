'use strict';
/*global document:true, location:true, $:true, alert:true, moment:true*/

var df = 'YYYY-MM-DD';
var lastMwRes = [];

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
         testTable += '<tr onclick="location.href=\'/microworlds/' + 
            mws[i]._id + '\'"><td>' + mws[i].name + '</td>' +
            '<td>' + mws[i].code + '</td>' +
            '<td>' + mws[i].desc + '</td></tr>';
      }

      if (mws[i].status === 'active') {
         anyActive = true;
         activeTable += '<tr onclick="location.href=\'/microworlds/' + 
            mws[i]._id + '\'"><td>' + mws[i].name + '</td>' + 
            '<td>' + mws[i].desc + '</td>' +
            '<td>' + moment(mws[i].dateActive).format(df) + '</td>' + 
            '<td>' + mws[i].numCompleted + '</td>' + 
            '<td>' + mws[i].numAborted + '</td></tr>';
      }

      if (mws[i].status === 'archived') {
         anyArchived = true;
         archivedTable += '<tr onclick="location.href=\'/microworlds/' + 
            mws[i]._id + '\'"><td>' + mws[i].name + '</td>' + 
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

var main = function() {
   $('form').submit(overrideSubmit);
   getMicroworlds();
};

$(document).ready(main);