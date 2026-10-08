'use strict';

var maxBot = 11;
var mode;
var mw = {};
var mwId;

function getMwId() {
    mwId = $.url().segment(4);
}

function isNewMicroworld() {
    return ($.url().segment(3) === 'new');
}

function showStatusTableOptions() {
    var behaviour_name = $(this).attr('id');

    var behaviour_type = $(this).text();
    $(this).closest('.dropdown').find('span#btn_txt').text(behaviour_type + "  ")

    $("." + behaviour_name).removeClass('hide');

    if (behaviour_name == "static_option") {
        $(".dynamic_option").addClass('hide');
    } else {
        $(".static_option").addClass('hide');
    }

}

function readyTooltips() {
    $('#early-end-tooltip').tooltip();
    $('#hide-ocean-tooltip').tooltip();
    $('#show-fish-value-notice-tooltip').tooltip();
    $('#show-game-clock-tooltip').tooltip();
    $('#disconnect-handling-tooltip').tooltip();
    $('#disconnect-grace-period-tooltip').tooltip();
    $('#disconnect-during-grace-tooltip').tooltip();
    $('#disconnects-allowed-tooltip').tooltip();
    $('#disconnect-lost-action-tooltip').tooltip();
    $('#max-fish-tooltip').tooltip();
    $('#available-mystery-tooltip').tooltip();
    $('#reported-mystery-tooltip').tooltip();
    $('#spawn-factor-tooltip').tooltip();
    $('#chance-catch-tooltip').tooltip();
    $('#show-fisher-status-tooltip').tooltip();
    $('#erratic-tooltip').tooltip();
    $('#greed-tooltip').tooltip();
    $('#greed-spread-tooltip').tooltip();
    $('#trend-tooltip').tooltip();
    $('#predictability-tooltip').tooltip();
    $('#prob-action-tooltip').tooltip();
    $('#attempts-second-tooltip').tooltip();
    $('#catch-intentions-tooltip').tooltip();
    $('#catch-intention-seasons-tooltip').tooltip();
    $('#catch-intent-dialog-duration-tooltip').tooltip();
    $('#redirect-url-tooltip').tooltip();
    $('#read-rules-timeout-tooltip').tooltip();
    $('#lobby-wait-timeout-tooltip').tooltip();
    $('#prompt-timeout-tooltip').tooltip();
    $('#max-timeouts-tooltip').tooltip();
    $('#profit-season-tooltip').tooltip();
    $('#profit-total-tooltip').tooltip();
    $('#profit-gap-tooltip').tooltip();
    $('#fisher-classes-tooltip').tooltip();
    $('#fisher-class-names-tooltip').tooltip();
    $('#fisher-class-counts-tooltip').tooltip();
    $('#fisher-class-emojis-tooltip').tooltip();
    $('#fisher-advantage-tooltip').tooltip();
    $('#clean-abort-tooltip').tooltip();
    $('#fish-value-pay-gap-tooltip').tooltip();
    $('#cost-cast-reduction-tooltip').tooltip();
    $('#cost-departure-reduction-tooltip').tooltip();
    $('#cost-second-reduction-tooltip').tooltip();
    $('#advantage-emoji-tooltip').tooltip();
    $('#disadvantage-emoji-tooltip').tooltip();
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
        $('.bot-' + i + '-col').removeClass('hide');
    }

    for (var i = numFishers - numHumans + 1; i <= maxBot; i++) {
        $('.bot-' + i + '-col').addClass('hide');
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

function changeGreedSpreadUniformity() {
    if ($('#uniform-greed-spread').prop('checked') === true) {
        var greedSpread = $('#bot-1-greed-spread').val();
        for (var i = 2; i <= maxBot; i++) {
            $('#bot-' + i + '-greed-spread').val(greedSpread).attr('disabled', true);
        }
    } else {
        for (var i = 2; i <= maxBot; i++) {
            $('#bot-' + i + '-greedSpread').attr('disabled', false);
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

function updateBotClassDropdowns() {
    var classNames = parseFisherClassNames($('#fisher-class-names').val());
    for (var i = 1; i <= maxBot; i++) {
        var $select = $('#bot-' + i + '-class');
        var currentVal = $select.val();
        $select.empty();
        for (var j = 0; j < classNames.length; j++) {
            $select.append($('<option>').val(classNames[j]).text(classNames[j]));
        }
        // Restore previous value if it still exists
        if (classNames.indexOf(currentVal) >= 0) {
            $select.val(currentVal);
        }
    }
}

function parseCatchIntentSeasons(seasonsList, clean = false) {
    // Extract all integers > 1 from given list (string)
    var seasonsRegexp = /([2-9][0-9]*)|([1-9][0-9]+)/g;
    var seasonNumbers = seasonsList.match(seasonsRegexp);
    if (!seasonNumbers) return [];
    seasonNumbers = seasonNumbers.map(Number);
    if (clean) {
        seasonNumbers = seasonNumbers.sort((a, b) => a - b);
        // Worth removing duplicates?
    }
    return seasonNumbers;
}

function isSingleEmoji(str) {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        var segments = Array.from(new Intl.Segmenter().segment(str));
        return segments.length === 1;
    }
    // Fallback: allow one code point with optional variation selector
    return /^.[\uFE0F]?$/us.test(str);
}

function validate() {
    var errors = [];

    if ($('#name').val().length < 1) {
        errors.push('The microworld name is missing.');
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

    if ($('#enable-disconnect-handling').prop('checked')) {
        if (!(parseInt($('#disconnect-grace-period').val(), 10) >= 1)) {
            errors.push('The grace period to reconnect must be at least one second.');
        }
        if (!(parseInt($('#disconnects-allowed').val(), 10) >= 0)) {
            errors.push('The number of disconnects allowed cannot be negative.');
        }
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

    var chanceCatch = parseFloat($('#chance-catch').val());
    if (chanceCatch < 0 || chanceCatch > 1) {
        errors.push('The chance of catch must be a number between 0 and 1.');
    }

    var catchIntentSeasonsStr = $('#catch-intent-seasons').val();
    var catchIntentSeasons = parseCatchIntentSeasons(catchIntentSeasonsStr);
    if (catchIntentSeasonsStr !== catchIntentSeasons.toString()) {
        errors.push('"' + catchIntentSeasonsStr + '" is not a comma-separated list of season numbers greater than 1.');
        $('#catch-intent-seasons').val(parseCatchIntentSeasons(catchIntentSeasonsStr, true));
    }

    if ($('#enable-fisher-classes').prop('checked')) {
        var classNames = parseFisherClassNames($('#fisher-class-names').val());
        var countsStr = $('#fisher-class-counts').val();
        var countsList = parseCommaSeparatedList(countsStr);

        // Validate counts are positive integers
        var countsValid = true;
        var countSum = 0;
        for (var i = 0; i < countsList.length; i++) {
            var num = parseInt(countsList[i], 10);
            if (isNaN(num) || num <= 0) {
                countsValid = false;
                break;
            }
            countSum += num;
        }

        if (!countsValid) {
            errors.push('"' + countsStr + '" is not a valid comma-separated list of positive numbers.');
        } else {
            if (countSum !== numFishers) {
                errors.push('The sum of fisher class counts (' + countSum + ') must equal the number of fishers per simulation (' + numFishers + ').');
            }
            if (countsList.length !== classNames.length) {
                errors.push('The number of class counts (' + countsList.length + ') must match the number of class names (' + classNames.length + ').');
            }
        }

        // Validate emojis count matches class names
        var emojisStr = $('#fisher-class-emojis').val();
        var emojisList = parseCommaSeparatedList(emojisStr);
        if (emojisList.length !== classNames.length) {
            errors.push('The number of emojis (' + emojisList.length + ') must match the number of class names (' + classNames.length + ').');
        }
        for (var i = 0; i < emojisList.length; i++) {
            if (!isSingleEmoji(emojisList[i].trim())) {
                errors.push('Class emoji "' + emojisList[i] + '" must be a single emoji or symbol character.');
            }
        }

        // Validate bot class assignments don't exceed class counts
        if (countsValid && countsList.length === classNames.length) {
            var classCounts = {};
            for (var i = 0; i < classNames.length; i++) {
                classCounts[classNames[i]] = parseInt(countsList[i], 10);
            }
            var botClassTally = {};
            var numBots = numFishers - numHumans;
            for (var i = 1; i <= numBots; i++) {
                var botClass = $('#bot-' + i + '-class').val();
                if (botClass) {
                    botClassTally[botClass] = (botClassTally[botClass] || 0) + 1;
                }
            }
            for (var cls in botClassTally) {
                if (botClassTally[cls] > (classCounts[cls] || 0)) {
                    errors.push('Too many bots assigned to class "' + cls + '": ' + botClassTally[cls] + ' bots but only ' + classCounts[cls] + ' total slots for that class.');
                }
            }
        }
    }

    if ($('#enable-fisher-advantage').prop('checked')) {
        var advEmoji = $('#advantage-emoji').val().trim();
        if (advEmoji && !isSingleEmoji(advEmoji)) {
            errors.push('Advantage emoji must be a single emoji or symbol character.');
        }
        var disadvEmoji = $('#disadvantage-emoji').val().trim();
        if (disadvEmoji && !isSingleEmoji(disadvEmoji)) {
            errors.push('No-advantage emoji must be a single emoji or symbol character.');
        }
        var payGap = parseFloat($('#fish-value-pay-gap').val());
        if (isNaN(payGap) || payGap < 0.01) {
            errors.push('The fish value pay gap must be at least 0.01.');
        }

        var costCastReduction = parseFloat($('#cost-cast-reduction').val());
        if (isNaN(costCastReduction) || costCastReduction < 0) {
            errors.push('The cost to attempt to fish reduction cannot be negative.');
        } else if (costCastReduction > parseFloat($('#cost-cast').val())) {
            errors.push('The cost to attempt to fish reduction cannot exceed the cost to attempt to fish.');
        }

        var costDepartureReduction = parseFloat($('#cost-departure-reduction').val());
        if (isNaN(costDepartureReduction) || costDepartureReduction < 0) {
            errors.push('The cost to set sail reduction cannot be negative.');
        } else if (costDepartureReduction > parseFloat($('#cost-departure').val())) {
            errors.push('The cost to set sail reduction cannot exceed the cost to set sail.');
        }

        var costSecondReduction = parseFloat($('#cost-second-reduction').val());
        if (isNaN(costSecondReduction) || costSecondReduction < 0) {
            errors.push('The cost per second at sea reduction cannot be negative.');
        } else if (costSecondReduction > parseFloat($('#cost-second').val())) {
            errors.push('The cost per second at sea reduction cannot exceed the cost per second at sea.');
        }
    }

    if (parseInt($('#catch-intent-dialog-duration').val()) < 0) {
        errors.push('The catch intent extra time cannot be negative.');
    }

    if ($('#preparation-text').val().length < 1) {
        errors.push('The preparation text is missing.');
    }

    if ($('#end-time-text').val().length < 1) {
        errors.push('The text for ending on time is missing.');
    }

    if ($('#end-depletion-text').val().length < 1) {
        errors.push('The text for ending on depletion is missing.');
    }

    if ($('#enable-clean-abort').prop('checked')) {
        var readRulesTimeout = parseInt($('#read-rules-timeout').val());
        if (isNaN(readRulesTimeout) || readRulesTimeout < 0 || readRulesTimeout > 10) {
            errors.push('Read rules timeout must be between 0 and 10 minutes.');
        }
        var lobbyWaitTimeout = parseInt($('#lobby-wait-timeout').val());
        if (isNaN(lobbyWaitTimeout) || lobbyWaitTimeout < 0 || lobbyWaitTimeout > 10) {
            errors.push('Lobby wait timeout must be between 0 and 10 minutes.');
        }
        var promptTimeout = parseInt($('#prompt-timeout').val());
        if (isNaN(promptTimeout) || promptTimeout < 10 || promptTimeout > 60) {
            errors.push('Prompt timeout must be between 10 and 60 seconds.');
        }
        var maxTimeouts = parseInt($('#max-timeouts').val());
        if (isNaN(maxTimeouts) || maxTimeouts < 1 || maxTimeouts > 20) {
            errors.push('Max timeouts must be between 1 and 20.');
        }
    }

    for (var i = 1; i <= (numFishers - numHumans); i++) {
        if ($('#bot-' + i + '-name').val().length < 1) {
            errors.push('Bot ' + i + ' needs a name.');
        }

        var botGreed = parseFloat($('#bot-' + i + '-greed').val());
        if (botGreed < 0 || botGreed > 1) {
            errors.push('The greed of bot ' + i + ' must be between 0 and 1.');
        }

        var botGreedSpread = parseFloat($('#bot-' + i + '-greed-spread').val());
        if (botGreedSpread < 0) {
            errors.push('The greed spread of bot ' + i + ' must be greater than 0.');
        }
        if (botGreedSpread > 2 * botGreed) {
            errors.push('The greed spread of bot ' + i + ' must be less than twice its greed.');
        }

        var botProbAction = parseFloat($('#bot-' + i + '-prob-action').val());
        if (botProbAction < 0 || botProbAction > 1) {
            errors.push('The probability of action of bot ' + i +
                ' must be between 0 and 1.');
        }

        var botAttempts = parseFloat($('#bot-' + i + '-attempts-second').val());
        if (botAttempts < 1) {
            errors.push('The attempts per second of bot ' + i +
                ' must be between at least 1.');
        }
    }

    if (errors.length === 0) return null;
    return errors;
}

function prepareMicroworldObject() {
    var mw = {};
    mw.name = $('#name').val();
    mw.desc = $('#desc').val();
    mw.numFishers = $('#num-fishers').val();
    mw.numHumans = $('#num-humans').val();
    mw.numSeasons = $('#num-seasons').val();
    mw.seasonDuration = $('#season-duration').val();
    mw.initialDelay = $('#initial-delay').val();
    mw.seasonDelay = $('#season-delay').val();
    mw.enablePause = $('#enable-pause').prop('checked');
    mw.enableEarlyEnd = $('#enable-early-end').prop('checked');
    mw.enableTutorial = $('#enable-tutorial').prop('checked');
    mw.catchIntentionsEnabled = $('#enable-catch-intentions').prop('checked');
    mw.catchIntentSeasons = parseCatchIntentSeasons($('#catch-intent-seasons').val(), true);
    mw.catchIntentDialogDuration = $('#catch-intent-dialog-duration').val();
    mw.catchIntentPrompt1 = $('#catch-intent-prompt1').val();
    mw.catchIntentPrompt2 = $('#catch-intent-prompt2').val();
    mw.fisherClassesEnabled = $('#enable-fisher-classes').prop('checked');
    var classNames = parseFisherClassNames($('#fisher-class-names').val());
    mw.fisherClasses = classNames;
    mw.fisherClassCounts = parseFisherClassCounts($('#fisher-class-counts').val(), classNames);
    mw.fisherClassEmojis = parseFisherClassEmojis($('#fisher-class-emojis').val(), classNames);
    mw.fisherAdvantageEnabled = $('#enable-fisher-advantage').prop('checked');
    mw.fishValuePayGap = $('#fish-value-pay-gap').val();
    mw.costCastReduction = $('#cost-cast-reduction').val();
    mw.costDepartureReduction = $('#cost-departure-reduction').val();
    mw.costSecondReduction = $('#cost-second-reduction').val();
    mw.advantageEmoji = $('#advantage-emoji').val();
    mw.disadvantageEmoji = $('#disadvantage-emoji').val();
    mw.redirectURL = $('#redirect-url').val();
    mw.cleanAbortEnabled = $('#enable-clean-abort').prop('checked');
    mw.readRulesTimeout = parseInt($('#read-rules-timeout').val()) || 0;
    mw.lobbyWaitTimeout = parseInt($('#lobby-wait-timeout').val()) || 0;
    mw.promptTimeout = parseInt($('#prompt-timeout').val()) || 20;
    mw.maxTimeouts = parseInt($('#max-timeouts').val()) || 10;
    mw.abortUrl = $('#abort-url').val();
    mw.abortReadingRulesText = $('#abort-reading-rules-text').val();
    mw.abortLobbyWaitText = $('#abort-lobby-wait-text').val();
    mw.forceAbortText = $('#force-abort-text').val();
    mw.enableRespawnWarning = $('#change-ocean-colour').prop('checked');
    mw.hideOcean = $('#hide-ocean').prop('checked');
    mw.showFishValueNotice = $('#show-fish-value-notice').prop('checked');
    mw.showGameClock = $('#show-game-clock').prop('checked');
    mw.disconnectHandlingEnabled = $('#enable-disconnect-handling').prop('checked');
    mw.disconnectGracePeriod = $('#disconnect-grace-period').val();
    mw.disconnectDuringGrace = $('#disconnect-during-grace').val();
    mw.disconnectsAllowed = $('#disconnects-allowed').val();
    mw.disconnectLostAction = $('#disconnect-lost-action').val();
    mw.fishValue = $('#fish-value').val();
    mw.profitSeasonDisabled = $('#disable-profit-season').prop('checked');
    mw.profitTotalDisabled = $('#disable-profit-total').prop('checked');
    mw.profitGapDisabled = !$('#enable-profit-gap').prop('checked');
    mw.costCast = $('#cost-cast').val();
    mw.costDeparture = $('#cost-departure').val();
    mw.costSecond = $('#cost-second').val();
    mw.currencySymbol = $('#currency-symbol').val();
    mw.certainFish = $('#certain-fish').val();
    mw.availableMysteryFish = $('#available-mystery-fish').val();
    mw.reportedMysteryFish = $('#reported-mystery-fish').val();
    mw.maxFish = $('#max-fish').val();
    mw.spawnFactor = $('#spawn-factor').val();
    mw.chanceCatch = $('#chance-catch').val();
    mw.showFishers = $('#show-fishers').prop('checked');
    mw.showFisherNames = $('#show-fisher-names').prop('checked');
    mw.showFisherStatus = $('#show-fisher-status').prop('checked');
    mw.showNumCaught = $('#show-num-caught').prop('checked');
    mw.showFisherBalance = $('#show-fisher-balance').prop('checked');
    mw.preparationText = $('#preparation-text').val();
    mw.endTimeText = $('#end-time-text').val();
    mw.endDepletionText = $('#end-depletion-text').val();
    mw.bots = [];
    for (var i = 1; i <= mw.numFishers - mw.numHumans; i++) {
        var botPrefix = '#bot-' + i + '-';
        mw.bots.push({
            name: $(botPrefix + 'name').val(),
            greed: $(botPrefix + 'greed').val(),
            greedSpread: $(botPrefix + 'greed-spread').val(),
            trend: $(botPrefix + 'trend').val(),
            predictability: $(botPrefix + 'predictability').val(),
            probAction: $(botPrefix + 'prob-action').val(),
            attemptsSecond: $(botPrefix + 'attempts-second').val(),
            fClass: $(botPrefix + 'class').val(),
            fHasAdvantage: $(botPrefix + 'advantage').val() === 'yes'
        });
    }
    mw.oceanOrder = $("input[name=ocean_order]:checked").val();

    return mw;
}

function reportErrors(err) {
    var errMessage = 'The form has the following errors:\n\n';
    for (var i in err) {
        errMessage += err[i] + '\n';
    }
    alert(errMessage);
    return;
}

function badMicroworld(jqXHR) {
    reportErrors(JSON.parse(jqXHR.responseText).errors);
    return;
}

function goodMicroworld() {
    location.href = '../dashboard';
}

function createMicroworld() {
    var err = validate();
    if (err) {
        reportErrors(err);
        return;
    }

    var mw = prepareMicroworldObject();
    $.ajax({
        type: 'POST',
        url: '/microworlds',
        data: mw,
        error: badMicroworld,
        success: goodMicroworld
    });
}

function cloneMicroworld() {
    var err = validate();
    if (err) {
        reportErrors(err);
        return;
    }

    var mw = prepareMicroworldObject();
    mw.clone = true;

    $.ajax({
        type: 'POST',
        url: '/microworlds',
        data: mw,
        error: badMicroworld,
        success: goodMicroworld
    });
}

function updateMicroworld(changeTo) {
    var err = validate();
    if (err) {
        reportErrors(err);
        return;
    }

    var mw = prepareMicroworldObject();
    if (changeTo) mw.changeTo = changeTo;
    $.ajax({
        type: 'PUT',
        url: '/microworlds/' + mwId,
        data: mw,
        error: badMicroworld,
        success: goodMicroworld
    });
}

function saveMicroworld() {
    updateMicroworld();
}

function activateMicroworld() {
    updateMicroworld('active');
}

function archiveMicroworld() {
    updateMicroworld('archived');
}

function deleteMicroworld() {
    $.ajax({
        type: 'DELETE',
        url: '/microworlds/' + mwId,
        error: badMicroworld,
        success: goodMicroworld
    });
}

function populatePage() {
    $('#name').val(mw.name);
    $('#desc').val(mw.desc);
    $('#num-fishers').val(mw.params.numFishers);
    $('#num-humans').val(mw.params.numHumans);
    $('#num-seasons').val(mw.params.numSeasons);
    $('#season-duration').val(mw.params.seasonDuration);
    $('#initial-delay').val(mw.params.initialDelay);
    $('#season-delay').val(mw.params.seasonDelay);
    $('#enable-pause').prop('checked', mw.params.enablePause);
    $('#enable-early-end').prop('checked', mw.params.enableEarlyEnd);
    $('#enable-tutorial').prop('checked', mw.params.enableTutorial);
    $('#enable-catch-intentions').prop('checked', mw.params.catchIntentionsEnabled);
    $('#catch-intent-seasons').val(mw.params.catchIntentSeasons.toString());
    $('#catch-intent-dialog-duration').val(mw.params.catchIntentDialogDuration);
    $('#catch-intent-prompt1').val(mw.params.catchIntentPrompt1);
    $('#catch-intent-prompt2').val(mw.params.catchIntentPrompt2);
    maybeDisableCatchIntentControls(mw.params.catchIntentionsEnabled);
    $('#enable-fisher-classes').prop('checked', mw.params.fisherClassesEnabled || false);
    var classNames = mw.params.fisherClasses || ['Female', 'Male'];
    $('#fisher-class-names').val(fisherClassNamesToString(classNames));
    $('#fisher-class-counts').val(fisherClassCountsToString(mw.params.fisherClassCounts, classNames));
    $('#fisher-class-emojis').val(fisherClassEmojisToString(mw.params.fisherClassEmojis, classNames));
    maybeDisableFisherClassControls(mw.params.fisherClassesEnabled || false);
    $('#enable-fisher-advantage').prop('checked', mw.params.fisherAdvantageEnabled || false);
    $('#fish-value-pay-gap').val(mw.params.fishValuePayGap || 0);
    $('#cost-cast-reduction').val(mw.params.costCastReduction || 0);
    $('#cost-departure-reduction').val(mw.params.costDepartureReduction || 0);
    $('#cost-second-reduction').val(mw.params.costSecondReduction || 0);
    $('#advantage-emoji').val(mw.params.advantageEmoji || '↑');
    $('#disadvantage-emoji').val(mw.params.disadvantageEmoji || '↓');
    maybeDisableFisherAdvantageControls(mw.params.fisherAdvantageEnabled || false);
    $('#redirect-url').val(mw.params.redirectURL);
    $('#enable-clean-abort').prop('checked', mw.params.cleanAbortEnabled || false);
    maybeDisableCleanAbortControls(mw.params.cleanAbortEnabled || false);
    $('#read-rules-timeout').val(mw.params.readRulesTimeout != null ? mw.params.readRulesTimeout : 0);
    $('#lobby-wait-timeout').val(mw.params.lobbyWaitTimeout != null ? mw.params.lobbyWaitTimeout : 0);
    $('#prompt-timeout').val(mw.params.promptTimeout || '');
    $('#max-timeouts').val(mw.params.maxTimeouts || '');
    $('#abort-url').val(mw.params.abortUrl || '');
    $('#abort-reading-rules-text').val(mw.params.abortReadingRulesText || '');
    $('#abort-lobby-wait-text').val(mw.params.abortLobbyWaitText || '');
    $('#force-abort-text').val(mw.params.forceAbortText || '');
    $('#change-ocean-colour').prop('checked', mw.params.enableRespawnWarning);
    $('#hide-ocean').prop('checked', mw.params.hideOcean || false);
    // On unless switched off (older microworlds don't have the setting)
    $('#show-fish-value-notice').prop('checked', mw.params.showFishValueNotice !== false);
    $('#show-game-clock').prop('checked', mw.params.showGameClock || false);
    // Older microworlds have none of these; the defaults match the model's
    $('#enable-disconnect-handling').prop('checked', mw.params.disconnectHandlingEnabled || false);
    $('#disconnect-grace-period').val(mw.params.disconnectGracePeriod || 30);
    $('#disconnect-during-grace').val(mw.params.disconnectDuringGrace || 'pause');
    $('#disconnects-allowed').val(mw.params.disconnectsAllowed !== undefined ? mw.params.disconnectsAllowed : 3);
    $('#disconnect-lost-action').val(mw.params.disconnectLostAction || 'end');
    showDisconnectOptions(mw.params.disconnectHandlingEnabled || false);
    $('#disable-profit-season').prop('checked', mw.params.profitSeasonDisabled);
    $('#disable-profit-total').prop('checked', mw.params.profitTotalDisabled);
    $('#enable-profit-gap').prop('checked', !mw.params.profitGapDisabled);
    maybeDisableProfitControls(
        mw.params.profitSeasonDisabled &&
        mw.params.profitTotalDisabled &&
        mw.params.profitGapDisabled
    );
    $('#fish-value').val(mw.params.fishValue);
    $('#cost-cast').val(mw.params.costCast);
    $('#cost-departure').val(mw.params.costDeparture);
    $('#cost-second').val(mw.params.costSecond);
    $('#currency-symbol').val(mw.params.currencySymbol);
    $('#certain-fish').val(mw.params.certainFish);
    $('#available-mystery-fish').val(mw.params.availableMysteryFish);
    $('#reported-mystery-fish').val(mw.params.reportedMysteryFish);
    $('#max-fish').val(mw.params.maxFish);
    $('#spawn-factor').val(mw.params.spawnFactor);
    $('#chance-catch').val(mw.params.chanceCatch);
    $('#preparation-text').val(mw.params.preparationText);
    $('#end-time-text').val(mw.params.endTimeText);
    $('#end-depletion-text').val(mw.params.endDepletionText);
    $('#show-fishers').prop('checked', mw.params.showFishers);
    $('#show-fisher-names').prop('checked', mw.params.showFisherNames);
    $('#show-fisher-status').prop('checked', mw.params.showFisherStatus);
    $('#show-num-caught').prop('checked', mw.params.showNumCaught);
    $('#show-fisher-balance').prop('checked', mw.params.showFisherBalance);

    $('#uniform-greed').prop('checked', false);
    $('#uniform-greed-spread').prop('checked', false);
    $('#uniform-trend').prop('checked', false);
    $('#uniform-predictability').prop('checked', false);
    $('#uniform-prob-action').prop('checked', false);
    $('#uniform-attempts-second').prop('checked', false);

    updateBotClassDropdowns();

    for (var i = 1; i <= mw.params.numFishers - mw.params.numHumans; i++) {
        var botPrefix = '#bot-' + i + '-';
        $(botPrefix + 'name').val(mw.params.bots[i - 1].name);
        $(botPrefix + 'greed').val(mw.params.bots[i - 1].greed);
        $(botPrefix + 'greed-spread').val(mw.params.bots[i - 1].greedSpread);
        $(botPrefix + 'trend').val(mw.params.bots[i - 1].trend);
        $(botPrefix + 'predictability').val(mw.params.bots[i - 1].predictability);
        $(botPrefix + 'prob-action').val(mw.params.bots[i - 1].probAction);
        $(botPrefix + 'attempts-second').val(mw.params.bots[i - 1].attemptsSecond);
        $(botPrefix + 'class').val(mw.params.bots[i - 1].fClass);
        $(botPrefix + 'advantage').val(mw.params.bots[i - 1].fHasAdvantage ? 'yes' : 'no');
    }

    $("#" + mw.params.oceanOrder).prop('checked', true);

    changeBotRowVisibility();
}

function maybeDisableCatchIntentControls(enabledflg) {
    if (enabledflg) {
        $('.catch-intention-option').removeClass('hide');
    } else {
        $('.catch-intention-option').addClass('hide');
    }
}

function showDisconnectOptions(enabledflg) {
    if (enabledflg) {
        $('.disconnect-option').removeClass('hide');
    } else {
        $('.disconnect-option').addClass('hide');
    }
}

function maybeDisableFisherClassControls(enabledflg) {
    if (enabledflg) {
        $('.fisher-class-option').removeClass('hide');
    } else {
        $('.fisher-class-option').addClass('hide');
    }
}

// Parse a comma-separated string into an array of trimmed non-empty strings
function parseCommaSeparatedList(str) {
    if (!str || str.trim() === '') {
        return [];
    }
    return str.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; });
}

// Capitalize a string: first letter uppercase, rest lowercase
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Capitalize each word in a string
function capitalizeWords(str) {
    if (!str) return '';
    return str.split(/\s+/).map(capitalize).join(' ');
}

// Parse fisher class names: returns an array of capitalized class names
function parseFisherClassNames(str) {
    var names = parseCommaSeparatedList(str);
    if (names.length === 0) {
        return ['Female', 'Male'];
    }
    return names.map(capitalizeWords);
}

// Convert fisher class names array to comma-separated string for display
function fisherClassNamesToString(names) {
    if (!names || !Array.isArray(names) || names.length === 0) {
        return 'Female, Male';
    }
    return names.join(', ');
}

// Parse fisher class counts: returns an object indexed by class name
// classNames should be an array of class names
function parseFisherClassCounts(str, classNames) {
    var parts = parseCommaSeparatedList(str);
    var counts = {};
    for (var i = 0; i < parts.length; i++) {
        var num = parseInt(parts[i], 10);
        if (isNaN(num) || num <= 0) {
            return null; // Invalid
        }
        var className = classNames && classNames[i] ? classNames[i] : ('Class ' + (i + 1));
        counts[className] = num;
    }
    return counts;
}

// Convert fisher class counts object to comma-separated string for display
function fisherClassCountsToString(counts, classNames) {
    if (!counts || typeof counts !== 'object') {
        return '2, 2';
    }
    if (classNames && Array.isArray(classNames)) {
        return classNames.map(function(name) { return counts[name] || 0; }).join(', ');
    }
    return Object.values(counts).join(', ');
}

// Parse fisher class emojis: returns an object indexed by class name
function parseFisherClassEmojis(str, classNames) {
    var parts = parseCommaSeparatedList(str);
    var emojis = {};
    for (var i = 0; i < parts.length; i++) {
        var className = classNames && classNames[i] ? classNames[i] : ('Class ' + (i + 1));
        emojis[className] = parts[i];
    }
    return emojis;
}

// Convert fisher class emojis object to comma-separated string for display
function fisherClassEmojisToString(emojis, classNames) {
    if (!emojis || typeof emojis !== 'object') {
        return '♀︎, ♂︎';
    }
    if (classNames && Array.isArray(classNames)) {
        return classNames.map(function(name) { return emojis[name] || ''; }).join(', ');
    }
    return Object.values(emojis).join(', ');
}

function maybeDisableFisherAdvantageControls(enabledflg) {
    if (enabledflg) {
        $('.fisher-advantage-option').removeClass('hide');
    } else {
        $('.fisher-advantage-option').addClass('hide');
    }
}

function maybeDisableCleanAbortControls(enabledflg) {
    if (enabledflg) {
        $('.clean-abort-option').removeClass('hide');
    } else {
        $('.clean-abort-option').addClass('hide');
        $('#read-rules-timeout').val(0);
        $('#lobby-wait-timeout').val(0);
    }
}

function maybeDisableProfitControls(disabledflg) {
    $('#show-fisher-balance').prop("disabled", disabledflg);
}

function noMicroworld(jqXHR) {
    alert(jqXHR.responseText);
}

function gotMicroworld(m) {
    mw = m;
    mode = mw.status;
    populatePage();
    prepareControls();
}

function getMicroworld() {
    $.ajax({
        type: 'GET',
        url: '/microworlds/' + mwId,
        error: noMicroworld,
        success: gotMicroworld
    });
}

function noRuns(jqXHR) {
    alert(jqXHR.responseText);
}

function gotRuns(r) {
    var table = '';
    for (var i in r) {
        var button = '<button class="btn btn-sm btn-info" type="submit" onclick=location.href=\'/runs/' + r[i]._id +
            '?csv=true\'>Download   <span class="glyphicon glyphicon-download-alt"></span></button>';
        table += '<tr><td><a href="../runs/' + r[i]._id + '">' + moment(r[i].time).format('llll') + '</a></td>' +
            '<td>' + r[i].participants + '</td>' + '<td>' + button + '</tr>';
    }

    $('#microworld-runs-table-rows').html(table);

    // enabled or disable the download all button depending on if there are any completed runs
    if (r.length == 0) {
        $('#download-all-button').prop("disabled", "disabled");
    } else {
        $('#download-all-button').removeAttr("disabled");
    }

    setTimeout(getRuns, 60000);
}

function getRuns() {
    $.ajax({
        type: 'GET',
        url: '/runs/?mw=' + mwId,
        error: noRuns,
        success: gotRuns
    });
}

function backToList() {
    location.href = '../dashboard';
}

// Makes downloading all runs possible
function initDownloadAll() {
    $('#download-all-button').attr("onclick", "location.href='/runs?csv=true&mw=" + mwId + "'");
}

function setButtons() {
    $('#create').click(createMicroworld);
    $('#create-2').click(createMicroworld);
    $('#save').click(saveMicroworld);
    $('#save-2').click(saveMicroworld);
    $('#cancel').click(backToList);
    $('#cancel-2').click(backToList);

    $('#clone-confirmed').click(cloneMicroworld)
    $('#activate-confirmed').click(activateMicroworld);
    $('#archive-confirmed').click(archiveMicroworld);
    $('#delete-confirmed').click(deleteMicroworld);
    $(".behaviour_group_select").click(showStatusTableOptions);

    $('#show-catch-intentions-explanation').click(showCatchIntentionsExplanationText);
    $('#show-redirect-explanation').click(showRedirectExplanationText);
    $('#show-fisher-classes-explanation').click(showFisherClassesExplanationText);
    $('#show-fisher-advantage-explanation').click(showFisherAdvantageExplanationText);
    $('#show-clean-abort-explanation').click(showCleanAbortExplanationText);
    $('#show-disconnects-explanation').click(showDisconnectsExplanationText);

    initDownloadAll();
}

function setOnPageChanges() {
    $('#num-fishers').on('change', changeBotRowVisibility);
    $('#num-humans').on('change', changeBotRowVisibility);
    $('#uniform-greed').on('change', changeGreedUniformity);
    $('#bot-1-greed').on('input', changeGreedUniformity);
    $('#uniform-greed-spread').on('change', changeGreedSpreadUniformity);
    $('#bot-1-greed-spread').on('input', changeGreedSpreadUniformity);
    $('#uniform-trend').on('change', changeTrendUniformity);
    $('#bot-1-trend').on('change', changeTrendUniformity);
    $('#uniform-predictability').on('change', changePredictabilityUniformity);
    $('#bot-1-predictability').on('change', changePredictabilityUniformity);
    $('#uniform-prob-action').on('change', changeProbActionUniformity);
    $('#bot-1-prob-action').on('input', changeProbActionUniformity);
    $('#uniform-attempts-second').on('change', changeAttemptsSecondUniformity);
    $('#bot-1-attempts-second').on('input', changeAttemptsSecondUniformity);
    $('#fisher-class-names').on('change blur', updateBotClassDropdowns);
}

function loadTexts() {
    $('#preparation-text').val(prepText);
    $('#end-time-text').val(endTimeText);
    $('#end-depletion-text').val(endDepletedText);
    $('#catch-intent-prompt1').val(catchIntentPrompt1);
    $('#catch-intent-prompt2').val(catchIntentPrompt2);
}

function prepareControls() {
    $('#microworld-panel-body-text').text(panelBody[mode]);
    $('#microworld-panel-2-body-text').text(panelBody[mode]);
    $('#enable-catch-intentions').on("click", function () {
        //Dis- or enable the other CatchIntention controls depending on whether the checkbox is checked.
        var enabledflg = $(this).is(':checked');
        maybeDisableCatchIntentControls(enabledflg);
    });
    $('#enable-disconnect-handling').on('click', function () {
        showDisconnectOptions($(this).is(':checked'));
    });
    $('#enable-fisher-classes').on("click", function () {
        //Dis- or enable the fisher class controls depending on whether the checkbox is checked.
        var enabledflg = $(this).is(':checked');
        maybeDisableFisherClassControls(enabledflg);
        if (enabledflg) updateBotClassDropdowns();
    });
    $('#enable-fisher-advantage').on("click", function () {
        var enabledflg = $(this).is(':checked');
        maybeDisableFisherAdvantageControls(enabledflg);
    });
    $('#enable-clean-abort').on("click", function () {
        maybeDisableCleanAbortControls($(this).is(':checked'));
    });
    function onProfitCheckboxChange() {
        var allDisabled =
            $('#disable-profit-season').is(':checked') &&
            $('#disable-profit-total').is(':checked') &&
            !$('#enable-profit-gap').is(':checked');
        maybeDisableProfitControls(allDisabled);
    }
    $('#disable-profit-season').on("click", onProfitCheckboxChange);
    $('#disable-profit-total').on("click", onProfitCheckboxChange);
    $('#enable-profit-gap').on("click", onProfitCheckboxChange);
    if (mode === 'new') {
        $('#microworld-header').text(pageHeader[mode]);
        $('#microworld-panel-title').text(panelTitle[mode]);
        $('#microworld-panel-2-title').text(panelTitle[mode]);
        loadTexts();
        $('#create').removeClass('collapse');
        $('#create-2').removeClass('collapse');
        $("#ocean_order_user_top").prop("checked", true);
        updateBotClassDropdowns();
        uniformityChanges();
    } else if (mode === 'test') {
        $('title').text('Fish - Microworld in Test');
        $('#microworld-header').text(pageHeader[mode] + mw.code);
        $('#microworld-panel-title').text(panelTitle[mode] + mw.code);
        $('#microworld-panel-2-title').text(panelTitle[mode] + mw.code);
        $('#save').removeClass('collapse');
        $('#save-2').removeClass('collapse');
        $('#clone').removeClass('collapse');
        $('#clone-2').removeClass('collapse');
        $('#activate').removeClass('collapse');
        $('#activate-2').removeClass('collapse');
        $('#delete').removeClass('collapse');
        $('#delete-2').removeClass('collapse');

        if ($('input[type="radio"]:checked').parent().parent().hasClass('dynamic_option')) {
            $(".static_option").addClass('hide');
            $(".dynamic_option").removeClass("hide");
            $('span#btn_txt').text("Dynamic Behaviour\xa0\xa0"); //\xa0 is the char &nbsp; makes
        }

        uniformityChanges();
    } else if (mode === 'active') {
        $('title').text('Fish - Active Microworld');
        $('#microworld-header').text(pageHeader[mode] + mw.code);
        $('#microworld-panel-title').text(panelTitle[mode] + mw.code);
        $('#microworld-panel-2-title').text(panelTitle[mode] + mw.code);
        $('#clone').removeClass('collapse');
        $('#clone-2').removeClass('collapse');
        $('#archive').removeClass('collapse');
        $('#archive-2').removeClass('collapse');
        $('#delete').removeClass('collapse');
        $('#delete-2').removeClass('collapse');
        $('.to-disable').each(function () {
            $(this).prop('disabled', true);
        });
        $('#results').removeClass('collapse');
        $(".dynamic_option").removeClass("hide");
    } else if (mode === 'archived') {
        $('title').text('Fish - Archived Microworld');
        $('#microworld-header').text(pageHeader[mode]);
        $('#microworld-panel-title').text(panelTitle[mode]);
        $('#microworld-panel-2-title').text(panelTitle[mode]);
        $('#clone').removeClass('collapse');
        $('#clone-2').removeClass('collapse');
        $('#activate').removeClass('collapse');
        $('#activate-2').removeClass('collapse');
        $('#delete').removeClass('collapse');
        $('#delete-2').removeClass('collapse');
        $('.to-disable').each(function () {
            $(this).prop('disabled', true);
        });
        $('#results').removeClass('collapse');
        $(".dynamic_option").removeClass("hide");
    }
}

function loadData() {
    if (isNewMicroworld()) {
        mode = 'new';
        prepareControls();
    } else {
        getMicroworld(); // will eventually call prepareControls()
        getRuns();
    }
}

function uniformityChanges() {
    changeGreedUniformity();
    changeGreedSpreadUniformity();
    changeTrendUniformity();
    changePredictabilityUniformity();
    changeProbActionUniformity();
    changeAttemptsSecondUniformity();
}

// CATCH INTENTIONS FEATURE

function showCatchIntentionsExplanationText() {
    $('#explain-catch-intentions-content').load('/explain-catch-intentions', function () {
        $('#explain-catch-intentions-modal').modal({ show: true });
    });
    $('#explain-catch-intentions-modal').modal({ keyboard: false, backdrop: 'static' });
}

// FISHER CLASSES FEATURE

function showFisherClassesExplanationText() {
    $('#explain-fisher-classes-content').load('/explain-fisher-classes', function () {
        $('#explain-fisher-classes-modal').modal({ show: true });
    });
    $('#explain-fisher-classes-modal').modal({ keyboard: false, backdrop: 'static' });
}


// CLEAN ABORT FEATURE

function showCleanAbortExplanationText() {
    $('#explain-clean-abort-content').load('/explain-clean-abort', function () {
        $('#explain-clean-abort-modal').modal({ show: true });
    });
    $('#explain-clean-abort-modal').modal({ keyboard: false, backdrop: 'static' });
}

// DISCONNECT HANDLING FEATURE

function showDisconnectsExplanationText() {
    $('#explain-disconnects-content').load('/explain-disconnects', function () {
        $('#explain-disconnects-modal').modal({ show: true });
    });
    $('#explain-disconnects-modal').modal({ keyboard: false, backdrop: 'static' });
}

// FISHER ADVANTAGE FEATURE

function showFisherAdvantageExplanationText() {
    $('#explain-fisher-advantage-content').load('/explain-fisher-advantage', function () {
        $('#explain-fisher-advantage-modal').modal({ show: true });
    });
    $('#explain-fisher-advantage-modal').modal({ keyboard: false, backdrop: 'static' });
}

// REDIRECTION FEATURE

function showRedirectExplanationText() {
    $('#explain-redirect-content').load('/explain-redirection', function () {
        $('#explain-redirect-modal').modal({ show: true });
    });
    $('#explain-redirect-modal').modal({ keyboard: false, backdrop: 'static' });
}



function main() {
    getMwId();
    isNewMicroworld()
    readyTooltips();
    setButtons();
    setOnPageChanges();
    loadData();
}

$(document).ready(main);
