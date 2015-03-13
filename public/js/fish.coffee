
# global io:true, langs:true 
loadLabels = ->
  $("#read-rules").text msgs.buttons_goFishing
  $("#changeLocation").html msgs.buttons_goToSea
  $("#attempt-fish").html msgs.buttons_castFish
  $("#pause").html msgs.buttons_pause
  $("#resume").html msgs.buttons_resume
  $("#fisher-header").text msgs.info_fisher
  $("#fish-season-header").text " " + msgs.info_season
  $("#fish-total-header").text " " + msgs.info_overall
  return  unless ocean
  $("#profit-season-header").text ocean.currencySymbol + " " + msgs.info_season
  $("#profit-total-header").text ocean.currencySymbol + " " + msgs.info_overall
  updateCosts()
  updateStatus()
  return
initializeMixItUp = ->
  $container = $("#fishers-tbody")
  $activeFishers = $("#fishers-tbody tr").filter(->
    $(this).attr "active-fisher"
  )
  $container.mixItUp
    selectors:
      target: "tr"

    layout:
      display: "table-row"

    load:
      filter: $activeFishers

  return
disableButtons = ->
  $("#changeLocation").attr "disabled", "disabled"
  $("#attempt-fish").attr "disabled", "disabled"
  $("#pause").attr "disabled", "disabled"
  return
updateRulesText = ->
  prepText = ocean.preparationText.replace(/\n/g, "<br />")
  $("#rules-text").html prepText
  return
displayRules = ->
  updateRulesText()
  $("#rules-modal").modal
    keyboard: false
    backdrop: "static"

  return
updateStatus = ->
  statusText = ""
  if st.status is "loading"
    statusText = msgs.status_wait
    $("#status-sub-label").html msgs.status_subWait + " <i class=\"icon-spin animate-spin\"></i>"
  else if st.status is "running"
    statusText = msgs.status_season + st.season
    subLabel = ""
    if st.reportedMysteryFish > 0
      subLabel += st.certainFish + msgs.status_fishTo + (st.certainFish + st.reportedMysteryFish) + "<i class=\"icon-fish\"></i>" + msgs.status_fishRemaining
    else
      subLabel += st.certainFish + "<i class=\"icon-fish\"></i>" + msgs.status_fishRemaining
    $("#status-sub-label").html subLabel
    $("#status-sub-label").show()
  else if st.status is "resting"
    statusText = msgs.status_spawning
    $("#status-sub-label").html msgs.status_subSpawning
  else if st.status is "paused"
    statusText = msgs.status_paused
  else if st.status is "over"
    statusText = msgs.end_over
    $("#status-sub-label").hide()
  else

  $("#status-label").html statusText
  return
updateWarning = (warn) ->
  if warn is "start"
    if not st.season or st.season is 0
      $("#warning-alert").text msgs.status_getReady
      $("#warning-alert").fadeIn()
    else
      $("#warning-alert").text msgs.warning_seasonStart
      $("#warning-alert").fadeIn()
  else if warn is "end"
    $("#warning-alert").text msgs.warning_seasonEnd
    $("#warning-alert").fadeIn()
  else
    $("#warning-alert").text ""
    $("#warning-alert").fadeOut()
  return
clearWarnings = ->
  $("#warning-alert").text ""
  $("#warning-alert").fadeOut()
  return
updateCosts = ->
  return  unless ocean
  if ocean.fishValue isnt 0
    $("#revenue-fish").text(msgs.costs_fishValue + " " + ocean.currencySymbol + ocean.fishValue).show()
  else
    $("#revenue-fish").hide()
  if ocean.costDeparture isnt 0
    $("#cost-departure").text msgs.costs_costLeave + " " + ocean.currencySymbol + ocean.costDeparture
  else
    $("#cost-departure").hide()
  if ocean.costCast isnt 0
    $("#cost-cast").text msgs.costs_costCast + " " + ocean.currencySymbol + ocean.costCast
  else
    $("#cost-cast").hide()
  if ocean.costSecond isnt 0
    $("#cost-second").text msgs.costs_costSecond + " " + ocean.currencySymbol + ocean.costSecond
  else
    $("#cost-second").hide()
  return
