getMwId = ->
  mwId = $.url().segment(4)
  return
isNewMicroworld = ->
  $.url().segment(3) is "new"
showStatusTableOptions = ->
  behaviour_name = $(this).attr("id")
  behaviour_type = $(this).text()
  $(this).closest(".dropdown").find("span#btn_txt").text behaviour_type + "  "
  $("." + behaviour_name).removeClass "hide"
  if behaviour_name is "static_option"
    $(".dynamic_option").addClass "hide"
  else
    $(".static_option").addClass "hide"
  return
readyTooltips = ->
  $("#early-end-tooltip").tooltip()
  $("#max-fish-tooltip").tooltip()
  $("#available-mystery-tooltip").tooltip()
  $("#reported-mystery-tooltip").tooltip()
  $("#spawn-factor-tooltip").tooltip()
  $("#chance-catch-tooltip").tooltip()
  $("#show-fisher-status-tooltip").tooltip()
  $("#erratic-tooltip").tooltip()
  $("#greed-tooltip").tooltip()
  $("#greed-spread-tooltip").tooltip()
  $("#trend-tooltip").tooltip()
  $("#predictability-tooltip").tooltip()
  $("#prob-action-tooltip").tooltip()
  $("#attempts-second-tooltip").tooltip()
  return
changeBotRowVisibility = ->
  numFishers = parseInt($("#num-fishers").val(), 10)
  numHumans = parseInt($("#num-humans").val(), 10)
  numFishers = 1  if numFishers < 1
  numFishers = maxBot + numHumans  if numFishers > maxBot + numHumans
  numHumans = numFishers  if numHumans > numFishers
  i = 1

  while i <= numFishers - numHumans
    $("#bot-" + i + "-row").removeClass "collapse"
    i++
  i = numFishers - numHumans + 1

  while i <= maxBot
    $("#bot-" + i + "-row").addClass "collapse"
    i++
  return
changeGreedUniformity = ->
  if $("#uniform-greed").prop("checked") is true
    greed = $("#bot-1-greed").val()
    i = 2

    while i <= maxBot
      $("#bot-" + i + "-greed").val(greed).attr "disabled", true
      i++
  else
    i = 2

    while i <= maxBot
      $("#bot-" + i + "-greed").attr "disabled", false
      i++
  return
changeGreedSpreadUniformity = ->
  if $("#uniform-greed-spread").prop("checked") is true
    greedSpread = $("#bot-1-greed-spread").val()
    i = 2

    while i <= maxBot
      $("#bot-" + i + "-greed-spread").val(greedSpread).attr "disabled", true
      i++
  else
    i = 2

    while i <= maxBot
      $("#bot-" + i + "-greedSpread").attr "disabled", false
      i++
  return
changeTrendUniformity = ->
  if $("#uniform-trend").prop("checked") is true
    trend = $("#bot-1-trend").val()
    i = 2

    while i <= maxBot
      $("#bot-" + i + "-trend").val(trend).attr "disabled", true
      i++
  else
    i = 2

    while i <= maxBot
      $("#bot-" + i + "-trend").attr "disabled", false
      i++
  return
changePredictabilityUniformity = ->
  if $("#uniform-predictability").prop("checked") is true
    predictability = $("#bot-1-predictability").val()
    i = 2

    while i <= maxBot
      $("#bot-" + i + "-predictability").val(predictability).attr "disabled", true
      i++
  else
    i = 2

    while i <= maxBot
      $("#bot-" + i + "-predictability").attr "disabled", false
      i++
  return
changeProbActionUniformity = ->
  if $("#uniform-prob-action").prop("checked") is true
    probAction = $("#bot-1-prob-action").val()
    i = 2

    while i <= maxBot
      $("#bot-" + i + "-prob-action").val(probAction).attr "disabled", true
      i++
  else
    i = 2

    while i <= maxBot
      $("#bot-" + i + "-prob-action").attr "disabled", false
      i++
  return
changeAttemptsSecondUniformity = ->
  if $("#uniform-attempts-second").prop("checked") is true
    attemptsSecond = $("#bot-1-attempts-second").val()
    i = 2

    while i <= maxBot
      $("#bot-" + i + "-attempts-second").val(attemptsSecond).attr "disabled", true
      i++
  else
    i = 2

    while i <= maxBot
      $("#bot-" + i + "-attempts-second").attr "disabled", false
      i++
  return
