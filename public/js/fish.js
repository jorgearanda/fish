'use strict';
/* global io:true, langs:true */

var lang = $.url().param('lang');
var msgs;
var socket = io.connect();

// Register a server-message handler. An error escaping a handler can stall
// the whole connection (right after connecting, messages arrive bundled and
// the rest of the bundle, and all later traffic, is lost), so log it instead.
function listen(event, handler) {
    socket.on(event, function () {
        try {
            return handler.apply(this, arguments);
        } catch (err) {
            console.error('Error handling "' + event + '" from the server:', err);
        }
    });
}

var mwId = $.url().param('mwid');
var pId = $.url().param('pid');
var pParams = {
    pDisplay: $.url().param('pdisplay'),
    fClass: $.url().param('fclass'),
    fHasAdvantage: parseHasAdvantage($.url().param('fhasadvantage'))
};
var ocean;
var prePauseButtonsState = {};

var oCanvas, oContext;
// Ocean images load only when the microworld shows the ocean (see applyOceanVisibility)
var underwater = new Image();
var underwaterDying = new Image();
var fishImage = new Image();
var mysteryFishImage = new Image();

function loadOceanImages() {
    if (underwater.src) return;
    underwater.src = 'public/img/underwater.jpg';
    underwaterDying.src = 'public/img/underwater-dying.jpg';
    fishImage.src = 'public/img/certain-fish.png';
    mysteryFishImage.src = 'public/img/mystery-fish.png';
}

var st = { status: 'loading' };

// Parse fhasadvantage URL parameter to boolean
function parseHasAdvantage(value) {
    if (value === undefined) return false;  // Not in URL = false
    if (value === '' || value === null) return true;  // In URL with no value = true
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return false;  // Invalid value = false
}

// Get the fish value for a fisher, accounting for advantage.
function getEffectiveFishValue(fisher) {
    var base = ocean.fishValue;
    if (ocean.fisherAdvantageEnabled && fisher.params && fisher.params.fHasAdvantage) {
        base += (ocean.fishValuePayGap || 0);
    }
    return base;
}

// Get the fish value and costs used by the "other class" of fisher (with or without advantage).
function getOtherClassParams(currentFisher) {
    var currentHasAdvantage = ocean.fisherAdvantageEnabled &&
        currentFisher.params && currentFisher.params.fHasAdvantage;
    if (currentHasAdvantage) {
        return {
            fishValue: ocean.fishValue,
            costCast: ocean.costCast,
            costDeparture: ocean.costDeparture,
            costSecond: ocean.costSecond
        };
    } else {
        return {
            fishValue: ocean.fishValue + (ocean.fishValuePayGap || 0),
            costCast: ocean.costCast - (ocean.costCastReduction || 0),
            costDeparture: ocean.costDeparture - (ocean.costDepartureReduction || 0),
            costSecond: ocean.costSecond - (ocean.costSecondReduction || 0)
        };
    }
}

// Compute profit gap: actual (net) money minus hypothetical (net) money the fisher
// would have earned for the same fishing activity (casts, departures, seconds at
// sea, fish caught) under the other class's fish value and costs.
function computeProfitGap(fisher) {
    var other = getOtherClassParams(fisher);
    var hypotheticalMoney = (fisher.totalFishCaught * other.fishValue) -
        ((fisher.totalCasts || 0) * other.costCast) -
        ((fisher.totalDepartures || 0) * other.costDeparture) -
        ((fisher.totalSecondsAtSea || 0) * other.costSecond);
    return (fisher.money - hypotheticalMoney).toFixed(2);
}

// Display a profit-gap value with sign prefix and color
function displayProfitGap($cell, value) {
    var num = parseFloat(value);
    var text = num > 0 ? '+' + value : value;
    var color = num > 0 ? 'navy' : (num < 0 ? 'crimson' : '');
    $cell.text(text);
    $cell.css('color', color);
}

if (lang && lang !== '' && lang.toLowerCase() in langs) {
    lang = lang.toLowerCase();
    msgs = langs[lang];
} else {
    msgs = langs.en;
    lang = 'en';
}

////////////////////////////////////////
//////////// Catch Intentions feature 
////////////////////////////////////////

function showCatchIntentColumn(season) {
    var headerText = ' ' + msgs.info_intent;
    if (season) headerText += ' ' + season;
    $('#catch-intent-header').text(headerText);
    $('#catch-intent-th').show();
    for (var i in st.fishers) {
        $('#f' + i + '-catch-intent').show();
    }
}

function hideCatchIntentColumn() {
    $('#catch-intent-th').hide();
    for (var i in st.fishers) {
        $('#f' + i + '-catch-intent').hide();
    }
}

var myCatchIntent = 'n/a';
var myCatchIntentSubmitted = false;
var myCatchIntentDisplaySeason = 0;
var myCatchIntentDialogConfigured = false;

function showCatchIntentDialog() {
    if (!myCatchIntentDialogConfigured) {
        $('#catch-intent-prompt1').text(ocean.catchIntentPrompt1);
        if (ocean.catchIntentPrompt2.length > 0) {
            $('#catch-intent-prompt2').text(ocean.catchIntentPrompt2);
            $('#catch-intent-prompt2').show();
        }
        else {
            $('#catch-intent-prompt2').hide();
        }
        // emitter.on() is cumulative! And showCatchIntentDialog() could be called multiple times...
        // https://nodejs.org/api/events.html#emitteroneventname-listener
        // NOTE: This is NOT the same as .once() !!!
        $('#catch-intent-input').on('keydown', function (e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                recordMyCatchIntent();
            }
        });
        $('#catch-intent-submit').on('click', recordMyCatchIntent);
        myCatchIntentDialogConfigured = true;
    }
    $('#catch-intent-input').val("");
    $('#catch-intent-submit').show();
    $('#catch-intent-dialog-box').show();
    $('#catch-intent-input').trigger('focus');
}

function hideCatchIntentDialog() {
    $('#catch-intent-dialog-box').hide();
}

function checkCatchIntentDisplay() {
    var season = myCatchIntentSubmitted ? st.catchIntentSeason : st.catchIntentDisplaySeason;
    if (season != myCatchIntentDisplaySeason) {
        if (season == 0) {
            hideCatchIntentColumn();
        } else {
            showCatchIntentColumn(season);
        }
        myCatchIntentDisplaySeason = season;
    }
}


function startAskingIntendedCatch() {
    showCatchIntentDialog();
    myCatchIntent = '???';
    myCatchIntentSubmitted = false;
}

function stopAskingIntendedCatch() {
    hideCatchIntentDialog();
}

function recordMyCatchIntent() {
    var input = $('#catch-intent-input').val().trim();
    var num = parseInt(input);
    if (isNaN(num) || num < 0) {
        $('#catch-intent-input').val(myCatchIntent);
        // Leave dialog up in case fisher corrects typo and resubmits
    }
    else {
        myCatchIntent = num.toString();
        stopAskingIntendedCatch();
        submitMyCatchIntent();
    }
}

function submitMyCatchIntent() {
    socket.emit('recordIntendedCatch', myCatchIntent);
    myCatchIntentSubmitted = true;
}


