'use strict';
/*global document:true, location:true, $:true, alert:true*/

var simTypesSuccess = function (simTypes) {
   console.log(simTypes);
   var numTest = 0;
   var testTable = '';

   for (var i in simTypes) {
      if (simTypes[i].status === 'test') {
         numTest += 1;
         testTable += '<tr onclick="location.href=\'/sim-types/' + 
            simTypes[i]._id + '\'"><td>' + simTypes[i].name + '</td></tr>';
      } else {
         console.log('non test: ' + simTypes[i]);
      }
   }

   $('#sim-types-test-loading').addClass('collapse');
   if (numTest === 0) {
      $('#sim-types-test-none').removeClass('collapse');
      $('#sim-types-test-table').addClass('collapse');
   } else {
      $('#sim-types-test-none').addClass('collapse');
      $('#sim-types-test-table-rows').html(testTable);
      $('#sim-types-test-table').removeClass('collapse');
   }
};

var simTypesError = function (jqXHR) {
   var errors = JSON.parse(jqXHR.responseText).errors;
   alert(errors);
};

var getSimTypes = function () {
   $('#sim-types-test-loading').removeClass('collapse');

   $.ajax({
      type: 'GET',
      url: '/sim-types',
      error: simTypesError,
      success: simTypesSuccess
   });
};

var overrideSubmit = function () {
   return false;
};

var main = function() {
   $('form').submit(overrideSubmit);
   getSimTypes();
};

$(document).ready(main);