validate = ->
  errors = []
  errors.push "The microworld name is missing."  if $("#name").val().length < 1
  numFishers = parseInt($("#num-fishers").val(), 10)
  errors.push "There must be at least one fisher per simulation"  if numFishers < 1
  errors.push "The maximum number of fishers per simulation is twelve."  if numFishers > 12
  numHumans = parseInt($("#num-humans").val(), 10)
  errors.push "There must be zero or more humans per simulation."  if numHumans < 0
  errors.push "There cannot be more human fishers than total fishers."  if numHumans > numFishers
  errors.push "There must be at least one season per simulation."  if parseInt($("#num-seasons").val(), 10) < 1
  errors.push "Seasons must have a duration of at least one second."  if parseInt($("#season-duration").val(), 10) < 1
  errors.push "The initial delay must be at least one second long."  if parseInt($("#initial-delay").val(), 10) < 1
  errors.push "The delay between seasons must be at least one second."  if parseInt($("#season-delay").val(), 10) < 1
  errors.push "The value per fish cannot be negative"  if parseFloat($("#fish-value").val()) < 0
  errors.push "The cost to attempt to fish cannot be negative."  if parseFloat($("#cost-cast").val()) < 0
  errors.push "The cost to set sail cannot be negative."  if parseFloat($("#cost-departure").val()) < 0
  errors.push "The cost per second at sea cannot be negative."  if parseFloat($("#cost-second").val()) < 0
  certainFish = parseInt($("#certain-fish").val(), 10)
  errors.push "There must be at least one initial fish."  if certainFish < 1
  availMysteryFish = parseInt($("#available-mystery-fish").val(), 10)
  errors.push "The number of available mystery fish cannot be negative"  if availMysteryFish < 0
  repMysteryFish = parseInt($("#reported-mystery-fish").val(), 10)
  errors.push "The number of reported mystery fish must be equal or " + "greater than the number of actually available mystery fish."  if repMysteryFish < availMysteryFish
  maxFish = parseInt($("#max-fish").val(), 10)
  errors.push "The maximum fish capacity must be equal or greater " + "than the sum of certain and available mystery fish."  if maxFish < certainFish + availMysteryFish
  errors.push "The spawn factor cannot be negative."  if parseFloat($("#spawn-factor").val()) < 0
  chanceCatch = parseFloat($("#chance-catch").val())
  errors.push "The chance of catch must be a number between 0 and 1."  if chanceCatch < 0 or chanceCatch > 1
  errors.push "The preparation text is missing."  if $("#preparation-text").val().length < 1
  errors.push "The text for ending on time is missing."  if $("#end-time-text").val().length < 1
  errors.push "The text for ending on depletion is missing."  if $("#end-depletion-text").val().length < 1
  i = 1

  while i <= (numFishers - numHumans)
    errors.push "Bot " + i + " needs a name."  if $("#bot-" + i + "-name").val().length < 1
    botGreed = parseFloat($("#bot-" + i + "-greed").val())
    errors.push "The greed of bot " + i + " must be between 0 and 1."  if botGreed < 0 or botGreed > 1
    botGreedSpread = parseFloat($("#bot-" + i + "-greed-spread").val())
    errors.push "The greed spread of bot " + i + " must be greater than 0."  if botGreedSpread < 0
    errors.push "The greed spread of bot " + i + " must be less than twice its greed."  if botGreedSpread > 2 * botGreed
    botProbAction = parseFloat($("#bot-" + i + "-prob-action").val())
    errors.push "The probability of action of bot " + i + " must be between 0 and 1."  if botProbAction < 0 or botProbAction > 1
    botAttempts = parseFloat($("#bot-" + i + "-attempts-second").val())
    errors.push "The attempts per second of bot " + i + " must be between at least 1."  if botAttempts < 1
    i++
  return null  if errors.length is 0
  errors
