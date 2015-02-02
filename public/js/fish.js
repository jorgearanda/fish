'use strict';
/* global io:true, langs:true */

var lang = $.url().param('lang');
var msgs;
var socket = io.connect();
var mwId = $.url().param('mwid');
var pId = $.url().param('pid');
var ocean;
var prePauseButtonsState = {};

var oCanvas, oContext;
var underwater = new Image();
underwater.src = 'public/img/underwater.jpg';
var fishImage = new Image();
fishImage.src = 'public/img/certain-fish.png';
var mysteryFishImage = new Image();
mysteryFishImage.src = 'public/img/mystery-fish.png';

var st = {status: 'loading'};

if (lang && lang !== '' && lang.toLowerCase() in langs) {
    lang = lang.toLowerCase();
    msgs = langs[lang];
} else {
    msgs = langs.en;
    lang = 'en';
}

function loadLabels() {
    $('#read-rules').text(msgs.buttons_goFishing);
    $('#changeLocation').html(msgs.buttons_goToSea);
    $('#attempt-fish').html(msgs.buttons_castFish);
    $('#pause').html(msgs.buttons_pause);
    $('#resume').html(msgs.buttons_resume);

    $('#fisher-header').text(msgs.info_fisher);
    $('#fish-season-header').text(' ' + msgs.info_season);
    $('#fish-total-header').text(' ' + msgs.info_overall);

    if (!ocean) return;
    $('#profit-season-header').text(ocean.currencySymbol + msgs.info_season);
    $('#profit-total-header').text(ocean.currencySymbol + msgs.info_overall);

    updateCosts();
    updateStatus();
}