updateFishers = ->
  j = 1
  name = undefined
  fishSeason = undefined
  fishTotal = undefined
  profitSeason = undefined
  profitTotal = undefined
  for i of st.fishers
    fisher = st.fishers[i]
    if fisher.name is pId
      
      # This is you
      name = "You"
      $("#f0-name").text name
      if fisher.status is "At port"
        $("#f0-status").attr "src", "/public/img/anchor.png"
      else
        $("#f0-status").attr "src", "/public/img/world.png"
      fishSeason = fisher.seasonData[st.season].fishCaught
      fishTotal = fisher.totalFishCaught
      profitSeason = fisher.seasonData[st.season].endMoney.toFixed(2)
      profitTotal = fisher.money.toFixed(2)
      $("#f0-fish-season").text fishSeason
      $("#f0-fish-total").text fishTotal
      $("#f0-profit-season").text profitSeason
      $("#f0-profit-total").text profitTotal
      $("#f0").attr "data-fish-total", fishTotal
      $("#f0").attr "data-fish-season", fishSeason
      $("#f0").attr "data-profit-total", profitTotal
      $("#f0").attr "data-profit-season", profitSeason
      $("#f0").attr "data-name", name
      $("#f0").attr "active-fisher", true
    else
      
      # Everyone else
      continue  unless ocean.showFishers
      $("#f" + j).show()
      if ocean.showFisherNames
        name = fisher.name
      else
        name = j
      $("#f" + j + "-name").text name
      src = ""
      unless ocean.showFisherStatus
        src = "/public/img/bullet_white.png"
      else if fisher.status is "At port"
        src = "/public/img/anchor.png"
      else
        src = "/public/img/world.png"
      $("#f" + j + "-status").attr "src", src
      fishSeason = fisher.seasonData[st.season].fishCaught
      fishTotal = fisher.totalFishCaught
      profitSeason = fisher.seasonData[st.season].endMoney.toFixed(2)
      profitTotal = fisher.money.toFixed(2)
      if ocean.showNumCaught
        $("#f" + j + "-fish-season").text fishSeason
        $("#f" + j + "-fish-total").text fishTotal
      else
        $("#f" + j + "-fish-season").text "?"
        $("#f" + j + "-fish-total").text "?"
      if ocean.showFisherBalance
        $("#f" + j + "-profit-season").text profitSeason
        $("#f" + j + "-profit-total").text profitTotal
      else
        $("#f" + j + "-profit-season").text "?"
        $("#f" + j + "-profit-total").text "?"
      $("#f" + j).attr "data-fish-total", fishTotal
      $("#f" + j).attr "data-fish-season", fishSeason
      $("#f" + j).attr "data-profit-total", profitTotal
      $("#f" + j).attr "data-profit-season", profitSeason
      $("#f" + j).attr "data-name", name
      $("#f" + j).attr "active-fisher", true
      j++
  return
sortFisherTable = ->
  $container = $("#fishers-tbody")
  console.log ocean.oceanOrder
  if ocean.oceanOrder is "ocean_order_user_top"
    $container.mixItUp "insert", 1, $("tr#f0")
  else if ocean.oceanOrder is "ocean_order_user_mid"
    $container.mixItUp "insert", ocean.numFishers / 2, $("tr#f0")
  else if ocean.oceanOrder is "ocean_order_user_bot"
    $container.mixItUp "insert", ocean.numFishers, $("tr#f0")
  else if ocean.oceanOrder is "ocean_order_desc_fish_season"
    $container.mixItUp "sort", "fish-season:desc name:asc"
  else if ocean.oceanOrder is "ocean_order_desc_fish_overall"
    $container.mixItUp "sort", "fish-total:desc name:asc"
  else if ocean.oceanOrder is "ocean_order_desc_money_season"
    $container.mixItUp "sort", "profit-season:desc name:asc"
  else $container.mixItUp "sort", "profit-total:desc profit-season:desc name:asc"  if ocean.oceanOrder is "ocean_order_desc_money_overall"
  return