prepareMicroworldObject = ->
  mw = {}
  mw.name = $("#name").val()
  mw.desc = $("#desc").val()
  mw.numFishers = $("#num-fishers").val()
  mw.numHumans = $("#num-humans").val()
  mw.numSeasons = $("#num-seasons").val()
  mw.seasonDuration = $("#season-duration").val()
  mw.initialDelay = $("#initial-delay").val()
  mw.seasonDelay = $("#season-delay").val()
  mw.enablePause = $("#enable-pause").prop("checked")
  mw.enableEarlyEnd = $("#enable-early-end").prop("checked")
  mw.fishValue = $("#fish-value").val()
  mw.costCast = $("#cost-cast").val()
  mw.costDeparture = $("#cost-departure").val()
  mw.costSecond = $("#cost-second").val()
  mw.currencySymbol = $("#currency-symbol").val()
  mw.certainFish = $("#certain-fish").val()
  mw.availableMysteryFish = $("#available-mystery-fish").val()
  mw.reportedMysteryFish = $("#reported-mystery-fish").val()
  mw.maxFish = $("#max-fish").val()
  mw.spawnFactor = $("#spawn-factor").val()
  mw.chanceCatch = $("#chance-catch").val()
  mw.showFishers = $("#show-fishers").prop("checked")
  mw.showFisherNames = $("#show-fisher-names").prop("checked")
  mw.showFisherStatus = $("#show-fisher-status").prop("checked")
  mw.showNumCaught = $("#show-num-caught").prop("checked")
  mw.showFisherBalance = $("#show-fisher-balance").prop("checked")
  mw.preparationText = $("#preparation-text").val()
  mw.endTimeText = $("#end-time-text").val()
  mw.endDepletionText = $("#end-depletion-text").val()
  mw.bots = []
  i = 1

  while i <= mw.numFishers - mw.numHumans
    botPrefix = "#bot-" + i + "-"
    mw.bots.push
      name: $(botPrefix + "name").val()
      greed: $(botPrefix + "greed").val()
      greedSpread: $(botPrefix + "greed-spread").val()
      trend: $(botPrefix + "trend").val()
      predictability: $(botPrefix + "predictability").val()
      probAction: $(botPrefix + "prob-action").val()
      attemptsSecond: $(botPrefix + "attempts-second").val()

    i++
  mw.oceanOrder = $("input[name=ocean_order]:checked").val()
  mw
reportErrors = (err) ->
  errMessage = "The form has the following errors:\n\n"
  for i of err
    errMessage += err[i] + "\n"
  alert errMessage
  return
badMicroworld = (jqXHR) ->
  reportErrors JSON.parse(jqXHR.responseText).errors
  return
goodMicroworld = ->
  location.href = "../dashboard"
  return
createMicroworld = ->
  err = validate()
  if err
    reportErrors err
    return
  mw = prepareMicroworldObject()
  $.ajax
    type: "POST"
    url: "/microworlds"
    data: mw
    error: badMicroworld
    success: goodMicroworld

  return
cloneMicroworld = ->
  err = validate()
  if err
    reportErrors err
    return
  mw = prepareMicroworldObject()
  mw.clone = true
  $.ajax
    type: "POST"
    url: "/microworlds"
    data: mw
    error: badMicroworld
    success: goodMicroworld

  return
updateMicroworld = (changeTo) ->
  err = validate()
  if err
    reportErrors err
    return
  mw = prepareMicroworldObject()
  mw.changeTo = changeTo  if changeTo
  $.ajax
    type: "PUT"
    url: "/microworlds/" + mwId
    data: mw
    error: badMicroworld
    success: goodMicroworld

  return
saveMicroworld = ->
  updateMicroworld()
  return
activateMicroworld = ->
  updateMicroworld "active"
  return
archiveMicroworld = ->
  updateMicroworld "archived"
  return
deleteMicroworld = ->
  $.ajax
    type: "DELETE"
    url: "/microworlds/" + mwId
    error: badMicroworld
    success: goodMicroworld

  return