////////////////////////////////////////
//////////// END Catch Intentions feature   (except for a few touch points below) 
////////////////////////////////////////

////////////////////////////////////////
//////////// START Profit Columns Display Feature     
////////////////////////////////////////

// Helper functions to check per-column profit display settings.
function isProfitSeasonDisabled() {
    return ocean.profitSeasonDisabled;
}
function isProfitTotalDisabled() {
    return ocean.profitTotalDisabled;
}
function isProfitGapDisabled() {
    return !ocean.fisherAdvantageEnabled || ocean.profitGapDisabled;
}
function areAllProfitColumnsDisabled() {
    return isProfitSeasonDisabled() && isProfitTotalDisabled() && isProfitGapDisabled();
}

// Per-column hide functions. Each hides its column header, table heading, and cells,
// and removes bootstro class to prevent tutorial overlay issues.

function hideProfitSeasonColumn() {
    $('#profit-season-header').hide().removeClass("bootstro");
    $('[id$="-profit-season"]').hide();
}

function hideProfitTotalColumn() {
    $('#profit-total-header').hide().removeClass("bootstro");
    $('[id$="-profit-total"]').hide();
}

function hideProfitGapColumn() {
    $('#profit-gap-header').hide().removeClass("bootstro");
    $('[id$="-profit-gap"]').hide();
}

function hideAllProfitExtras() {
    $("#costs-box").hide();
    $("#costs-box").removeClass("bootstro");
}

// Convenience wrapper that hides all profit columns and the costs box.
function hideProfitColumns() {
    hideProfitSeasonColumn();
    hideProfitTotalColumn();
    hideProfitGapColumn();
    hideAllProfitExtras();
}

////////////////////////////////////////
//////////// END Profit Colum Display Feature   (eadditional points below and related to showFisherBalance) 
////////////////////////////////////////



// With a 100% catch chance every cast succeeds, so the button says "Catch a fish"
function isCatchCertain() {
    return !!(ocean && ocean.chanceCatch >= 1);
}

function loadLabels() {
    $('#read-rules').text(msgs.buttons_goFishing);
    $('#changeLocation').html(msgs.buttons_goToSea);
    $('#attempt-fish').html(isCatchCertain() ? msgs.buttons_catchFish : msgs.buttons_castFish);
    $('#pause').html(msgs.buttons_pause);
    $('#resume').html(msgs.buttons_resume);

    $('#fisher-header').text(msgs.info_fisher);
    $('#catch-intent-header').text(' ' + msgs.info_intent);
    $('#fish-season-header').text(' ' + msgs.info_season);
    $('#fish-total-header').text(' ' + msgs.info_overall);

    $('#lobby-status-header').text(msgs.lobby_header);
    $('#lobby-waiting-header').text(msgs.lobby_headerWaiting);

    $('#abort-keep-reading').text(msgs.abort_keepReading);
    $('#abort-proceed').text(msgs.abort_proceed);
    $('#abort-keep-waiting').text(msgs.abort_keepWaiting);
    $('#abort-confirm').text(msgs.abort_abort);

    if (!ocean) return;
    $('#profit-season-header').text(ocean.currencySymbol + ' ' + msgs.info_season);
    $('#profit-total-header').text(ocean.currencySymbol + ' ' + msgs.info_overall);
    $('#profit-gap-header').text(ocean.currencySymbol + ' ' + msgs.info_payGap);

    updateCosts();
    updateStatus();
}

// The rows MixItUp shows: a selector, so each filter run checks the rows'
// current state (a fixed set of rows would keep a departed fisher's row)
var ACTIVE_FISHER_ROWS = 'tr[active-fisher]';

function initializeMixItUp() {
    var $container = $("#fishers-tbody");
    $container.mixItUp({
        selectors: {
            target: 'tr'
        },
        layout: {
            display: 'table-row'
        },
        load: {
            filter: ACTIVE_FISHER_ROWS
        }
    });
}

function disableButtons() {
    $('#changeLocation').attr('disabled', 'disabled');
    $('#attempt-fish').attr('disabled', 'disabled');
    $('#pause').attr('disabled', 'disabled');
}

function updateRulesText() {
    var prepText = ocean.preparationText.replace(/\n/g, '<br />');
    $('#rules-text').html(prepText);
}

function displayRules() {
    updateRulesText();
    $('#rules-modal').modal({ keyboard: false, backdrop: 'static' });
}

////////////////////////////////////////
//////////// Status bar
//////////// Line 1 (#status-label): the phase, plus the clock if the microworld shows it.
//////////// Line 2 (#status-sub-label): the fish count and the like, or a notice: a
//////////// warning that needs the participant's attention soon, on a red background.
////////////////////////////////////////

// The notice on line 2, if any: { kind, text }. Kinds: 'season' (season
// starting/ending), 'disconnect' (waiting for a player), 'resuming'. One at a
// time; the latest wins, and each kind clears only its own.
var currentNotice = null;

function showNotice(kind, text) {
    currentNotice = { kind: kind, text: text };
    renderStatusLine2();
}

function clearNotice(kind) {
    if (!currentNotice || (kind && currentNotice.kind !== kind)) return;
    currentNotice = null;
    renderStatusLine2();
}

// Time left in the current phase, e.g. "00:42", if the microworld shows a
// clock and the phase has one; '' otherwise
function clockText() {
    if (!ocean || !ocean.showGameClock) return '';
    if (typeof st.phaseLength !== 'number' || typeof st.seconds !== 'number') return '';
    return formatMmSs(Math.max(0, st.phaseLength - st.seconds));
}

function fishCountHtml() {
    if (typeof st.certainFish !== 'number') return '';
    if (st.reportedMysteryFish > 0) {
        return st.certainFish + msgs.status_fishTo + (st.certainFish + st.reportedMysteryFish) +
            '<i class="icon-fish"></i>' + msgs.status_fishRemaining;
    }
    return st.certainFish + '<i class="icon-fish"></i>' + msgs.status_fishRemaining;
}

// Line 2 without a notice; null hides it
function statusLine2Html() {
    if (st.status === 'loading') return msgs.status_subWait + ' <i class="icon-spin animate-spin"></i>';
    if (st.status === 'initial delay') return msgs.status_getReady;
    if (st.status === 'resting') return msgs.status_subSpawning;
    if (st.status === 'running' || st.status === 'paused') return fishCountHtml();
    return null;
}

function renderStatusLine2() {
    var $line = $('#status-sub-label');
    if (currentNotice) {
        $line.text(currentNotice.text);
        $line.addClass('status-notice');
        $line.show();
        return;
    }
    $line.removeClass('status-notice');
    var html = statusLine2Html();
    if (html === null) {
        $line.hide();
    } else {
        $line.html(html);
        $line.show();
    }
}