makeUnpausable = ->
  $("#pause").hide()  unless ocean.enablePause
  return
setupOcean = (o) ->
  ocean = o
  displayRules()
  loadLabels()
  updateCosts()
  makeUnpausable()
  return
readRules = ->
  socket.emit "readRules"
  return
changeLocation = ->
  btn = $("#changeLocation")
  if btn.data("location") is "port"
    goToSea()
    btn.data "location", "sea"
    btn.html msgs.buttons_return
  else
    goToPort()
    btn.data "location", "port"
    btn.html msgs.buttons_goToSea
  return
resetLocation = ->
  btn = $("#changeLocation")
  goToPort()
  btn.data "location", "port"
  btn.html msgs.buttons_goToSea
  return
goToSea = ->
  socket.emit "goToSea"
  $("#attempt-fish").removeAttr "disabled"
  return
goToPort = ->
  socket.emit "return"
  $("#attempt-fish").attr "disabled", "disabled"
  return
attemptToFish = ->
  socket.emit "attemptToFish"
  return
beginSeason = (data) ->
  st = data
  updateWarning ""
  drawOcean()
  updateFishers()
  initializeMixItUp()
  sortFisherTable()
  $("#changeLocation").removeAttr "disabled"
  $("#pause").removeAttr "disabled"
  return
warnInitialDelay = ->
warnSeasonStart = ->
  updateWarning "start"
  return
warnSeasonEnd = ->
  updateWarning "end"
  return
receiveStatus = (data) ->
  st = data
  updateStatus()
  updateFishers()
  sortFisherTable()
  drawOcean()
  return
endSeason = ->
  resetLocation()
  updateWarning()
  disableButtons()
  return
endRun = (trigger) ->
  resetLocation()
  st.status = "over"
  disableButtons()
  clearWarnings()
  updateStatus()
  overText = undefined
  if trigger is "time"
    overText = ocean.endTimeText.replace(/\n/g, "<br />")
  else
    overText = ocean.endDepletionText.replace(/\n/g, "<br />")
  socket.disconnect()
  $("#over-text").html overText
  $("#over-modal").modal
    keyboard: false
    backdrop: "static"

  return
requestPause = ->
  socket.emit "requestPause", pId
  return
requestResume = ->
  socket.emit "requestResume", pId
  return
pause = ->
  prePauseButtonsState.changeLocation = $("#changeLocation").attr("disabled")
  prePauseButtonsState.attemptFish = $("#attempt-fish").attr("disabled")
  $("#changeLocation").attr "disabled", "disabled"
  $("#attempt-fish").attr "disabled", "disabled"
  $("#pause").hide()
  $("#resume").show()
  return
resume = ->
  $("#changeLocation").removeAttr "disabled"  if prePauseButtonsState.changeLocation is `undefined`
  $("#attempt-fish").removeAttr "disabled"  if prePauseButtonsState.attemptFish is `undefined`
  $("#pause").show()
  $("#resume").hide()
  return
drawFish = (oContext, image, coords) ->
  oContext.drawImage image, coords[0], coords[1], 50, 50
  return
drawOcean = ->
  oCanvas = document.getElementById("ocean-canvas")
  oContext = oCanvas.getContext("2d")
  if st.status is "running" or st.status is "resting" or st.status is "paused" or st.status is "over"
    
    # background
    oContext.drawImage underwater, 0, 0, 700, 460
    spot = 0

    while spot < st.certainFish + st.reportedMysteryFish
      if spot < st.reportedMysteryFish
        drawFish oContext, mysteryFishImage, spots[spot]
      else
        drawFish oContext, fishImage, spots[spot]
      spot++
  else
    oContext.fillStyle = "white"
    oContext.fillRect 0, 0, 700, 460
  return
