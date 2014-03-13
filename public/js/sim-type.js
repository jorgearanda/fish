'use strict';

function readyTooltips() {
   $('#early-end-tooltip').tooltip();
   $('#max-fish-tooltip').tooltip();
   $('#available-mystery-tooltip').tooltip();
   $('#reported-mystery-tooltip').tooltip();
   $('#spawn-factor-tooltip').tooltip();
   $('#chance-catch-tooltip').tooltip();
   $('#show-fisher-status-tooltip').tooltip();
   $('#erratic-tooltip').tooltip();
}

function validate() {
   var errors = [];

   if ($('#name').value().length < 1) {
      errors.push('The simulation type name is missing.');
   }

   var numFishers = parseInt($('#num-fishers').value(), 10);
   if (numFishers < 1) {
      errors.push('There must be at least one fisher per simulation');
   }

   if (numFishers > 12) {
      errors.push('The maximum number of fishers per simulation is twelve.');
   }

   var numHumans = parseInt($('#num-humans').value(), 10);
   if (numHumans < 0) {
      errors.push('There must be zero or more humans per simulation.');
   }

   if (numHumans > numFishers) {
      errors.push('There cannot be more human fishers than total fishers.');
   }

   if (parseInt($('#num-seasons').value(), 10) < 1) {
      errors.push('There must be at least one season per simulation.');
   }

   if (parseInt($('#season-duration').value(), 10) < 1) {
      errors.push('Seasons must have a duration of at least one second.');
   }

   if (parseInt($('#initial-delay').value(), 10) < 1) {
      errors.push('The initial delay must be at least one second long.');
   }
      
   if (parseInt($('#season-delay').value(), 10) < 1) {
      errors.push('The delay between seasons must be at least one second.');
   }

   if (parseFloat($('#fish-value').value()) < 0) {
      errors.push('The value per fish cannot be negative');
   }

   if (parseFloat($('#cost-cast').value()) < 0) {
      errors.push('The cost to attempt to fish cannot be negative.');
   }

   if (parseFloat($('#cost-departure').value()) < 0) {
      errors.push('The cost to set sail cannot be negative.');
   }

   if (parseFloat($('#cost-second').value()) < 0) {
      errors.push('The cost per second at sea cannot be negative.');
   }

   // Remaining fields to validate:
   //
   // Certain fish
   // Available mystery fish
   // Reported mystery fish
   // Maximum fish capacity of ocean
   // Spawn factor
   // Chance of catch
   // Bot names
   // Bot greeds
   // Bot probability of action
   // Bot attempts per second
   // Preparation text
   // End (by time) text
   // End (by depletion) text
}

function main() {
   readyTooltips();
}

$(document).ready(main);