function updateStatus() {
    var statusText = '';
    var clock = '';
    if (st.status === 'loading') {
        statusText = msgs.status_wait;
    } else if (st.status === 'initial delay') {
        statusText = msgs.status_starting;
        clock = clockText();
    } else if (st.status === 'running') {
        statusText = msgs.status_season + st.season;
        clock = clockText();
    } else if (st.status === 'resting') {
        statusText = msgs.status_spawning;
        clock = clockText();
    } else if (st.status === 'paused') {
        statusText = msgs.status_paused;
        clock = clockText(); // shows where it stopped
    } else if (st.status === 'over') {
        statusText = msgs.end_over;
    }
    checkCatchIntentDisplay(st.catchIntentDisplaySeason);
    // The message centred on the left; the clock, if any, in its own box on the right
    $('#status-label').html('<span class="status-text">' + statusText + '</span>' +
        (clock ? '<span class="status-clock">' + clock + '</span>' : ''));

    // The server counts down before play resumes after a pause
    if (typeof st.resumingIn === 'number' && st.resumingIn > 0) {
        // Nothing holds the game any more; Resume would do nothing now
        manualPauseActive = false;
        $('#resume').hide();
        showNotice('resuming', msgs.warning_resuming.replace('{seconds}', st.resumingIn));
    } else {
        clearNotice('resuming');
        renderStatusLine2();
    }
}

function updateWarning(warn) {
    if (warn === 'start') {
        showNotice('season', !st.season ? msgs.status_getReady : msgs.warning_seasonStart);
    } else if (warn === 'end') {
        showNotice('season', msgs.warning_seasonEnd);
    } else {
        clearNotice('season');
    }
}

function clearWarnings() {
    clearNotice();
}

function updateCosts() {
    if (!ocean) return;

    var displayFishValue = ocean.fishValue;
    if (ocean.fisherAdvantageEnabled && pParams.fHasAdvantage) {
        displayFishValue += (ocean.fishValuePayGap || 0);
    }
    // Shown unless the microworld switches it off (older microworlds don't have the setting)
    if (ocean.showFishValueNotice !== false && displayFishValue !== 0) {
        $('#revenue-fish').text(msgs.costs_fishValue + ' ' +
            ocean.currencySymbol + displayFishValue).show();
    } else {
        $('#revenue-fish').hide();
    }

    var hasAdvantage = ocean.fisherAdvantageEnabled && pParams.fHasAdvantage;

    var displayCostDeparture = ocean.costDeparture;
    if (hasAdvantage) {
        displayCostDeparture -= (ocean.costDepartureReduction || 0);
    }
    if (displayCostDeparture !== 0) {
        $('#cost-departure').text(msgs.costs_costLeave + ' ' +
            ocean.currencySymbol + displayCostDeparture);
    } else {
        $('#cost-departure').hide();
    }

    var displayCostCast = ocean.costCast;
    if (hasAdvantage) {
        displayCostCast -= (ocean.costCastReduction || 0);
    }
    if (displayCostCast !== 0) {
        $('#cost-cast').text(msgs.costs_costCast + ' ' +
            ocean.currencySymbol + displayCostCast);
    } else {
        $('#cost-cast').hide();
    }

    var displayCostSecond = ocean.costSecond;
    if (hasAdvantage) {
        displayCostSecond -= (ocean.costSecondReduction || 0);
    }
    if (displayCostSecond !== 0) {
        $('#cost-second').text(msgs.costs_costSecond + ' ' +
            ocean.currencySymbol + displayCostSecond);
    } else {
        $('#cost-second').hide();
    }
}

function updateFishers() {
    var j = 1;
    var name;
    var catchIntent;
    var fishSeason;
    var fishTotal;
    var profitSeason;
    var profitTotal;

    for (var i in st.fishers) {
        var fisher = st.fishers[i];
        var fisherClass = ocean.fisherClassesEnabled && fisher.params && fisher.params.fClass;
        var classEmoji = fisherClass && ocean.fisherClassEmojis && ocean.fisherClassEmojis[fisherClass] ? ocean.fisherClassEmojis[fisherClass] : '';
        var advantageEmoji = '';
        if (ocean.fisherAdvantageEnabled && fisher.params) {
            advantageEmoji = fisher.params.fHasAdvantage
                ? (ocean.advantageEmoji || '')
                : (ocean.disadvantageEmoji || '');
        }
        var emojiList = [classEmoji, advantageEmoji].filter(Boolean);
        var iconsHtml = emojiList.map(function (e) {
            return '<span style="display:inline-block;width:1.5em;text-align:center">' +
                $('<span>').text(e).html() + '</span>';
        }).join('');

        if (fisher.name === pId) {
            // This is you
            var nameHtml = $('<span>').text(msgs.info_you).html();
            name = iconsHtml ? iconsHtml + ' ' + msgs.info_you : msgs.info_you;
            $('#f0-name').html(iconsHtml ? iconsHtml + ' ' + nameHtml : nameHtml);

            if (fisher.status === 'At port') {
                $('#f0-status').attr('src', '/public/img/anchor.png');
            } else {
                $('#f0-status').attr('src', '/public/img/world.png');
            }

            if (myCatchIntentDisplaySeason > st.season) {
                catchIntent = fisher.seasonData[st.season].nextCatchIntent;
            }
            else {
                catchIntent = fisher.seasonData[st.season].catchIntent;
            }
            fishSeason = fisher.seasonData[st.season].fishCaught;
            fishTotal = fisher.totalFishCaught;
            profitSeason = fisher.seasonData[st.season].endMoney.toFixed(2);
            profitTotal = fisher.money.toFixed(2);

            // REDIRECTION FEATURE - provide fish caught and earnings on redirect return
            queryParams['fishTotal'] = fishTotal.toString();
            queryParams['profitTotal'] = profitTotal.toString();


            $('#f0-catch-intent').text(catchIntent);
            $('#f0-fish-season').text(fishSeason);
            $('#f0-fish-total').text(fishTotal);
            if (!isProfitSeasonDisabled()) {
                $('#f0-profit-season').text(profitSeason);
            }
            if (!isProfitTotalDisabled()) {
                $('#f0-profit-total').text(profitTotal);
            }
            if (!isProfitGapDisabled()) {
                var profitGap = computeProfitGap(fisher);
                displayProfitGap($('#f0-profit-gap'), profitGap);
                $('#f0').attr('data-profit-gap', profitGap);
            }

            $('#f0').attr('data-fish-total', fishTotal);
            $('#f0').attr('data-fish-season', fishSeason);
            $('#f0').attr('data-profit-total', profitTotal);
            $('#f0').attr('data-profit-season', profitSeason);
            $('#f0').attr('data-name', name);
            $('#f0').attr('active-fisher', true);
        } else {
            // Everyone else
            if (!ocean.showFishers) continue;

            $('#f' + j).show();
            if (ocean.showFisherNames) {
                var pDisplay = (fisher.params && fisher.params.pDisplay) || fisher.name;
                var nameHtml = $('<span>').text(pDisplay).html();
                name = iconsHtml ? iconsHtml + ' ' + pDisplay : pDisplay;
                $('#f' + j + '-name').html(iconsHtml ? iconsHtml + ' ' + nameHtml : nameHtml);
            } else {
                name = iconsHtml ? iconsHtml + ' ' + j : j;
                $('#f' + j + '-name').html(iconsHtml ? iconsHtml + ' ' + j : j);
            }

            var src = '';
            if (!ocean.showFisherStatus) {
                src = '/public/img/bullet_white.png';
            } else if (fisher.status === 'At port') {
                src = '/public/img/anchor.png';
            } else {
                src = '/public/img/world.png';
            }
            $('#f' + j + '-status').attr('src', src);

            if (myCatchIntentDisplaySeason > st.season) {
                catchIntent = fisher.seasonData[st.season].nextCatchIntent;
            }
            else {
                catchIntent = fisher.seasonData[st.season].catchIntent;
            }
            fishSeason = fisher.seasonData[st.season].fishCaught;
            fishTotal = fisher.totalFishCaught;
            profitSeason = fisher.seasonData[st.season].endMoney.toFixed(2);
            profitTotal = fisher.money.toFixed(2);

            $('#f' + j + '-catch-intent').text(catchIntent);

            if (ocean.showNumCaught) {
                $('#f' + j + '-fish-season').text(fishSeason);
                $('#f' + j + '-fish-total').text(fishTotal);
            } else {
                $('#f' + j + '-fish-season').text('?');
                $('#f' + j + '-fish-total').text('?');
            }

            if (!isProfitSeasonDisabled()) {
                if (ocean.showFisherBalance) {
                    $('#f' + j + '-profit-season').text(profitSeason);
                } else {
                    $('#f' + j + '-profit-season').text('?');
                }
            }
            if (!isProfitTotalDisabled()) {
                if (ocean.showFisherBalance) {
                    $('#f' + j + '-profit-total').text(profitTotal);
                } else {
                    $('#f' + j + '-profit-total').text('?');
                }
            }
            if (!isProfitGapDisabled()) {
                if (ocean.showFisherBalance) {
                    var profitGap = computeProfitGap(fisher);
                    displayProfitGap($('#f' + j + '-profit-gap'), profitGap);
                    $('#f' + j).attr('data-profit-gap', profitGap);
                } else {
                    $('#f' + j + '-profit-gap').text('?');
                }
            }

            $('#f' + j).attr('data-fish-total', fishTotal);
            $('#f' + j).attr('data-fish-season', fishSeason);
            $('#f' + j).attr('data-profit-total', profitTotal);
            $('#f' + j).attr('data-profit-season', profitSeason);
            $('#f' + j).attr('data-name', name);
            $('#f' + j).attr('active-fisher', true);

            j++;
        }
    }

    // Rows no longer in use because a fisher left mid-game: hide them and
    // take them out of the table's filter, or the departed fisher stays listed
    var cleared = false;
    var lastRow = $('#fishers-tbody tr').length - 1;
    for (var k = j; k <= lastRow; k++) {
        if ($('#f' + k).attr('active-fisher')) {
            $('#f' + k).removeAttr('active-fisher');
            $('#f' + k).hide();
            cleared = true;
        }
    }
    if (cleared) fisherTableNeedsRefilter = true;
}