resizeOceanCanvasToScreenWidth = ->
  viewportWidth = $(window).width()
  viewportHeight = $(window).height()
  BOOTSTRAP_SMALL_WIDTH = 768
  BOOTSTRAP_MEDIUM_WIDTH = 992
  BOOTSTRAP_LARGE_WIDTH = 1200
  if viewportWidth <= BOOTSTRAP_SMALL_WIDTH
    $("#ocean-canvas").width 0.9 * viewportWidth
  else if viewportWidth <= BOOTSTRAP_MEDIUM_WIDTH
    $("#ocean-canvas").width 0.2 * viewportWidth
  else if viewportWidth <= BOOTSTRAP_LARGE_WIDTH
    $("#ocean-canvas").width 0.2 * viewportWidth
  else
    $("#ocean-canvas").width 0.2 * viewportWidth
  return
main = ->
  $("#read-rules").on "click", readRules
  disableButtons()
  $("#changeLocation").on "click", changeLocation
  $("#attempt-fish").on "click", attemptToFish
  $("#pause").on "click", requestPause
  $("#resume").on "click", requestResume
  loadLabels()
  resizeOceanCanvasToScreenWidth()
  $(window).resize resizeOceanCanvasToScreenWidth
  return
"use strict"
lang = $.url().param("lang")
msgs = undefined
socket = io.connect()
mwId = $.url().param("mwid")
pId = $.url().param("pid")
ocean = undefined
prePauseButtonsState = {}
oCanvas = undefined
oContext = undefined
underwater = new Image()
underwater.src = "public/img/underwater.jpg"
fishImage = new Image()
fishImage.src = "public/img/certain-fish.png"
mysteryFishImage = new Image()
mysteryFishImage.src = "public/img/mystery-fish.png"
st = status: "loading"
if lang and lang isnt "" and lang.toLowerCase() of langs
  lang = lang.toLowerCase()
  msgs = langs[lang]
else
  msgs = langs.en
  lang = "en"
socket.on "connect", ->
  socket.emit "enterOcean", mwId, pId
  return

