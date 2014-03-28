'use strict';

var maxBot = 11;

function readyTooltips() {
   $('#early-end-tooltip').tooltip();
   $('#max-fish-tooltip').tooltip();
   $('#available-mystery-tooltip').tooltip();
   $('#reported-mystery-tooltip').tooltip();
   $('#spawn-factor-tooltip').tooltip();
   $('#chance-catch-tooltip').tooltip();
   $('#show-fisher-status-tooltip').tooltip();
   $('#erratic-tooltip').tooltip();
   $('#greed-tooltip').tooltip();
   $('#trend-tooltip').tooltip();
   $('#predictability-tooltip').tooltip();
   $('#prob-action-tooltip').tooltip();
   $('#attempts-second-tooltip').tooltip();
}

function changeBotRowVisibility() {
   var numFishers = parseInt($('#num-fishers').val(), 10);
   var numHumans = parseInt($('#num-humans').val(), 10);

   if (numFishers < 1) numFishers = 1;
   if (numFishers > maxBot + numHumans) {
      numFishers = maxBot + numHumans;
   }
   if (numHumans > numFishers) numHumans = numFishers;

   for (var i = 1; i <= numFishers - numHumans; i++) {
      $('#bot-' + i + '-row').removeClass('collapse');
   }

   for (var i = numFishers - numHumans + 1; i <= maxBot; i++) {
      $('#bot-' + i + '-row').addClass('collapse');
   }
}

function changeGreedUniformity() {
   if ($('#uniform-greed').prop('checked') === true) {
      var greed = $('#bot-1-greed').val();
      for (var i = 2; i <= maxBot; i++) {
         $('#bot-' + i + '-greed').val(greed).attr('disabled', true);
      }
   } else {
      for (var i = 2; i <= maxBot; i++) {
         $('#bot-' + i + '-greed').attr('disabled', false);
      }
   }
}

function changeTrendUniformity() {
   if ($('#uniform-trend').prop('checked') === true) {
      var trend = $('#bot-1-trend').val();
      for (var i = 2; i <= maxBot; i++) {
         $('#bot-' + i + '-trend').val(trend).attr('disabled', true);
      }
   } else {
      for (var i = 2; i <= maxBot; i++) {
         $('#bot-' + i + '-trend').attr('disabled', false);
      }
   }
}

function changePredictabilityUniformity() {
   if ($('#uniform-predictability').prop('checked') === true) {
      var predictability = $('#bot-1-predictability').val();
      for (var i = 2; i <= maxBot; i++) {
         $('#bot-' + i + '-predictability').val(predictability).attr('disabled', true);
      }
   } else {
      for (var i = 2; i <= maxBot; i++) {
         $('#bot-' + i + '-predictability').attr('disabled', false);
      }
   }
}

function changeProbActionUniformity() {
   if ($('#uniform-prob-action').prop('checked') === true) {
      var probAction = $('#bot-1-prob-action').val();
      for (var i = 2; i <= maxBot; i++) {
         $('#bot-' + i + '-prob-action').val(probAction).attr('disabled', true);
      }
   } else {
      for (var i = 2; i <= maxBot; i++) {
         $('#bot-' + i + '-prob-action').attr('disabled', false);
      }
   }
}

function changeAttemptsSecondUniformity() {
   if ($('#uniform-attempts-second').prop('checked') === true) {
      var attemptsSecond = $('#bot-1-attempts-second').val();
      for (var i = 2; i <= maxBot; i++) {
         $('#bot-' + i + '-attempts-second').val(attemptsSecond).attr('disabled', true);
      }
   } else {
      for (var i = 2; i <= maxBot; i++) {
         $('#bot-' + i + '-attempts-second').attr('disabled', false);
      }
   }
}

function validate() {
   var errors = [];

   if ($('#name').val().length < 1) {
      errors.push('The simulation type name is missing.');
   }

   var numFishers = parseInt($('#num-fishers').val(), 10);
   if (numFishers < 1) {
      errors.push('There must be at least one fisher per simulation');
   }

   if (numFishers > 12) {
      errors.push('The maximum number of fishers per simulation is twelve.');
   }

   var numHumans = parseInt($('#num-humans').val(), 10);
   if (numHumans < 0) {
      errors.push('There must be zero or more humans per simulation.');
   }

   if (numHumans > numFishers) {
      errors.push('There cannot be more human fishers than total fishers.');
   }

   if (parseInt($('#num-seasons').val(), 10) < 1) {
      errors.push('There must be at least one season per simulation.');
   }

   if (parseInt($('#season-duration').val(), 10) < 1) {
      errors.push('Seasons must have a duration of at least one second.');
   }

   if (parseInt($('#initial-delay').val(), 10) < 1) {
      errors.push('The initial delay must be at least one second long.');
   }
      
   if (parseInt($('#season-delay').val(), 10) < 1) {
      errors.push('The delay between seasons must be at least one second.');
   }

   if (parseFloat($('#fish-value').val()) < 0) {
      errors.push('The value per fish cannot be negative');
   }

   if (parseFloat($('#cost-cast').val()) < 0) {
      errors.push('The cost to attempt to fish cannot be negative.');
   }

   if (parseFloat($('#cost-departure').val()) < 0) {
      errors.push('The cost to set sail cannot be negative.');
   }

   if (parseFloat($('#cost-second').val()) < 0) {
      errors.push('The cost per second at sea cannot be negative.');
   }

   var certainFish = parseInt($('#certain-fish').val(), 10);
   if (certainFish < 1) {
      errors.push('There must be at least one initial fish.');
   }

   var availMysteryFish = parseInt($('#available-mystery-fish').val(), 10);
   if (availMysteryFish < 0) {
      errors.push('The number of available mystery fish cannot be negative');
   }

   var repMysteryFish = parseInt($('#reported-mystery-fish').val(), 10);
   if (repMysteryFish < availMysteryFish) {
      errors.push('The number of reported mystery fish must be equal or ' +
         'greater than the number of actually available mystery fish.');
   }

   var maxFish = parseInt($('#max-fish').val(), 10);
   if (maxFish < certainFish + availMysteryFish) {
      errors.push('The maximum fish capacity must be equal or greater ' +
         'than the sum of certain and available mystery fish.');
   }

   if (parseFloat($('#spawn-factor').val()) < 0) {
      errors.push('The spawn factor cannot be negative.');
   }

   if (parseFloat($('#chance-catch').val()) < 0 ||
         parseFloat($('#chance-catch').val()) > 1) {
      errors.push('The chance of catch must be a number between 0 and 1.');
   }

   for (var i = 0; i < (numFishers - numHumans); i++) {
      // Bot checkin'
   }

   // Remaining fields to validate:
   //
   // Bot names
   // Bot greeds
   // Bot probability of action
   // Bot attempts per second
   // Preparation text
   // End (by time) text
   // End (by depletion) text

   if (errors.length === 0) return null;
   return errors;
}