populatePage = ->
  $("#name").val mw.name
  $("#desc").val mw.desc
  $("#num-fishers").val mw.params.numFishers
  $("#num-humans").val mw.params.numHumans
  $("#num-seasons").val mw.params.numSeasons
  $("#season-duration").val mw.params.seasonDuration
  $("#initial-delay").val mw.params.initialDelay
  $("#season-delay").val mw.params.seasonDelay
  $("#enable-pause").prop "checked", mw.params.enablePause
  $("#enable-early-end").prop "checked", mw.params.enableEarlyEnd
  $("#fish-value").val mw.params.fishValue
  $("#cost-cast").val mw.params.costCast
  $("#cost-departure").val mw.params.costDeparture
  $("#cost-second").val mw.params.costSecond
  $("#currency-symbol").val mw.params.currencySymbol
  $("#certain-fish").val mw.params.certainFish
  $("#available-mystery-fish").val mw.params.availableMysteryFish
  $("#reported-mystery-fish").val mw.params.reportedMysteryFish
  $("#max-fish").val mw.params.maxFish
  $("#spawn-factor").val mw.params.spawnFactor
  $("#chance-catch").val mw.params.chanceCatch
  $("#preparation-text").val mw.params.preparationText
  $("#end-time-text").val mw.params.endTimeText
  $("#end-depletion-text").val mw.params.endDepletionText
  $("#show-fishers").prop "checked", mw.params.showFishers
  $("#show-fisher-names").prop "checked", mw.params.showFisherNames
  $("#show-fisher-status").prop "checked", mw.params.showFisherStatus
  $("#show-num-caught").prop "checked", mw.params.showNumCaught
  $("#show-fisher-balance").prop "checked", mw.params.showFisherBalance
  $("#uniform-greed").prop "checked", false
  $("#uniform-greed-spread").prop "checked", false
  $("#uniform-trend").prop "checked", false
  $("#uniform-predictability").prop "checked", false
  $("#uniform-prob-action").prop "checked", false
  $("#uniform-attempts-second").prop "checked", false
  i = 1

  while i <= mw.params.numFishers - mw.params.numHumans
    botPrefix = "#bot-" + i + "-"
    $(botPrefix + "name").val mw.params.bots[i - 1].name
    $(botPrefix + "greed").val mw.params.bots[i - 1].greed
    $(botPrefix + "greed-spread").val mw.params.bots[i - 1].greedSpread
    $(botPrefix + "trend").val mw.params.bots[i - 1].trend
    $(botPrefix + "predictability").val mw.params.bots[i - 1].predictability
    $(botPrefix + "prob-action").val mw.params.bots[i - 1].probAction
    $(botPrefix + "attempts-second").val mw.params.bots[i - 1].attemptsSecond
    i++
  $("#" + mw.params.oceanOrder).prop "checked", true
  changeBotRowVisibility()
  return
noMicroworld = (jqXHR) ->
  alert jqXHR.responseText
  return
gotMicroworld = (m) ->
  mw = m
  mode = mw.status
  populatePage()
  prepareControls()
  return
getMicroworld = ->
  $.ajax
    type: "GET"
    url: "/microworlds/" + mwId
    error: noMicroworld
    success: gotMicroworld

  return
noRuns = (jqXHR) ->
  alert jqXHR.responseText
  return
gotRuns = (r) ->
  table = ""
  for i of r
    button = "<button class=\"btn btn-sm btn-info\" type=\"submit\" onclick=location.href='/runs/" + r[i]._id + "?csv=true'>Download   <span class=\"glyphicon glyphicon-download-alt\"></span></button>"
    table += "<tr><td><a href=\"../runs/" + r[i]._id + "\">" + moment(r[i].time).format("llll") + "</a></td>" + "<td>" + r[i].participants + "</td>" + "<td>" + button + "</tr>"
  $("#microworld-runs-table-rows").html table
  
  # enabled or disable the download all button depending on if there are any completed runs
  if r.length is 0
    $("#download-all-button").attr "disabled", "disabled"
  else
    $("#download-all-button").removeAttr "disabled"
  setTimeout getRuns, 60000
  return
getRuns = ->
  $.ajax
    type: "GET"
    url: "/runs/?mw=" + mwId
    error: noRuns
    success: gotRuns

  return
backToList = ->
  location.href = "../dashboard"
  return

# Makes downloading all runs possible
initDownloadAll = ->
  $("#download-all-button").attr "onclick", "location.href='/runs?csv=true&mw=" + mwId + "'"
  return
setButtons = ->
  $("#create").click createMicroworld
  $("#create-2").click createMicroworld
  $("#save").click saveMicroworld
  $("#save-2").click saveMicroworld
  $("#cancel").click backToList
  $("#cancel-2").click backToList
  $("#clone-confirmed").click cloneMicroworld
  $("#activate-confirmed").click activateMicroworld
  $("#archive-confirmed").click archiveMicroworld
  $("#delete-confirmed").click deleteMicroworld
  $(".behaviour_group_select").click showStatusTableOptions
  initDownloadAll()
  return
