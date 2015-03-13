"use strict"
Fisher = require("./fisher").Fisher
Microworld = require("../models/microworld-model").Microworld
OceanLog = require("./ocean-log").OceanLog
Run = require("../models/run-model").Run
io = undefined
ioAdmin = undefined
exports.Ocean = Ocean = (mw, incomingIo, incomingIoAdmin, om) ->
  io = incomingIo
  ioAdmin = incomingIoAdmin
  @time = new Date()
  @id = @time.getTime()
  @status = "setup"
  @fishers = []
  @season = 0
  @seconds = 0
  @warnSeconds = 3
  @secondsSinceAllReturned = 0
  @certainFish = 0
  @mysteryFish = 0
  @reportedMysteryFish = 0
  @microworld = mw
  @results = []
  @om = om
  @log = new OceanLog(@microworld.name + " " + @id + " " + "(" + @microworld.experimenter.username + ")")
  botIdx = 0

  while botIdx < mw.params.bots.length
    bot = mw.params.bots[botIdx]
    @fishers.push new Fisher(bot.name, "bot", bot, this)
    @log.debug "Bot fisher " + bot.name + " joined."
    botIdx++
  @oceanOrder = "ocean_order_user_top"
  
  #///////////////////
  # Membership methods
  #///////////////////
  @hasRoom = ->
    @isInSetup() and @fishers.length < @microworld.params.numFishers

  @allHumansIn = ->
    @fishers.length is @microworld.params.numFishers

  @addFisher = (pId) ->
    @fishers.push new Fisher(pId, "human", null, this)
    @log.info "Human fisher " + pId + " joined."
    return

  @removeFisher = (pId) ->
    for i of @fishers
      fisher = @fishers[i]
      @fishers.splice i, 1  if not fisher.isBot() and fisher.name is pId
    @log.info "Human fisher " + pId + " left."
    return

  @findFisherIndex = (pId) ->
    for i of @fishers
      return parseInt(i, 10)  if @fishers[i].name is pId
    null

  
  #///////////////
  # Status methods
  #///////////////
  @getParams = ->
    
    # TODO - need to send more than the initial params perhaps?
    @microworld.params

  @isInSetup = ->
    
    # At least one participant still needs to read instructions
    @status is "setup"

  @isEveryoneReady = ->
    return false  if @hasRoom()
    for i of @fishers
      return false  unless @fishers[i].ready
    true

  @isInInitialDelay = ->
    
    # Before first season
    @status is "initial delay"

  @isRunning = ->
    @status is "running"

  @hasEveryoneReturned = ->
    for i of @fishers
      return false  unless @fishers[i].hasReturned
    true

  @isResting = ->
    @status is "resting" # between seasons

  @isPaused = ->
    @status is "paused"

  @isNotOver = ->
    @status isnt "over"

  @isRemovable = ->
    @status is "over"

  @canEndEarly = ->
    @microworld.params.enableEarlyEnd

  @shouldEndSeason = ->
    @hasReachedSeasonDuration() or (@canEndEarly() and @secondsSinceAllReturned >= 3)

  @pause = (pauseRequester) ->
    if @isRunning() or @isResting()
      @log.info "Simulation paused by fisher " + pauseRequester
      @unpauseState = @status
      @pausedBy = pauseRequester
      @status = "paused"
      io.sockets.in(@id).emit "pause"
      io.sockets.in(@id).emit "status", @getSimStatus()
    return

  @resume = (resumeRequester) ->
    if @isPaused() and @pausedBy is resumeRequester
      @log.info "Simulation resumed by fisher " + resumeRequester
      @status = @unpauseState
      io.sockets.in(@id).emit "resume"
      io.sockets.in(@id).emit "status", @getSimStatus()
    return

  @getSimStatus = ->
    status =
      season: @season
      status: @status
      certainFish: @certainFish
      mysteryFish: @mysteryFish
      reportedMysteryFish: @reportedMysteryFish
      fishers: []

    for i of @fishers
      status.fishers.push
        name: @fishers[i].name
        seasonData: @fishers[i].seasonData
        money: @fishers[i].money
        totalFishCaught: @fishers[i].totalFishCaught
        status: @fishers[i].status

    status

  
  #////////////////////////
  # Time management methods
  #////////////////////////
  @resetTimer = ->
    @seconds = 0
    return

  @tick = ->
    @seconds += 1
    @secondsSinceAllReturned += 1  if @hasEveryoneReturned()
    @log.debug "Tick. Seconds: " + @seconds
    return

  @hasReachedInitialDelay = ->
    @seconds >= @microworld.params.initialDelay

  @hasReachedSeasonDelay = ->
    @seconds >= @microworld.params.seasonDelay

  @hasReachedSeasonDuration = ->
    @seconds >= @microworld.params.seasonDuration

  
  #////////////////////
  # Preparation methods
  #////////////////////
  @readRules = (pId) ->
    idx = @findFisherIndex(pId)
    @fishers[idx].ready = true  if idx isnt null
    @log.info "Fisher " + pId + " is ready to start."
    return

  @attemptToFish = (pId) ->
    idx = @findFisherIndex(pId)
    @fishers[idx].tryToFish()  if idx isnt null
    io.sockets.in(@id).emit "status", @getSimStatus()
    return

  @goToSea = (pId) ->
    idx = @findFisherIndex(pId)
    @fishers[idx].goToSea()  if idx isnt null
    io.sockets.in(@id).emit "status", @getSimStatus()
    return

  @returnToPort = (pId) ->
    idx = @findFisherIndex(pId)
    @fishers[idx].goToPort()  if idx isnt null
    io.sockets.in(@id).emit "status", @getSimStatus()
    return

  @getHumansInOcean = ->
    humanList = []
    for i of @fishers
      humanList.push @fishers[i].name  if @fishers[i].type is "human"
    humanList

  @grabSimulationData = ->
    simulationData = {}
    simulationData.expId = @microworld.experimenter._id.toString()
    simulationData.code = @microworld.code
    simulationData.participants = @getHumansInOcean()
    simulationData.time = (new Date(@id)).toString()
    simulationData

  @getOceanReady = ->
    expId = @microworld.experimenter._id.toString()
    @status = "initial delay"
    @log.info "All fishers ready to start."
    io.sockets.in(@id).emit "initial delay"
    simulationData = @grabSimulationData()
    @om.trackedSimulations[@id] = simulationData
    ioAdmin.injs2coffeeworkaround(expId).emit "newSimulation", simulationData
    return

  @startNextSeason = ->
    @season += 1
    @log.debug "Preparing to begin season " + @season + "."
    @resetTimer()
    @status = "running"
    @secondsSinceAllReturned = 0
    @setAvailableFish()
    
    # Record starting data
    @results.push
      season: @season
      fishStart: @certainFish + @mysteryFish
      fishers: []

    for i of @fishers
      @fishers[i].prepareFisherForSeason @season
      @results[@season - 1].fishers.push
        name: @fishers[i].name
        type: @fishers[i].type

    
    # TODO: Need to get proper numbers for certain and mystery fish on seasons after first!
    @log.info "Beginning season " + @season + "."
    io.sockets.in(@id).emit "begin season", @getSimStatus()
    return

  @endCurrentSeason = (reason) ->
    
    # Bring all fishers back to port
    for i of @fishers
      @fishers[i].goToPort()
    
    # Record end data
    seasonResults = @results[@season - 1]
    preRunFish = @microworld.params.certainFish + @microworld.params.availableMysteryFish
    spawnFactor = @microworld.params.spawnFactor
    @results[@season - 1].fishEnd = @certainFish + @mysteryFish
    @results[@season - 1].groupRestraint = @groupRestraint(@results[@season - 1])
    @results[@season - 1].groupEfficiency = @groupEfficiency(@results[@season - 1], preRunFish, spawnFactor)
    for i of @fishers
      fisherData = @fishers[i].seasonData[@season]
      fisherResults = @results[@season - 1].fishers[i]
      fisherResults.fishTaken = fisherData.fishCaught
      fisherResults.greed = fisherData.greed
      fisherResults.profit = fisherData.endMoney - fisherData.startMoney
      fisherResults.individualRestraint = @individualRestraint(@results[@season - 1], i)
      fisherResults.individualEfficiency = @individualEfficiency(@results[@season - 1], i, preRunFish, spawnFactor)
    if @season < @microworld.params.numSeasons and reason isnt "depletion"
      @status = "resting"
      @resetTimer()
      @log.info "Ending season " + @season + "."
      io.sockets.in(@id).emit "end season",
        season: @season

    else
      @endOcean reason
    return

  @runOcean = ->
    
    # States: setup, initial delay, running, resting, paused, over
    loop_ = true
    delay = undefined
    if @isInSetup()
      unless @allHumansIn()
        @log.debug "Ocean loop - setup: waiting for humans."
      else unless @isEveryoneReady()
        @log.debug "Ocean loop - setup: reading instructions."
      else
        
        # Everyone ready!
        @getOceanReady()
    else if @isInInitialDelay()
      delay = @microworld.params.initialDelay
      @log.debug "Ocean loop - initial delay: " + @seconds + " of " + delay + " seconds."
      io.sockets.in(@id).emit "warn season start"  if @seconds + @warnSeconds >= delay
      if delay <= @seconds
        @log.debug "Ocean loop - initial delay: triggering season start."
        @startNextSeason()
      else
        @tick()
    else if @isRunning()
      duration = @microworld.params.seasonDuration
      @log.debug "Ocean loop: running: " + @seconds + " of " + duration + " seconds."
      for i of @fishers
        @fishers[i].runBot()
      io.sockets.in(@id).emit "status", @getSimStatus()
      io.sockets.in(@id).emit "warn season end"  if @seconds + @warnSeconds >= duration
      if @shouldEndSeason()
        @log.debug "Ocean loop - running: triggering season end."
        @endCurrentSeason "time"
      else
        @tick()
    else if @isResting()
      delay = @microworld.params.seasonDelay
      @log.debug "Ocean loop - resting: " + @seconds + " of " + delay + " seconds."
      io.sockets.in(@id).emit "status", @getSimStatus()
      io.sockets.in(@id).emit "warn season start"  if @seconds + @warnSeconds >= delay
      if delay <= @seconds
        @log.debug "Ocean loop - resting: triggering season start."
        @startNextSeason()
      else
        @tick()
    else if @isPaused()
      @log.debug "Ocean loop - paused."
    else # over
      @log.debug "Ocean loop - over: Stopping."
      loop_ = false
    setTimeout @runOcean.bind(this), 1000  if loop_
    return

  @setAvailableFish = ->
    if @season is 1
      @certainFish = @microworld.params.certainFish
      @mysteryFish = @microworld.params.availableMysteryFish
      @reportedMysteryFish = @microworld.params.reportedMysteryFish
    else
      spawnFactor = @microworld.params.spawnFactor
      spawnedFish = @certainFish * spawnFactor
      maxFish = @microworld.params.maxFish
      @certainFish = Math.round(Math.min(spawnedFish, maxFish))
      spawnedMystery = @mysteryFish * spawnFactor
      maxMystery = @microworld.params.availableMysteryFish
      @mysteryFish = Math.round(Math.min(spawnedMystery, maxMystery))
    return

  @areThereFish = ->
    (@certainFish + @mysteryFish) > 0

  @getParticipants = ->
    participants = []
    for i of @fishers
      participants.push @fishers[i].name  unless @fishers[i].isBot()
    participants

  @endOcean = (reason) ->
    @status = "over"
    ioAdmin.injs2coffeeworkaround(@microworld.experimenter._id.toString()).emit "simulationDone", @grabSimulationData()
    io.sockets.in(@id).emit "end run", reason
    if @microworld.status isnt "active"
      @log.info "Simulation run not saved: in " + @microworld.status + " status"
      return
    run =
      time: @time
      participants: @getParticipants()
      results: @results
      log: @log.entries
      microworld: @microworld

    _this = this
    Run.create run, onCreate = (err, doc) ->
      _this.log.error "Simulation run could not be saved: " + err  if err
      if doc
        _this.log.info "Simulation run saved with _id " + doc._id
        Microworld.update
          _id: _this.microworld._id
        ,
          $inc:
            numCompleted: 1
        , (err, num) ->
          _this.log.error "Simulation count could not be incremented: ", err  if err
          return

      return

    return

  @isSuccessfulCastAttempt = ->
    (@certainFish + @mysteryFish > 0) and Math.random() <= @microworld.params.chanceCatch

  @takeOneFish = ->
    if Math.floor(Math.random() * (@certainFish + @mysteryFish)) < @certainFish
      @certainFish -= 1
    else
      @mysteryFish -= 1
      @reportedMysteryFish -= 1
    @endCurrentSeason "depletion"  unless @areThereFish()
    return

  
  # Metric calculations
  @individualRestraint = (seasonData, fisherIndex) ->
    fishStart = seasonData.fishStart
    numFishers = seasonData.fishers.length
    fishTaken = seasonData.fishers[fisherIndex].fishTaken
    return `undefined`  if fishStart is 0
    (fishStart - numFishers * fishTaken) / fishStart

  @groupRestraint = (seasonData) ->
    return `undefined`  if seasonData.fishStart is 0
    seasonData.fishEnd / seasonData.fishStart

  @individualEfficiency = (seasonData, fisherIndex, preRunFish, spawnFactor) ->
    fishStart = seasonData.fishStart
    numFishers = seasonData.fishers.length
    fishTaken = seasonData.fishers[fisherIndex].fishTaken
    if preRunFish <= spawnFactor * fishStart
      
      # Not endangered
      (fishStart - fishTaken * numFishers) * spawnFactor / preRunFish
    else
      
      # Endangered
      (fishStart - fishTaken * numFishers) / fishStart

  @groupEfficiency = (seasonData, preRunFish, spawnFactor) ->
    fishStart = seasonData.fishStart
    fishEnd = seasonData.fishEnd
    if preRunFish <= spawnFactor * fishStart
      
      # Not endangered
      fishEnd * spawnFactor / preRunFish
    else
      
      # Endangered
      fishEnd / fishStart

  return