// MixItUp keeps showing the rows it showed last until it is told to filter
// again, and it drops requests that arrive while it is busy animating (a sort
// runs every second). So after a fisher leaves, ask for a refilter on every
// update until MixItUp's callback confirms that one actually ran.
var fisherTableNeedsRefilter = false;

function refilterFisherTableIfNeeded($container) {
    if (!fisherTableNeedsRefilter) return;
    $container.mixItUp('filter', ACTIVE_FISHER_ROWS, true, function () {
        fisherTableNeedsRefilter = false;
    });
}


function sortFisherTable() {
    var $container = $("#fishers-tbody");
    // MixItUp throws if called before initializeMixItUp(). That happens when a
    // status update reaches a rejoining page before 'rejoined' does, and the
    // error then stalled the page's whole connection (no more messages either
    // way). Until the table is set up there is nothing to sort anyway.
    if (!$container.mixItUp || !$container.mixItUp('isLoaded')) return;
    refilterFisherTableIfNeeded($container);
    if (ocean.oceanOrder === "ocean_order_user_top") {
        $container.mixItUp('insert', 1, $("tr#f0"));
    }
    else if (ocean.oceanOrder === "ocean_order_user_mid") {
        $container.mixItUp('insert', ocean.numFishers / 2, $("tr#f0"));
    }
    else if (ocean.oceanOrder === "ocean_order_user_bot") {
        $container.mixItUp('insert', ocean.numFishers, $("tr#f0"));
    }
    else if (ocean.oceanOrder === "ocean_order_desc_fish_season") {
        $container.mixItUp('sort', 'fish-season:desc name:asc');
    }
    else if (ocean.oceanOrder === "ocean_order_desc_fish_overall") {
        $container.mixItUp('sort', 'fish-total:desc name:asc');
    }
    else if (ocean.oceanOrder === "ocean_order_desc_money_season") {
        $container.mixItUp('sort', 'profit-season:desc name:asc');
    }
    else if (ocean.oceanOrder === "ocean_order_desc_money_overall") {
        $container.mixItUp('sort', 'profit-total:desc profit-season:desc name:asc');
    }
}

function makeUnpausable() {
    if (!ocean.enablePause) {
        // Hide the whole column and let the other two buttons share its space
        $('#pause').hide();
        $('#pause-col').hide();
        $('.control-col').removeClass('col-xs-4').addClass('col-xs-6');
    }
}

function hideTutorial() {
    if (!ocean.enableTutorial) $('#tutorial').hide();
}

function validateFisherAdvantage() {
    if (!ocean.fisherAdvantageEnabled) {
        pParams.fHasAdvantage = false;
        return;
    }
}

////////////////////////////////////////
//////////// Device recording (saved with the run results; see src/engine/device-info.js)
////////////////////////////////////////

// phone / small tablet / large tablet by the screen's shorter side; anything
// with a mouse or trackpad counts as desktop
function getDeviceClass() {
    var touchOnly = !!(window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches);
    if (!touchOnly) return 'desktop';
    var shortSide = Math.min(window.screen.width, window.screen.height);
    if (shortSide < 600) return 'phone';
    if (shortSide < 800) return 'small tablet';
    return 'large tablet';
}

function collectDeviceInfo() {
    return {
        deviceClass: getDeviceClass(),
        userAgent: navigator.userAgent,
        touch: (navigator.maxTouchPoints || 0) > 0,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        pixelRatio: window.devicePixelRatio || 1,
        language: navigator.language || '',
    };
}

// Chrome-based browsers hide the phone model and real Android version from the
// user agent, but reveal them through Client Hints on request
function sendDeviceInfo() {
    var info = collectDeviceInfo();
    var uaData = navigator.userAgentData;
    if (!uaData || !uaData.getHighEntropyValues) {
        socket.emit('deviceInfo', info);
        return;
    }
    uaData.getHighEntropyValues(['model', 'platformVersion']).then(function (hints) {
        info.hintModel = hints.model || '';
        info.hintPlatformVersion = hints.platformVersion || '';
        socket.emit('deviceInfo', info);
    }, function () {
        socket.emit('deviceInfo', info);
    });
}