setOnPageChanges = ->
  $("#num-fishers").on "change", changeBotRowVisibility
  $("#num-humans").on "change", changeBotRowVisibility
  $("#uniform-greed").on "change", changeGreedUniformity
  $("#bot-1-greed").on "input", changeGreedUniformity
  $("#uniform-greed-spread").on "change", changeGreedSpreadUniformity
  $("#bot-1-greed-spread").on "input", changeGreedSpreadUniformity
  $("#uniform-trend").on "change", changeTrendUniformity
  $("#bot-1-trend").on "change", changeTrendUniformity
  $("#uniform-predictability").on "change", changePredictabilityUniformity
  $("#bot-1-predictability").on "change", changePredictabilityUniformity
  $("#uniform-prob-action").on "change", changeProbActionUniformity
  $("#bot-1-prob-action").on "input", changeProbActionUniformity
  $("#uniform-attempts-second").on "change", changeAttemptsSecondUniformity
  $("#bot-1-attempts-second").on "input", changeAttemptsSecondUniformity
  return
loadTexts = ->
  $("#preparation-text").val prepText
  $("#end-time-text").val endTimeText
  $("#end-depletion-text").val endDepletedText
  return
prepareControls = ->
  $("#microworld-panel-body-text").text panelBody[mode]
  $("#microworld-panel-2-body-text").text panelBody[mode]
  if mode is "new"
    $("#microworld-header").text pageHeader[mode]
    $("#microworld-panel-title").text panelTitle[mode]
    $("#microworld-panel-2-title").text panelTitle[mode]
    loadTexts()
    $("#create").removeClass "collapse"
    $("#create-2").removeClass "collapse"
    $("#ocean_order_user_top").prop "checked", true
    uniformityChanges()
  else if mode is "test"
    $("title").text "Fish - Microworld in Test"
    $("#microworld-header").text pageHeader[mode] + mw.code
    $("#microworld-panel-title").text panelTitle[mode] + mw.code
    $("#microworld-panel-2-title").text panelTitle[mode] + mw.code
    $("#save").removeClass "collapse"
    $("#save-2").removeClass "collapse"
    $("#clone").removeClass "collapse"
    $("#clone-2").removeClass "collapse"
    $("#activate").removeClass "collapse"
    $("#activate-2").removeClass "collapse"
    $("#delete").removeClass "collapse"
    $("#delete-2").removeClass "collapse"
    if $("input[type=\"radio\"]:checked").parent().parent().hasClass("dynamic_option")
      $(".static_option").addClass "hide"
      $(".dynamic_option").removeClass "hide"
      $("span#btn_txt").text "Dynamic Behaviour  " #\xa0 is the char &nbsp; makes
    uniformityChanges()
  else if mode is "active"
    $("title").text "Fish - Active Microworld"
    $("#microworld-header").text pageHeader[mode] + mw.code
    $("#microworld-panel-title").text panelTitle[mode] + mw.code
    $("#microworld-panel-2-title").text panelTitle[mode] + mw.code
    $("#clone").removeClass "collapse"
    $("#clone-2").removeClass "collapse"
    $("#archive").removeClass "collapse"
    $("#archive-2").removeClass "collapse"
    $("#delete").removeClass "collapse"
    $("#delete-2").removeClass "collapse"
    $(".to-disable").each ->
      $(this).prop "disabled", true
      return

    $("#results").removeClass "collapse"
    $(".dynamic_option").removeClass "hide"
  else if mode is "archived"
    $("title").text "Fish - Archived Microworld"
    $("#microworld-header").text pageHeader[mode]
    $("#microworld-panel-title").text panelTitle[mode]
    $("#microworld-panel-2-title").text panelTitle[mode]
    $("#clone").removeClass "collapse"
    $("#clone-2").removeClass "collapse"
    $("#activate").removeClass "collapse"
    $("#activate-2").removeClass "collapse"
    $("#delete").removeClass "collapse"
    $("#delete-2").removeClass "collapse"
    $(".to-disable").each ->
      $(this).prop "disabled", true
      return

    $("#results").removeClass "collapse"
    $(".dynamic_option").removeClass "hide"
  return
loadData = ->
  if isNewMicroworld()
    mode = "new"
    prepareControls()
  else
    getMicroworld() # will eventually call prepareControls()
    getRuns()
  return
uniformityChanges = ->
  changeGreedUniformity()
  changeGreedSpreadUniformity()
  changeTrendUniformity()
  changePredictabilityUniformity()
  changeProbActionUniformity()
  changeAttemptsSecondUniformity()
  return
main = ->
  getMwId()
  isNewMicroworld()
  readyTooltips()
  setButtons()
  setOnPageChanges()
  loadData()
  return
"use strict"
maxBot = 11
mode = undefined
mw = {}
mwId = undefined
$(document).ready main