function prepareSimTypeObject() {
   var st = {};
   st.name = $('#name').val();
   st.desc = $('#desc').val();
   st.numFishers = $('#num-fishers').val();
   st.numHumans = $('#num-humans').val();
   st.numSeasons = $('#num-seasons').val();
   st.seasonDuration = $('#season-duration').val();
   st.initialDelay = $('#initial-delay').val();
   st.seasonDelay = $('#season-delay').val();
   st.enablePause = $('#enable-pause').val();
   st.enableEarlyEnd = $('#enable-early-end').val();
   st.fishValue = $('#fish-value').val();
   st.costCast = $('#cost-cast').val();
   st.costDeparture = $('#cost-departure').val();
   st.costSecond = $('#cost-second').val();
   st.currencySymbol = $('#currency-symbol').val();
   st.certainFish = $('#certain-fish').val();
   st.availableMysteryFish = $('#available-mystery-fish').val();
   st.reportedMysteryFish = $('#reported-mystery-fish').val();
   st.maxFish = $('#max-fish').val();
   st.spawnFactor = $('#spawn-factor').val();
   st.chanceCatch = $('#chance-catch').val();
   st.showFishers = $('#show-fishers').val();
   st.showFisherNames = $('#show-fisher-names').val();
   st.showFisherStatus = $('#show-fisher-status').val();
   st.showNumCaught = $('#show-num-caught').val();
   st.showFisherBalance = $('#show-fisher-balance').val();
   st.preparationText = $('#preparation-text').val();
   st.endTimeText = $('#end-time-text').val();
   st.endDepletionText = $('#end-depletion-text').val();
   st.bots = []
   for (var i = 0; i <= st.numFishers - st.numHumans; i++) {
      var botPrefix = '#bot-' + i + '-';
      st.bots.push({
         name: $(botPrefix + 'name').val(),
         greed: $(botPrefix + 'greed').val(),
         trend: $(botPrefix + 'trend').val(),
         predictability: $(botPrefix + 'predictability').val(),
         probAction: $(botPrefix + 'prob-action').val(),
         attemptsSecond: $(botPrefix + 'attempts-second').val()
      });
   }

   return st;
}

function badSimType(jqXHR) {
   // TODO - report on reasons for failure
}

function goodSimType() {
   location.href = '../dashboard';
}

function createSimType() {
   var err = validate();
   if (err) {
      var errMessage = 'The form has the following errors:\n\n';
      for (var i in err) {
         errMessage += err[i] + '\n';
      }
      alert(errMessage);
      return;
   }

   var st = prepareSimTypeObject();
   $.ajax({
      type: 'POST',
      url: '/sim-types',
      data: st,
      error: badSimType,
      success: goodSimType
   });
}

function setButtons() {
   $('#create').click(createSimType);
   $('#create-2').click(createSimType);
}

function setOnPageChanges() {
   $('#num-fishers').on('change', changeBotRowVisibility);
   $('#num-humans').on('change', changeBotRowVisibility);
   $('#uniform-greed').on('change', changeGreedUniformity);
   $('#bot-1-greed').on('input', changeGreedUniformity);
   $('#uniform-trend').on('change', changeTrendUniformity);
   $('#bot-1-trend').on('change', changeTrendUniformity);
   $('#uniform-predictability').on('change', changePredictabilityUniformity);
   $('#bot-1-predictability').on('change', changePredictabilityUniformity);
   $('#uniform-prob-action').on('change', changeProbActionUniformity);
   $('#bot-1-prob-action').on('input', changeProbActionUniformity);
   $('#uniform-attempts-second').on('change', changeAttemptsSecondUniformity);
   $('#bot-1-attempts-second').on('input', changeAttemptsSecondUniformity);
}

function loadTexts() {
   $('#preparation-text').val(prepText);
   $('#end-time-text').val(endTimeText);
   $('#end-depletion-text').val(endDepletedText);
}

function main() {
   changeGreedUniformity();
   changeTrendUniformity();
   changePredictabilityUniformity();
   changeProbActionUniformity();   
   changeAttemptsSecondUniformity();

   readyTooltips();
   setButtons();
   setOnPageChanges();
   loadTexts();
}

$(document).ready(main);