function setupOcean(o, joinState) {
    ocean = o;
    hasJoinedOcean = true;
    sendDeviceInfo();
    applyOceanVisibility();
    validateFisherClass();
    validateFisherAdvantage();
    // Rejoining a game under way: no rules screen (rejoinGame rebuilds the
    // game screen). Opening it here and closing it on 'rejoined' doesn't work:
    // Bootstrap ignores a close while the modal is still fading in.
    if (!(joinState && joinState.rejoining)) displayRules();
    loadLabels();
    updateCosts();
    makeUnpausable();
    hideTutorial();
    hideCatchIntentColumn();
    hideCatchIntentDialog();
    if (isProfitSeasonDisabled()) hideProfitSeasonColumn();
    if (isProfitTotalDisabled()) hideProfitTotalColumn();
    if (isProfitGapDisabled()) hideProfitGapColumn();
    if (areAllProfitColumnsDisabled()) hideAllProfitExtras();
}

// Validate and assign fClass URL parameter against microworld fisher classes
// Matching is case-insensitive; the stored (capitalized) class name is used.
function validateFisherClass() {
    if (!ocean.fisherClassesEnabled) {
        // Fisher classes not enabled, clear fClass
        pParams.fClass = null;
        return;
    }
    var validClasses = ocean.fisherClasses || [];
    if (validClasses.length === 0) {
        pParams.fClass = null;
        return;
    }
    if (!pParams.fClass) {
        // No fclass provided, assign first class
        pParams.fClass = validClasses[0];
    } else {
        // Case-insensitive lookup: find the canonical class name
        var inputLower = pParams.fClass.toLowerCase();
        var matched = validClasses.filter(function(c) { return c.toLowerCase() === inputLower; });
        if (matched.length > 0) {
            pParams.fClass = matched[0];
        } else {
            console.warn('Invalid fclass "' + pParams.fClass + '". Valid classes are: ' + validClasses.join(', ') + '. Assigning to ' + validClasses[0]);
            pParams.fClass = validClasses[0];
        }
    }
}

function readRules() {
    socket.emit('readRules');
    $('#lobby-status-box').show();
    startLobbyTimer();
}

////////////////////////////////////////
//////////// Lobby status table
////////////////////////////////////////

var lobbySlots = [];
var lobbyTimer = null;

function receiveLobbyStatus(data) {
    lobbySlots = data.slots;
    renderLobbyTable();
}