socket.on "ocean", setupOcean
socket.on "initial delay", warnInitialDelay
socket.on "begin season", beginSeason
socket.on "status", receiveStatus
socket.on "warn season start", warnSeasonStart
socket.on "warn season end", warnSeasonEnd
socket.on "end season", endSeason
socket.on "end run", endRun
socket.on "pause", pause
socket.on "resume", resume
$(document).ready main
spots = [
  [
    100
    190
  ]
  [
    10
    160
  ]
  [
    590
    70
  ]
  [
    40
    170
  ]
  [
    410
    210
  ]
  [
    590
    70
  ]
  [
    540
    280
  ]
  [
    120
    240
  ]
  [
    370
    280
  ]
  [
    510
    110
  ]
  [
    160
    10
  ]
  [
    550
    400
  ]
  [
    620
    180
  ]
  [
    330
    340
  ]
  [
    200
    270
  ]
  [
    120
    40
  ]
  [
    230
    90
  ]
  [
    250
    290
  ]
  [
    360
    200
  ]
  [
    370
    40
  ]
  [
    420
    230
  ]
  [
    650
    240
  ]
  [
    10
    370
  ]
  [
    10
    250
  ]
  [
    600
    10
  ]
  [
    70
    380
  ]
  [
    630
    350
  ]
  [
    600
    270
  ]
  [
    410
    60
  ]
  [
    500
    100
  ]
  [
    150
    50
  ]
  [
    70
    40
  ]
  [
    300
    280
  ]
  [
    520
    90
  ]
  [
    100
    200
  ]
  [
    10
    150
  ]
  [
    310
    330
  ]
  [
    490
    280
  ]
  [
    30
    170
  ]
  [
    380
    300
  ]
  [
    460
    30
  ]
  [
    560
    280
  ]
  [
    50
    150
  ]
  [
    400
    100
  ]
  [
    300
    330
  ]
  [
    50
    100
  ]
  [
    200
    130
  ]
  [
    170
    260
  ]
  [
    510
    350
  ]
  [
    110
    50
  ]
  [
    30
    230
  ]
  [
    550
    240
  ]
  [
    100
    210
  ]
  [
    600
    230
  ]
  [
    100
    10
  ]
  [
    540
    110
  ]
  [
    450
    180
  ]
  [
    250
    200
  ]
  [
    10
    200
  ]
  [
    300
    180
  ]
  [
    160
    50
  ]
  [
    380
    380
  ]
  [
    200
    240
  ]
  [
    540
    220
  ]
  [
    470
    210
  ]
  [
    500
    350
  ]
  [
    290
    80
  ]
  [
    510
    110
  ]
  [
    220
    20
  ]
  [
    350
    80
  ]
  [
    540
    90
  ]
  [
    100
    310
  ]
  [
    640
    300
  ]
  [
    340
    50
  ]
  [
    60
    120
  ]
  [
    420
    310
  ]
  [
    20
    230
  ]
  [
    120
    360
  ]
  [
    370
    190
  ]
  [
    350
    190
  ]
  [
    420
    160
  ]
  [
    250
    160
  ]
  [
    460
    260
  ]
  [
    650
    110
  ]
  [
    340
    90
  ]
  [
    520
    180
  ]
  [
    140
    90
  ]
  [
    210
    340
  ]
  [
    490
    30
  ]
  [
    480
    250
  ]
  [
    590
    170
  ]
  [
    550
    290
  ]
  [
    290
    130
  ]
  [
    200
    240
  ]
  [
    580
    170
  ]
  [
    410
    270
  ]
  [
    600
    10
  ]
  [
    20
    400
  ]
  [
    280
    270
  ]
  [
    490
    70
  ]
  [
    460
    340
  ]
  [
    280
    220
  ]
  [
    340
    320
  ]
  [
    380
    180
  ]
  [
    420
    110
  ]
  [
    580
    120
  ]
  [
    170
    60
  ]
  [
    230
    290
  ]
  [
    360
    180
  ]
  [
    60
    380
  ]
  [
    560
    320
  ]
  [
    130
    210
  ]
  [
    100
    260
  ]
  [
    410
    130
  ]
  [
    380
    40
  ]
  [
    90
    290
  ]
  [
    20
    270
  ]
  [
    500
    270
  ]
  [
    140
    120
  ]
  [
    430
    110
  ]
  [
    580
    400
  ]
  [
    330
    20
  ]
  [
    120
    150
  ]
  [
    390
    10
  ]
  [
    380
    130
  ]
  [
    340
    100
  ]
  [
    550
    350
  ]
  [
    210
    250
  ]
  [
    100
    120
  ]
  [
    20
    30
  ]
  [
    220
    360
  ]
  [
    70
    90
  ]
  [
    200
    140
  ]
  [
    170
    220
  ]
  [
    480
    280
  ]
  [
    30
    330
  ]
  [
    150
    250
  ]
  [
    380
    60
  ]
  [
    240
    130
  ]
  [
    400
    230
  ]
  [
    490
    220
  ]
  [
    430
    250
  ]
  [
    100
    350
  ]
  [
    640
    230
  ]
  [
    100
    260
  ]
  [
    50
    250
  ]
  [
    390
    130
  ]
  [
    480
    120
  ]
  [
    10
    60
  ]
  [
    590
    380
  ]
  [
    250
    50
  ]
  [
    50
    340
  ]
  [
    200
    130
  ]
  [
    360
    150
  ]
  [
    520
    120
  ]
  [
    120
    170
  ]
  [
    490
    140
  ]
  [
    190
    230
  ]
  [
    60
    180
  ]
  [
    40
    130
  ]
  [
    130
    50
  ]
  [
    190
    260
  ]
  [
    410
    130
  ]
  [
    500
    170
  ]
  [
    260
    270
  ]
  [
    160
    270
  ]
  [
    210
    250
  ]
  [
    270
    110
  ]
  [
    500
    40
  ]
  [
    580
    100
  ]
  [
    40
    120
  ]
  [
    50
    260
  ]
  [
    430
    260
  ]
  [
    20
    90
  ]
  [
    390
    50
  ]
  [
    520
    80
  ]
  [
    150
    60
  ]
  [
    560
    20
  ]
  [
    170
    350
  ]
  [
    350
    280
  ]
  [
    610
    70
  ]
  [
    270
    280
  ]
  [
    300
    390
  ]
  [
    160
    50
  ]
  [
    510
    340
  ]
  [
    20
    330
  ]
  [
    20
    370
  ]
  [
    470
    350
  ]
  [
    160
    300
  ]
  [
    570
    360
  ]
  [
    230
    180
  ]
  [
    260
    60
  ]
  [
    320
    180
  ]
  [
    230
    90
  ]
  [
    440
    130
  ]
  [
    480
    340
  ]
  [
    50
    380
  ]
  [
    520
    390
  ]
  [
    590
    200
  ]
  [
    370
    370
  ]
  [
    200
    210
  ]
  [
    420
    110
  ]
  [
    130
    90
  ]
  [
    530
    370
  ]
  [
    180
    180
  ]
  [
    140
    90
  ]
  [
    430
    290
  ]
  [
    440
    130
  ]
  [
    260
    340
  ]
  [
    510
    20
  ]
  [
    160
    370
  ]
  [
    330
    10
  ]
  [
    520
    380
  ]
  [
    170
    220
  ]
  [
    520
    280
  ]
  [
    90
    190
  ]
  [
    20
    80
  ]
  [
    60
    220
  ]
  [
    210
    10
  ]
  [
    150
    110
  ]
  [
    650
    230
  ]
  [
    370
    350
  ]
  [
    320
    310
  ]
  [
    270
    330
  ]
  [
    540
    180
  ]
  [
    590
    360
  ]
  [
    510
    310
  ]
  [
    460
    170
  ]
  [
    650
    340
  ]
  [
    450
    90
  ]
  [
    140
    400
  ]
  [
    250
    220
  ]
  [
    220
    220
  ]
  [
    490
    290
  ]
  [
    290
    360
  ]
  [
    210
    360
  ]
  [
    270
    300
  ]
  [
    150
    100
  ]
  [
    450
    340
  ]
  [
    250
    400
  ]
  [
    650
    220
  ]
  [
    240
    300
  ]
  [
    540
    70
  ]
  [
    90
    240
  ]
  [
    150
    30
  ]
  [
    180
    40
  ]
  [
    270
    230
  ]
  [
    120
    400
  ]
  [
    60
    100
  ]
  [
    10
    390
  ]
  [
    630
    20
  ]
  [
    90
    350
  ]
  [
    600
    220
  ]
  [
    120
    320
  ]
  [
    310
    100
  ]
  [
    420
    180
  ]
  [
    220
    330
  ]
  [
    320
    220
  ]
  [
    260
    170
  ]
  [
    300
    330
  ]
  [
    520
    10
  ]
  [
    420
    400
  ]
  [
    180
    150
  ]
  [
    500
    220
  ]
  [
    650
    250
  ]
  [
    180
    300
  ]
  [
    120
    240
  ]
  [
    560
    100
  ]
  [
    330
    270
  ]
  [
    590
    350
  ]
  [
    320
    10
  ]
  [
    90
    320
  ]
  [
    190
    380
  ]
  [
    230
    10
  ]
  [
    200
    210
  ]
  [
    130
    170
  ]
  [
    550
    10
  ]
  [
    190
    190
  ]
  [
    20
    320
  ]
  [
    400
    320
  ]
  [
    60
    350
  ]
  [
    610
    390
  ]
  [
    620
    70
  ]
  [
    350
    300
  ]
  [
    80
    270
  ]
  [
    180
    330
  ]
  [
    620
    40
  ]
  [
    360
    260
  ]
  [
    510
    160
  ]
  [
    80
    320
  ]
  [
    210
    210
  ]
  [
    380
    120
  ]
  [
    400
    60
  ]
  [
    130
    140
  ]
  [
    530
    150
  ]
  [
    530
    280
  ]
  [
    620
    220
  ]
  [
    310
    290
  ]
  [
    450
    10
  ]
  [
    330
    230
  ]
  [
    90
    90
  ]
  [
    520
    330
  ]
  [
    20
    90
  ]
  [
    160
    190
  ]
  [
    520
    310
  ]
  [
    20
    110
  ]
  [
    110
    100
  ]
  [
    180
    170
  ]
  [
    120
    390
  ]
  [
    640
    360
  ]
  [
    270
    260
  ]
  [
    110
    260
  ]
  [
    430
    240
  ]
  [
    560
    340
  ]
  [
    210
    70
  ]
  [
    610
    110
  ]
  [
    630
    80
  ]
  [
    370
    80
  ]
  [
    380
    60
  ]
  [
    200
    170
  ]
  [
    10
    370
  ]
  [
    200
    380
  ]
  [
    170
    120
  ]
  [
    530
    50
  ]
  [
    550
    100
  ]
  [
    590
    380
  ]
  [
    280
    340
  ]
  [
    560
    310
  ]
  [
    470
    370
  ]
  [
    470
    300
  ]
  [
    220
    90
  ]
  [
    360
    90
  ]
  [
    560
    310
  ]
  [
    280
    30
  ]
  [
    440
    320
  ]
  [
    530
    260
  ]
  [
    450
    340
  ]
  [
    150
    260
  ]
  [
    90
    320
  ]
  [
    360
    30
  ]
  [
    460
    300
  ]
  [
    420
    390
  ]
  [
    640
    140
  ]
  [
    630
    250
  ]
  [
    50
    160
  ]
  [
    60
    340
  ]
  [
    200
    60
  ]
  [
    380
    350
  ]
  [
    170
    350
  ]
  [
    640
    330
  ]
  [
    280
    300
  ]
  [
    420
    230
  ]
  [
    490
    310
  ]
  [
    550
    400
  ]
  [
    630
    320
  ]
  [
    100
    110
  ]
  [
    100
    170
  ]
  [
    320
    230
  ]
  [
    250
    310
  ]
  [
    50
    10
  ]
  [
    420
    190
  ]
  [
    50
    280
  ]
  [
    320
    340
  ]
  [
    570
    230
  ]
  [
    420
    210
  ]
  [
    460
    190
  ]
  [
    110
    300
  ]
  [
    580
    20
  ]
  [
    50
    310
  ]
  [
    340
    190
  ]
  [
    160
    160
  ]
  [
    620
    140
  ]
  [
    300
    370
  ]
  [
    560
    230
  ]
  [
    110
    110
  ]
  [
    60
    350
  ]
  [
    650
    110
  ]
  [
    60
    280
  ]
  [
    540
    250
  ]
  [
    620
    300
  ]
  [
    340
    320
  ]
  [
    600
    150
  ]
  [
    240
    190
  ]
  [
    390
    200
  ]
  [
    190
    330
  ]
  [
    320
    300
  ]
  [
    60
    50
  ]
  [
    180
    160
  ]
  [
    580
    310
  ]
  [
    320
    230
  ]
  [
    400
    90
  ]
  [
    280
    170
  ]
  [
    600
    50
  ]
  [
    330
    200
  ]
  [
    270
    150
  ]
  [
    640
    150
  ]
  [
    160
    60
  ]
  [
    330
    140
  ]
  [
    540
    10
  ]
  [
    130
    10
  ]
  [
    360
    80
  ]
  [
    370
    380
  ]
  [
    610
    320
  ]
  [
    50
    370
  ]
  [
    90
    290
  ]
  [
    620
    20
  ]
  [
    50
    50
  ]
  [
    350
    180
  ]
  [
    180
    70
  ]
  [
    80
    200
  ]
  [
    520
    400
  ]
  [
    460
    330
  ]
  [
    350
    380
  ]
  [
    610
    400
  ]
  [
    330
    340
  ]
  [
    330
    150
  ]
  [
    180
    70
  ]
  [
    110
    380
  ]
  [
    30
    330
  ]
  [
    450
    310
  ]
  [
    490
    60
  ]
  [
    550
    70
  ]
  [
    320
    330
  ]
  [
    40
    240
  ]
  [
    540
    300
  ]
  [
    190
    270
  ]
  [
    420
    200
  ]
  [
    490
    100
  ]
  [
    620
    240
  ]
  [
    440
    100
  ]
  [
    450
    390
  ]
  [
    480
    200
  ]
]