function initializeMixItUp() {
    var $container = $("#fishers-tbody");
    var $activeFishers = $('#fishers-tbody tr').filter(function() {
        return $(this).attr('active-fisher');
    });
    $container.mixItUp({
        selectors: {
            target: 'tr'
        },
        layout: {
            display: 'table-row'
        },
        load: {
            filter: $activeFishers
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
    $('#rules-modal').modal({keyboard: false, backdrop: 'static'});
}

function updateStatus() {
    var statusText = '';
    if (st.status === 'loading') {
        statusText = msgs.status_wait;
        $("#status-sub-label").html(msgs.status_subWait + ' <i class="icon-spin animate-spin"></i>');
    } else if (st.status === 'running') {
        statusText = msgs.status_season + st.season;
        var subLabel = ''
        if (st.reportedMysteryFish > 0) {
            subLabel += st.certainFish +
                msgs.status_fishTo + (st.certainFish + st.reportedMysteryFish) + '<i class="icon-fish"></i>' +
                msgs.status_fishRemaining;
        } else {
            subLabel += st.certainFish + '<i class="icon-fish"></i>' + msgs.status_fishRemaining;
        }

        $("#status-sub-label").html(subLabel);
        $("#status-sub-label").show();
    } else if (st.status === 'resting') {
        statusText = msgs.status_spawning;
        $("#status-sub-label").html(msgs.status_subSpawning);
    } else if (st.status === 'paused') {
        statusText = msgs.status_paused;
    } else if (st.status === 'over') {
        statusText = msgs.end_over;
        $("#status-sub-label").hide();
    } else {
    }

    $('#status-label').html(statusText);
}
function updateWarning(warn) {
    if (warn === 'start') {
        if (!st.season || st.season === 0) {
            $('#warning-alert').text(msgs.status_getReady);
            $('#warning-alert').fadeIn();
        } else {
            $('#warning-alert').text(msgs.warning_seasonStart);
            $('#warning-alert').fadeIn();
        }
    } else if (warn === 'end') {
        $('#warning-alert').text(msgs.warning_seasonEnd);
        $('#warning-alert').fadeIn();
    } else {
        $('#warning-alert').text('');
        $('#warning-alert').fadeOut();
    }
}

function clearWarnings() {
    $('#warning-alert').text('');
    $('#warning-alert').fadeOut();
}

function updateCosts() {
    if (!ocean) return;

    if (ocean.fishValue !== 0) {
        $('#revenue-fish').text(msgs.costs_fishValue + ' ' +
            ocean.currencySymbol + ocean.fishValue).show();
    } else {
        $('#revenue-fish').hide();
    }

    if (ocean.costDeparture !== 0) {
        $('#cost-departure').text(msgs.costs_costLeave + ' ' +
            ocean.currencySymbol + ocean.costDeparture);
    } else {
        $('#cost-departure').hide();
    }

    if (ocean.costCast !== 0) {
        $('#cost-cast').text(msgs.costs_costCast + ' ' +
            ocean.currencySymbol + ocean.costCast);
    } else {
        $('#cost-cast').hide();
    }

    if (ocean.costSecond !== 0) {
        $('#cost-second').text(msgs.costs_costSecond + ' ' +
            ocean.currencySymbol + ocean.costSecond);
    } else {
        $('#cost-second').hide();
    }
}

function updateFishers() {
    var j = 1;
    var name;
    var fishSeason;
    var fishTotal;
    var profitSeason;
    var profitTotal;

    for (var i in st.fishers) {
        var fisher = st.fishers[i];
        if (fisher.name === pId) {
            // This is you
            name = 'You';
            $('#f0-name').text(name);

            if (fisher.status === 'At port') {
                $('#f0-status').attr('src', '/public/img/anchor.png');
            } else {
                $('#f0-status').attr('src', '/public/img/world.png');
            }

            fishSeason = fisher.seasonData[st.season].fishCaught;
            fishTotal = fisher.totalFishCaught;
            profitSeason = fisher.seasonData[st.season].endMoney.toFixed(2);
            profitTotal = fisher.money.toFixed(2);

            $('#f0-fish-season').text(fishSeason);
            $('#f0-fish-total').text(fishTotal);
            $('#f0-profit-season').text(profitSeason);
            $('#f0-profit-total').text(profitTotal);

            $('#f0').attr('data-profit-total', profitTotal);
            $('#f0').attr('data-profit-season', profitSeason);
            $('#f0').attr('data-name', name);
            $('#f0').attr('active-fisher', true);
        } else {
            // Everyone else
            if (!ocean.showFishers) continue;

            $('#f' + j).show();
            if (ocean.showFisherNames) {
                name = fisher.name;
            } else {
                name = j;
            }
            $('#f' + j + '-name').text(name);

            var src = '';
            if (!ocean.showFisherStatus) {
                src = '/public/img/bullet_white.png';
            } else if (fisher.status === 'At port') {
                src = '/public/img/anchor.png';
            } else {
                src = '/public/img/world.png';
            }
            $('#f' + j + '-status').attr('src', src);

            fishSeason = fisher.seasonData[st.season].fishCaught;
            fishTotal = fisher.totalFishCaught;
            profitSeason = fisher.seasonData[st.season].endMoney.toFixed(2);
            profitTotal = fisher.money.toFixed(2);

            if (ocean.showNumCaught) {
                $('#f' + j + '-fish-season').text(fishSeason);
                $('#f' + j + '-fish-total').text(fishTotal);
            } else {
                $('#f' + j + '-fish-season').text('?');
                $('#f' + j + '-fish-total').text('?');
            }

            if (ocean.showFisherBalance) {
                $('#f' + j + '-profit-season').text(profitSeason);
                $('#f' + j + '-profit-total').text(profitTotal);
            } else {
                $('#f' + j + '-profit-season').text('?');
                $('#f' + j + '-profit-total').text('?');
            }

            $('#f' + j).attr('data-profit-total', profitTotal);
            $('#f' + j).attr('data-profit-season', profitSeason);
            $('#f' + j).attr('data-name', name);
            $('#f' + j).attr('active-fisher', true);

            j++;
        }
    }
}

function sortFisherTable() {
    var $container = $("#fishers-tbody");
    $container.mixItUp('sort', 'profit-total:desc profit-season:desc name:asc');
}

function makeUnpausable() {
    if (!ocean.enablePause) $('#pause').hide();
}

function setupOcean(o) {
    ocean = o;
    displayRules();
    loadLabels();
    updateCosts();
    makeUnpausable();
}

function readRules() {
    socket.emit('readRules');
}

function changeLocation() {
    var btn = $('#changeLocation');

    if(btn.data('location') == 'port') {

        goToSea();
        btn.data('location', 'sea');
        btn.html(msgs.buttons_return);

    }else {

        goToPort();
        btn.data('location', 'port');
        btn.html(msgs.buttons_goToSea);

    }

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
    updateWarning('');
    drawOcean();
    updateFishers();
    initializeMixItUp();
    sortFisherTable();
    $('#changeLocation').removeAttr('disabled');
    $('#pause').removeAttr('disabled');
}

function warnInitialDelay() {
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
    updateFishers();
    sortFisherTable();
    drawOcean();
}

function endSeason() {
    updateWarning();
    disableButtons();
}

function endRun(trigger) {
    st.status = 'over';

    disableButtons();
    clearWarnings();
    updateStatus();

    var overText;
    if (trigger === 'time') {
        overText = ocean.endTimeText.replace(/\n/g, '<br />');
    } else {
        overText = ocean.endDepletionText.replace(/\n/g, '<br />');
    }

    socket.disconnect();
    $('#over-text').html(overText);
    $('#over-modal').modal({keyboard: false, backdrop: 'static'});
}

function requestPause() {
    socket.emit('requestPause', pId);
}

function requestResume() {
    socket.emit('requestResume', pId);
}

function pause() {
    prePauseButtonsState.changeLocation = $('#changeLocation').attr('disabled');
    prePauseButtonsState.attemptFish = $('#attempt-fish').attr('disabled');
    $('#changeLocation').attr('disabled', 'disabled');
    $('#attempt-fish').attr('disabled', 'disabled');
    $('#pause').hide();
    $('#resume').show();
}

function resume() {
    if (prePauseButtonsState.changeLocation === undefined) $('#changeLocation').removeAttr('disabled');
    if (prePauseButtonsState.attemptFish === undefined) $('#attempt-fish').removeAttr('disabled');
    $('#pause').show();
    $('#resume').hide();
}

function drawFish(oContext, image, coords) {
    oContext.drawImage(image, coords[0], coords[1], 50, 50);
}

function drawOcean() {
    oCanvas = document.getElementById('ocean-canvas');
    oContext = oCanvas.getContext('2d');

    if (st.status === 'running' || st.status === 'resting' || st.status === 'paused' || st.status === 'over') {
        // background
        oContext.drawImage(underwater, 0, 0, 700, 460);
        for (var spot = 0; spot < st.certainFish + st.reportedMysteryFish; spot++) {
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
        $("#ocean-canvas").width(0.2 * viewportWidth);
    } else if (viewportWidth <= BOOTSTRAP_LARGE_WIDTH) {
        $("#ocean-canvas").width(0.2 * viewportWidth);
    } else {
        $("#ocean-canvas").width(0.2 * viewportWidth);
    }
}

socket.on('connect', function () {
    socket.emit('enterOcean', mwId, pId);
});

socket.on('ocean', setupOcean);
socket.on('initial delay', warnInitialDelay);
socket.on('begin season', beginSeason);
socket.on('status', receiveStatus);
socket.on('warn season start', warnSeasonStart);
socket.on('warn season end', warnSeasonEnd);
socket.on('end season', endSeason);
socket.on('end run', endRun);
socket.on('pause', pause);
socket.on('resume', resume);

function main() {
    $('#read-rules').on('click', readRules);
    disableButtons();
    $('#changeLocation').on('click', changeLocation)
    $('#attempt-fish').on('click', attemptToFish);
    $('#pause').on('click', requestPause);
    $('#resume').on('click', requestResume);
    loadLabels();
    resizeOceanCanvasToScreenWidth();
    $(window).resize(resizeOceanCanvasToScreenWidth);
}

$(document).ready(main);

var spots = [[100,190],[10,160],[590,70],[40,170],[410,210],[590,70],[540,280],
    [120,240],[370,280],[510,110],[160,10],[550,400],[620,180],[330,340],[200,270],
    [120,40],[230,90],[250,290],[360,200],[370,40],[420,230],[650,240],[10,370],
    [10,250],[600,10],[70,380],[630,350],[600,270],[410,60],[500,100],[150,50],
    [70,40],[300,280],[520,90],[100,200],[10,150],[310,330],[490,280],[30,170],
    [380,300],[460,30],[560,280],[50,150],[400,100],[300,330],[50,100],[200,130],
    [170,260],[510,350],[110,50],[30,230],[550,240],[100,210],[600,230],[100,10],
    [540,110],[450,180],[250,200],[10,200],[300,180],[160,50],[380,380],[200,240],
    [540,220],[470,210],[500,350],[290,80],[510,110],[220,20],[350,80],[540,90],
    [100,310],[640,300],[340,50],[60,120],[420,310],[20,230],[120,360],[370,190],
    [350,190],[420,160],[250,160],[460,260],[650,110],[340,90],[520,180],[140,90],
    [210,340],[490,30],[480,250],[590,170],[550,290],[290,130],[200,240],[580,170],
    [410,270],[600,10],[20,400],[280,270],[490,70],[460,340],[280,220],[340,320],
    [380,180],[420,110],[580,120],[170,60],[230,290],[360,180],[60,380],[560,320],
    [130,210],[100,260],[410,130],[380,40],[90,290],[20,270],[500,270],[140,120],
    [430,110],[580,400],[330,20],[120,150],[390,10],[380,130],[340,100],[550,350],
    [210,250],[100,120],[20,30],[220,360],[70,90],[200,140],[170,220],[480,280],
    [30,330],[150,250],[380,60],[240,130],[400,230],[490,220],[430,250],[100,350],
    [640,230],[100,260],[50,250],[390,130],[480,120],[10,60],[590,380],[250,50],
    [50,340],[200,130],[360,150],[520,120],[120,170],[490,140],[190,230],[60,180],
    [40,130],[130,50],[190,260],[410,130],[500,170],[260,270],[160,270],[210,250],
    [270,110],[500,40],[580,100],[40,120],[50,260],[430,260],[20,90],[390,50],
    [520,80],[150,60],[560,20],[170,350],[350,280],[610,70],[270,280],[300,390],
    [160,50],[510,340],[20,330],[20,370],[470,350],[160,300],[570,360],[230,180],
    [260,60],[320,180],[230,90],[440,130],[480,340],[50,380],[520,390],[590,200],
    [370,370],[200,210],[420,110],[130,90],[530,370],[180,180],[140,90],[430,290],
    [440,130],[260,340],[510,20],[160,370],[330,10],[520,380],[170,220],[520,280],
    [90,190],[20,80],[60,220],[210,10],[150,110],[650,230],[370,350],[320,310],
    [270,330],[540,180],[590,360],[510,310],[460,170],[650,340],[450,90],[140,400],
    [250,220],[220,220],[490,290],[290,360],[210,360],[270,300],[150,100],[450,340],
    [250,400],[650,220],[240,300],[540,70],[90,240],[150,30],[180,40],[270,230],
    [120,400],[60,100],[10,390],[630,20],[90,350],[600,220],[120,320],[310,100],
    [420,180],[220,330],[320,220],[260,170],[300,330],[520,10],[420,400],[180,150],
    [500,220],[650,250],[180,300],[120,240],[560,100],[330,270],[590,350],[320,10],
    [90,320],[190,380],[230,10],[200,210],[130,170],[550,10],[190,190],[20,320],
    [400,320],[60,350],[610,390],[620,70],[350,300],[80,270],[180,330],[620,40],
    [360,260],[510,160],[80,320],[210,210],[380,120],[400,60],[130,140],[530,150],
    [530,280],[620,220],[310,290],[450,10],[330,230],[90,90],[520,330],[20,90],
    [160,190],[520,310],[20,110],[110,100],[180,170],[120,390],[640,360],[270,260],
    [110,260],[430,240],[560,340],[210,70],[610,110],[630,80],[370,80],[380,60],
    [200,170],[10,370],[200,380],[170,120],[530,50],[550,100],[590,380],[280,340],
    [560,310],[470,370],[470,300],[220,90],[360,90],[560,310],[280,30],[440,320],
    [530,260],[450,340],[150,260],[90,320],[360,30],[460,300],[420,390],[640,140],
    [630,250],[50,160],[60,340],[200,60],[380,350],[170,350],[640,330],[280,300],
    [420,230],[490,310],[550,400],[630,320],[100,110],[100,170],[320,230],[250,310],
    [50,10],[420,190],[50,280],[320,340],[570,230],[420,210],[460,190],[110,300],
    [580,20],[50,310],[340,190],[160,160],[620,140],[300,370],[560,230],[110,110],
    [60,350],[650,110],[60,280],[540,250],[620,300],[340,320],[600,150],[240,190],
    [390,200],[190,330],[320,300],[60,50],[180,160],[580,310],[320,230],[400,90],
    [280,170],[600,50],[330,200],[270,150],[640,150],[160,60],[330,140],[540,10],
    [130,10],[360,80],[370,380],[610,320],[50,370],[90,290],[620,20],[50,50],[350,180],
    [180,70],[80,200],[520,400],[460,330],[350,380],[610,400],[330,340],[330,150],
    [180,70],[110,380],[30,330],[450,310],[490,60],[550,70],[320,330],[40,240],
    [540,300],[190,270],[420,200],[490,100],[620,240],[440,100],[450,390],[480,200]];