function formatMmSs(totalSecs) {
    var m = Math.floor(totalSecs / 60);
    var s = totalSecs % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

function renderLobbyTable() {
    var now = Date.now();
    var rows = [];

    for (var i = 0; i < lobbySlots.length; i++) {
        var slot = lobbySlots[i];
        var rowStatus, rowTime, rowSortKey;

        if (slot === null) {
            rowStatus = msgs.lobby_fisherMissing;
            rowTime = '---';
            rowSortKey = -1;
        } else {
            var entrySecs = Math.min(60*60-1, Math.max(0, Math.floor((now - slot.entryTime) / 1000)));
            var isReady = slot.readyTime !== null;
            rowStatus = slot.pId === pId ? msgs.info_you : (isReady ? msgs.lobby_fisherReady : msgs.lobby_fisherReading);
            rowTime = formatMmSs(entrySecs);
            rowSortKey = entrySecs;
        }

        rows.push({ status: rowStatus, timeDisplay: rowTime, sortKey: rowSortKey });
    }

    rows.sort(function(a, b) { return b.sortKey - a.sortKey; });

    var $tbody = $('#lobby-tbody');
    $tbody.empty();
    for (var j = 0; j < rows.length; j++) {
        var row = rows[j];
        $tbody.append(
            $('<tr>').append(
                $('<td>').text(row.status),
                $('<td>').text(row.timeDisplay)
            )
        );
    }
}

function startLobbyTimer() {
    if (!lobbyTimer) {
        lobbyTimer = setInterval(renderLobbyTable, 1000);
    }}

////////////////////////////////////////
//////////// Abort / timeout feature
////////////////////////////////////////

var abortCountdownInterval = null;
var forceAbortCountdownInterval = null;
var simOverTimer = null;

function startCountdown(seconds, intervalVar, displaySelector, doneFn) {
    if (intervalVar) {
        clearInterval(intervalVar);
    }
    var remaining = seconds;
    $(displaySelector).text('(' + remaining + 's)');
    return setInterval(function() {
        remaining -= 1;
        $(displaySelector).text('(' + remaining + 's)');
        if (remaining <= 0) {
            doneFn();
        }
    }, 1000);
}

function showAbortPrompt(data) {
    var stage = data.stage;
    if (stage === 'readingRules') {
        $('#abort-prompt-message').text(ocean.abortReadingRulesText || msgs.abort_readingRulesMessage);
        $('#abort-keep-reading').show();
        $('#abort-proceed').show();
        $('#abort-keep-waiting').hide();
        $('#rules-modal').modal('hide');
    } else {
        $('#abort-prompt-message').text(ocean.abortLobbyWaitText || msgs.abort_lobbyWaitMessage);
        $('#abort-keep-reading').hide();
        $('#abort-proceed').hide();
        $('#abort-keep-waiting').show();
    }
    $('#maybe-abort-modal').modal({ keyboard: false, backdrop: 'static' });
    if (ocean.promptTimeout) {
        abortCountdownInterval = startCountdown(ocean.promptTimeout, abortCountdownInterval, '#abort-countdown', function() {
            hideAbortModal();
            showForceAbortModal();
        });
    }
}

function clearAbortCountdown() {
    if (abortCountdownInterval) {
        clearInterval(abortCountdownInterval);
        abortCountdownInterval = null;
    }
    $('#abort-countdown').text('');
}

function hideAbortModal() {
    clearAbortCountdown();
    $('#maybe-abort-modal').modal('hide');
}

function doAbort() {
    hideAbortModal();
    socket.emit('abortFish');
    var url = ocean.abortUrl;
    if (url && url.length > 0) {
        for (var key in queryParams) {
            url = substituteQueryParameter(url, key);
        }
        location.href = url;
    }
}

function showForceAbortModal() {
    $('#force-abort-message').text(ocean.forceAbortText || msgs.forceAbort_message);
    $('#force-abort-ok').text(msgs.forceAbort_ok);
    $('#force-abort-modal').modal({ keyboard: false, backdrop: 'static' });
    if (ocean.promptTimeout) {
        forceAbortCountdownInterval = startCountdown(ocean.promptTimeout, forceAbortCountdownInterval, '#force-abort-countdown', function() {
            clearForceAbortCountdown();
            doForceAbortOk();
        });
    }
}

function clearForceAbortCountdown() {
    if (forceAbortCountdownInterval) {
        clearInterval(forceAbortCountdownInterval);
        forceAbortCountdownInterval = null;
    }
    $('#force-abort-countdown').text('');
}

function doForceAbortOk() {
    clearForceAbortCountdown();
    $('#force-abort-modal').modal('hide');
    doAbort();
}

function doAbortKeepReading() {
    hideAbortModal();
    socket.emit('keepReading');
    displayRules();
}

function doAbortProceed() {
    hideAbortModal();
    socket.emit('proceedToLobby');
    $('#lobby-status-box').show();
    startLobbyTimer();
}

function doAbortKeepWaiting() {
    hideAbortModal();
    socket.emit('keepWaiting');
}

function changeLocation() {
    var btn = $('#changeLocation');

    if (btn.data('location') == 'port') {

        goToSea();
        btn.data('location', 'sea');
        btn.html(msgs.buttons_return);

    } else {

        goToPort();
        btn.data('location', 'port');
        btn.html(msgs.buttons_goToSea);

    }

}

function resetLocation() {
    var btn = $("#changeLocation");
    goToPort();
    btn.data('location', 'port');
    btn.html(msgs.buttons_goToSea);
}

function goToSea() {
    socket.emit('goToSea');
    $('#attempt-fish').removeAttr('disabled');
}

function goToPort() {
    socket.emit('return');
    $('#attempt-fish').attr('disabled', 'disabled');
}

function attemptToFish() {
    socket.emit('attemptToFish');
}

function beginSeason(data) {
    st = data;
    $('#fish-season-header').text(' ' + msgs.info_season + ' ' + st.season);
    $('#profit-season-header').text(ocean.currencySymbol + ' ' + msgs.info_season + ' ' + st.season);
    updateWarning('');
    drawOcean();
    updateFishers();
    initializeMixItUp();
    sortFisherTable();
    $('#changeLocation').removeAttr('disabled');
    $('#pause').removeAttr('disabled');
}

function warnInitialDelay() {
    $('#lobby-status-box').hide();
    if (lobbyTimer) { clearInterval(lobbyTimer); lobbyTimer = null; }
}

function warnSeasonStart() {
    updateWarning('start');
}

function warnSeasonEnd() {
    updateWarning('end');
}

function receiveStatus(data) {
    st = data;
    updateStatus();
    // Before season 1 (the countdown) there is no season data for the table yet
    if (st.season > 0) {
        updateFishers();
        sortFisherTable();
    }
    drawOcean();
}

function endSeason(data) {
    st.season = data.season;
    st.status = data.status;
    resetLocation();
    updateWarning();
    disableButtons();
}

function endRun(trigger) {
    var overText;
    if (trigger === 'time') {
        overText = ocean.endTimeText.replace(/\n/g, '<br />');
    } else if (trigger === 'disconnect') {
        overText = msgs.end_disconnect;
    } else {
        overText = ocean.endDepletionText.replace(/\n/g, '<br />');
    }
    showGameOver(overText);
}

// A page that was in a game and is refused on reconnecting (lost after a
// disconnect, or removed) ends the same way as a finished game, with the reason
function showRejoinRefused(data) {
    var text = (data.code && msgs['end_' + data.code]) || $('<span>').text(data.message).html();
    showGameOver(text);
}

function showGameOver(overText) {
    resetLocation();
    st.status = 'over';

    disableButtons();
    clearWarnings();
    updateStatus();
    hideDisconnectPause();

    socket.disconnect();
    $('#over-text').html(overText);
    $('#over-modal').modal({ keyboard: false, backdrop: 'static' });

    if (ocean.redirectURL && ocean.redirectURL.length > 0 && ocean.promptTimeout) {
        simOverTimer = setTimeout(function() {
            simOverTimer = null;
            maybeRedirect();
        }, ocean.promptTimeout * 1000);
    }
}

// 
// REDIRECTION FEATURE
//

var queryParams = $.url().param();

function maybeRedirect() {
    if (simOverTimer) {
        clearTimeout(simOverTimer);
        simOverTimer = null;
    }
    // replace the keyword REDIRECTURL with the value of the redirectURL parameter
    var url = ocean.redirectURL;
    if (url && url.length > 0) {
        for (var key in queryParams) {
            url = substituteQueryParameter(url, key);
        }
        location.href = url;
    }
}

function substituteQueryParameter(url, key) {
    var safeKey = escapeRegExp("${" + key + "}"); // "\\$x"
    var replacement = queryParams[key];
    var safeReplacement = escapeReplacement(replacement);
    return url.replace(
        new RegExp(safeKey, 'gi'),
        safeReplacement
    );
}
// Some query parameters may contain characters that have meaning in a regular expression
// and string.replace uses regexp , so we need to escape the parameter names and values 
// From https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
//
// To escape the RegExp itself:
function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
// To escape a replacement string:
function escapeReplacement(str) {
    return str.replace(/\$/g, '$$$$');
}

// END REDIRECTION FEATURE


function requestPause() {
    socket.emit('requestPause', pId);
}

function requestResume() {
    socket.emit('requestResume', pId);
}

// A player's Pause button is holding the game (as opposed to a disconnect,
// or the countdown before play resumes)
var manualPauseActive = false;

function pause() {
    manualPauseActive = true;
    prePauseButtonsState.changeLocation = $('#changeLocation').attr('disabled');
    prePauseButtonsState.attemptFish = $('#attempt-fish').attr('disabled');
    $('#changeLocation').attr('disabled', 'disabled');
    $('#attempt-fish').attr('disabled', 'disabled');
    $('#pause').hide();
    $('#resume').show();
}

function resume() {
    manualPauseActive = false;
    if (prePauseButtonsState.changeLocation === undefined) $('#changeLocation').removeAttr('disabled');
    if (prePauseButtonsState.attemptFish === undefined) $('#attempt-fish').removeAttr('disabled');
    if (!ocean || ocean.enablePause) $('#pause').show();
    $('#resume').hide();
}

////////////////////////////////////////
//////////// Disconnect Handling (see src/engine/ocean.js)
////////////////////////////////////////

var disconnectCountdown = null;
var disconnectPauseShown = false;

// The game is paused while a disconnected player is given time to return
function showDisconnectPause(data) {
    if (!disconnectPauseShown && st.status !== 'paused') {
        prePauseButtonsState.changeLocation = $('#changeLocation').attr('disabled');
        prePauseButtonsState.attemptFish = $('#attempt-fish').attr('disabled');
    }
    disconnectPauseShown = true;
    $('#changeLocation').attr('disabled', 'disabled');
    $('#attempt-fish').attr('disabled', 'disabled');
    $('#pause').hide();
    $('#resume').hide();

    var secondsLeft = data.secondsLeft;
    var showMessage = function () {
        showNotice('disconnect', msgs.warning_playerDisconnected.replace('{seconds}', Math.max(secondsLeft, 0)));
    };
    if (disconnectCountdown) clearInterval(disconnectCountdown);
    showMessage();
    disconnectCountdown = setInterval(function () {
        secondsLeft--;
        showMessage();
    }, 1000);
}

// The wait is over; the server sends 'resume' separately if play continues
function hideDisconnectPause() {
    if (disconnectCountdown) clearInterval(disconnectCountdown);
    disconnectCountdown = null;
    if (!disconnectPauseShown) return;
    disconnectPauseShown = false;
    clearNotice('disconnect');
    // Still paused by a player's Pause button (not just counting down to resume)
    if (manualPauseActive && ocean.enablePause) $('#resume').show();
}

// Back in a game already under way (after a reload or a dropped connection):
// skip the rules and lobby, and rebuild the screen from the current state
function rejoinGame(data) {
    $('#rules-modal').modal('hide');
    $('#lobby-status-box').hide();
    if (lobbyTimer) { clearInterval(lobbyTimer); lobbyTimer = null; }
    if (data.status.status === 'initial delay') {
        // Before season 1 there is no season data to show yet
        st = data.status;
        disableButtons();
        updateStatus();
        return;
    }
    beginSeason(data.status);
    resetLocation();
    if (st.status !== 'running') {
        $('#changeLocation').attr('disabled', 'disabled');
    }
    if (st.status === 'paused') {
        $('#pause').hide();
    }
}

// Leaving the page (navigating away, closing the tab, and on phones often
// switching apps) may freeze it in the browser's back/forward cache without
// closing the connection, so the server would only notice after the
// heartbeat times out. Say goodbye explicitly instead.
var disconnectedOnPageHide = false;

function onPageHide() {
    if (socket.connected) {
        disconnectedOnPageHide = true;
        socket.disconnect();
    }
}

// Back from the cache (e.g. the Back button): reconnect, which rejoins the
// game through the usual 'connect' -> enterOcean path
function onPageShow(event) {
    if (event.persisted && disconnectedOnPageHide) {
        disconnectedOnPageHide = false;
        socket.connect();
    }
}

////////////////////////////////////////
//////////// END Disconnect Handling
////////////////////////////////////////

function drawFish(oContext, image, coords) {
    oContext.drawImage(image, coords[0], coords[1], 50, 50);
}

////////////////////////////////////////
//////////// Hide Ocean Feature (microworld param hideOcean)
////////////////////////////////////////

function isOceanHidden() {
    return !!(ocean && ocean.hideOcean);
}

// With the ocean hidden: centre the game column and drop the ocean from the
// tutorial (notices are in the status bar either way)
function applyOceanVisibility() {
    if (!isOceanHidden()) {
        loadOceanImages();
        return;
    }
    $('#ocean-column').hide();
    $('#game-column').addClass('col-sm-offset-3');
    $('#ocean-box').removeClass('bootstro');
}

function isGameUnderway() {
    return st.status === 'running' || st.status === 'resting' || st.status === 'paused' || st.status === 'over';
}

// Overfishing: too few fish left to regrow to the maximum
function isRespawnWarningActive() {
    return !!(ocean && ocean.enableRespawnWarning && isGameUnderway() &&
        (st.certainFish + st.mysteryFish) * ocean.spawnFactor <= ocean.maxFish);
}

// The ocean shows the warning by changing its picture; without the ocean,
// the fish count turns red instead (no text, mirroring the picture)
function updateRespawnWarning() {
    $('#status-sub-label').toggleClass('respawn-warning', isOceanHidden() && isRespawnWarningActive());
}

////////////////////////////////////////
//////////// END Hide Ocean Feature
////////////////////////////////////////

function drawOcean() {
    updateRespawnWarning();
    if (isOceanHidden()) return;

    oCanvas = document.getElementById('ocean-canvas');
    oContext = oCanvas.getContext('2d');

    if (isGameUnderway()) {
        // background
        if (isRespawnWarningActive()) {
            oContext.drawImage(underwaterDying, 0, 0, 700, 460);
        } else {
            oContext.drawImage(underwater, 0, 0, 700, 460);
        }
        for (var spot = 0; spot < st.certainFish + st.certainSpawn + st.reportedMysteryFish; spot++) {
            if (spot < st.reportedMysteryFish) {
                drawFish(oContext, mysteryFishImage, spots[spot]);
            } else {
                drawFish(oContext, fishImage, spots[spot]);
            }
        }
    } else {
        oContext.fillStyle = 'white';
        oContext.fillRect(0, 0, 700, 460);
    }
}

function resizeOceanCanvasToScreenWidth() {
    var viewportWidth = $(window).width();
    var viewportHeight = $(window).height();
    var BOOTSTRAP_SMALL_WIDTH = 768;
    var BOOTSTRAP_MEDIUM_WIDTH = 992;
    var BOOTSTRAP_LARGE_WIDTH = 1200;
    if (viewportWidth <= BOOTSTRAP_SMALL_WIDTH) {
        $("#ocean-canvas").width(0.9 * viewportWidth);
    } else if (viewportWidth <= BOOTSTRAP_MEDIUM_WIDTH) {
        $("#ocean-canvas").width(0.4 * viewportWidth);
    } else if (viewportWidth <= BOOTSTRAP_LARGE_WIDTH) {
        $("#ocean-canvas").width(0.4 * viewportWidth);
    } else {
        $("#ocean-canvas").width(0.4 * viewportWidth);
    }
}

function startTutorial() {
    if (ocean && ocean.catchIntentionsEnabled) {
        showCatchIntentColumn(0);
    }
    else {
        hideCatchIntentColumn();
        // Prevent bootstro from choking on hidden catch intention tutorial data
        $("#catch-intent-th").removeClass("bootstro");
    }
    bootstro.start('.bootstro', {
        onComplete: function (params) {
            hideCatchIntentColumn();
            displayRules();
        },
        onExit: function (params) {
            hideCatchIntentColumn();
            displayRules();
        }
    });
}

// True once this page has been in a game: a later 'connect' is a reconnect,
// and the server must not seat this page in a new group
var hasJoinedOcean = false;

listen('connect', function () {
    socket.emit('enterOcean', mwId, pId, pParams, hasJoinedOcean);
});

window.addEventListener('pagehide', onPageHide);
window.addEventListener('pageshow', onPageShow);

listen('ocean', setupOcean);
listen('initial delay', warnInitialDelay);
listen('begin season', beginSeason);
listen('status', receiveStatus);
listen('warn season start', warnSeasonStart);
listen('warn season end', warnSeasonEnd);
listen('end season', endSeason);
listen('end run', endRun);
listen('lobbyStatus', receiveLobbyStatus);
listen('abortPrompt', showAbortPrompt);
listen('forceAbort', showForceAbortModal);
listen('pause', pause);
listen('resume', resume);
listen('disconnectPause', showDisconnectPause);
listen('disconnectPauseOver', hideDisconnectPause);
listen('rejoined', rejoinGame);
listen('start asking intent', startAskingIntendedCatch);
listen('stop asking intent', stopAskingIntendedCatch);
listen('joinError', function(data) {
    if (hasJoinedOcean) {
        showRejoinRefused(data);
    } else {
        alert(data.message);
    }
});

listen('displaced', function() {
    if (lobbyTimer) { clearInterval(lobbyTimer); lobbyTimer = null; }
    clearAbortCountdown();
    clearForceAbortCountdown();
    hideAbortModal();
    disableButtons();
    $('#lobby-status-box').hide();
    $('#displaced-notice').show();
    socket.disconnect();
});

function main() {
    hideCatchIntentColumn();
    $('#read-rules').on('click', readRules);
    $('#tutorial').on('click', startTutorial);
    disableButtons();
    $('#changeLocation').on('click', changeLocation)
    $('#attempt-fish').on('click', attemptToFish);
    $('#pause').on('click', requestPause);
    $('#resume').on('click', requestResume);
    $('#finished').on('click', maybeRedirect);
    $('#abort-keep-reading').on('click', doAbortKeepReading);
    $('#force-abort-ok').on('click', doForceAbortOk);
    $('#abort-proceed').on('click', doAbortProceed);
    $('#abort-keep-waiting').on('click', doAbortKeepWaiting);
    $('#abort-confirm').on('click', doAbort);
    loadLabels();
    resizeOceanCanvasToScreenWidth();
    $(window).resize(resizeOceanCanvasToScreenWidth);
}

$(document).ready(main);

var spots = [[100, 190], [10, 160], [590, 70], [40, 170], [410, 210], [590, 70], [540, 280],
[120, 240], [370, 280], [510, 110], [160, 10], [550, 400], [620, 180], [330, 340], [200, 270],
[120, 40], [230, 90], [250, 290], [360, 200], [370, 40], [420, 230], [650, 240], [10, 370],
[10, 250], [600, 10], [70, 380], [630, 350], [600, 270], [410, 60], [500, 100], [150, 50],
[70, 40], [300, 280], [520, 90], [100, 200], [10, 150], [310, 330], [490, 280], [30, 170],
[380, 300], [460, 30], [560, 280], [50, 150], [400, 100], [300, 330], [50, 100], [200, 130],
[170, 260], [510, 350], [110, 50], [30, 230], [550, 240], [100, 210], [600, 230], [100, 10],
[540, 110], [450, 180], [250, 200], [10, 200], [300, 180], [160, 50], [380, 380], [200, 240],
[540, 220], [470, 210], [500, 350], [290, 80], [510, 110], [220, 20], [350, 80], [540, 90],
[100, 310], [640, 300], [340, 50], [60, 120], [420, 310], [20, 230], [120, 360], [370, 190],
[350, 190], [420, 160], [250, 160], [460, 260], [650, 110], [340, 90], [520, 180], [140, 90],
[210, 340], [490, 30], [480, 250], [590, 170], [550, 290], [290, 130], [200, 240], [580, 170],
[410, 270], [600, 10], [20, 400], [280, 270], [490, 70], [460, 340], [280, 220], [340, 320],
[380, 180], [420, 110], [580, 120], [170, 60], [230, 290], [360, 180], [60, 380], [560, 320],
[130, 210], [100, 260], [410, 130], [380, 40], [90, 290], [20, 270], [500, 270], [140, 120],
[430, 110], [580, 400], [330, 20], [120, 150], [390, 10], [380, 130], [340, 100], [550, 350],
[210, 250], [100, 120], [20, 30], [220, 360], [70, 90], [200, 140], [170, 220], [480, 280],
[30, 330], [150, 250], [380, 60], [240, 130], [400, 230], [490, 220], [430, 250], [100, 350],
[640, 230], [100, 260], [50, 250], [390, 130], [480, 120], [10, 60], [590, 380], [250, 50],
[50, 340], [200, 130], [360, 150], [520, 120], [120, 170], [490, 140], [190, 230], [60, 180],
[40, 130], [130, 50], [190, 260], [410, 130], [500, 170], [260, 270], [160, 270], [210, 250],
[270, 110], [500, 40], [580, 100], [40, 120], [50, 260], [430, 260], [20, 90], [390, 50],
[520, 80], [150, 60], [560, 20], [170, 350], [350, 280], [610, 70], [270, 280], [300, 390],
[160, 50], [510, 340], [20, 330], [20, 370], [470, 350], [160, 300], [570, 360], [230, 180],
[260, 60], [320, 180], [230, 90], [440, 130], [480, 340], [50, 380], [520, 390], [590, 200],
[370, 370], [200, 210], [420, 110], [130, 90], [530, 370], [180, 180], [140, 90], [430, 290],
[440, 130], [260, 340], [510, 20], [160, 370], [330, 10], [520, 380], [170, 220], [520, 280],
[90, 190], [20, 80], [60, 220], [210, 10], [150, 110], [650, 230], [370, 350], [320, 310],
[270, 330], [540, 180], [590, 360], [510, 310], [460, 170], [650, 340], [450, 90], [140, 400],
[250, 220], [220, 220], [490, 290], [290, 360], [210, 360], [270, 300], [150, 100], [450, 340],
[250, 400], [650, 220], [240, 300], [540, 70], [90, 240], [150, 30], [180, 40], [270, 230],
[120, 400], [60, 100], [10, 390], [630, 20], [90, 350], [600, 220], [120, 320], [310, 100],
[420, 180], [220, 330], [320, 220], [260, 170], [300, 330], [520, 10], [420, 400], [180, 150],
[500, 220], [650, 250], [180, 300], [120, 240], [560, 100], [330, 270], [590, 350], [320, 10],
[90, 320], [190, 380], [230, 10], [200, 210], [130, 170], [550, 10], [190, 190], [20, 320],
[400, 320], [60, 350], [610, 390], [620, 70], [350, 300], [80, 270], [180, 330], [620, 40],
[360, 260], [510, 160], [80, 320], [210, 210], [380, 120], [400, 60], [130, 140], [530, 150],
[530, 280], [620, 220], [310, 290], [450, 10], [330, 230], [90, 90], [520, 330], [20, 90],
[160, 190], [520, 310], [20, 110], [110, 100], [180, 170], [120, 390], [640, 360], [270, 260],
[110, 260], [430, 240], [560, 340], [210, 70], [610, 110], [630, 80], [370, 80], [380, 60],
[200, 170], [10, 370], [200, 380], [170, 120], [530, 50], [550, 100], [590, 380], [280, 340],
[560, 310], [470, 370], [470, 300], [220, 90], [360, 90], [560, 310], [280, 30], [440, 320],
[530, 260], [450, 340], [150, 260], [90, 320], [360, 30], [460, 300], [420, 390], [640, 140],
[630, 250], [50, 160], [60, 340], [200, 60], [380, 350], [170, 350], [640, 330], [280, 300],
[420, 230], [490, 310], [550, 400], [630, 320], [100, 110], [100, 170], [320, 230], [250, 310],
[50, 10], [420, 190], [50, 280], [320, 340], [570, 230], [420, 210], [460, 190], [110, 300],
[580, 20], [50, 310], [340, 190], [160, 160], [620, 140], [300, 370], [560, 230], [110, 110],
[60, 350], [650, 110], [60, 280], [540, 250], [620, 300], [340, 320], [600, 150], [240, 190],
[390, 200], [190, 330], [320, 300], [60, 50], [180, 160], [580, 310], [320, 230], [400, 90],
[280, 170], [600, 50], [330, 200], [270, 150], [640, 150], [160, 60], [330, 140], [540, 10],
[130, 10], [360, 80], [370, 380], [610, 320], [50, 370], [90, 290], [620, 20], [50, 50], [350, 180],
[180, 70], [80, 200], [520, 400], [460, 330], [350, 380], [610, 400], [330, 340], [330, 150],
[180, 70], [110, 380], [30, 330], [450, 310], [490, 60], [550, 70], [320, 330], [40, 240],
[540, 300], [190, 270], [420, 200], [490, 100], [620, 240], [440, 100], [450, 390], [480, 200]];
