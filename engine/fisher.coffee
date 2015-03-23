"use strict"
exports.Fisher = Fisher = (name, type, params, o) ->
  @name = name
  @type = type
  @params = params
  @ocean = o
  @ready = (@type is "bot")
  @hasReturned = false
  @seasonData = []
  @startMoney = 0
  @money = 0
  @totalFishCaught = 0
  @status = "At port"
  @season = 0
  @isBot = ->
    @type is "bot"

  @isErratic = ->
    @params.predictability is "erratic"

  @getFishCaught = ->
    @seasonData[@season].fishCaught

  @getIntendedCasts = ->
    @seasonData[@season].intendedCasts

  @getActualCasts = ->
    @seasonData[@season].actualCasts

  @calculateSeasonGreed = ->
    baseGreed = @params.greed
    greedSpread = @params.greedSpread
    predictability = @params.predictability
    trend = @params.trend
    numSeasons = @ocean.microworld.params.numSeasons
    currentSeason = @ocean.season
    currentGreed = baseGreed
    lowBound = baseGreed - greedSpread / 2
    highBound = baseGreed + greedSpread / 2
    if numSeasons > 1
      increment = (highBound - lowBound) / (numSeasons - 1)
      if trend is "decrease"
        currentGreed = highBound - (increment * currentSeason)
      else currentGreed = lowBound + (increment * currentSeason)  if trend is "increase"
    if predictability is "erratic"

      # variation between 0.75 and 1.25
      variation = 1.0 + ((Math.random() - 0.5) / 2.0)
      currentGreed = currentGreed * variation
    currentGreed

  @calculateSeasonCasts = (greed) ->
    totalFish = @ocean.certainFish + @ocean.mysteryFish
    spawn = @ocean.microworld.params.spawnFactor
    numFishers = @ocean.fishers.length
    chanceCatch = @ocean.microworld.params.chanceCatch
    Math.round ((totalFish - (totalFish / spawn)) / numFishers) * 2 * greed / chanceCatch

  @prepareFisherForSeason = (season) ->
    @season = season
    @seasonData[season] =
      actualCasts: 0
      greed: (if @isBot() then @calculateSeasonGreed() else `undefined`)
      fishCaught: 0
      startMoney: 0
      endMoney: 0

    @seasonData[season].intendedCasts = (if @isBot() then @calculateSeasonCasts(@seasonData[season].greed) else `undefined`)
    @hasReturned = false
    return

  @changeMoney = (amount) ->
    @money += amount
    @seasonData[@season].endMoney += amount
    return

  @incrementCast = ->
    @seasonData[@season].actualCasts++
    return

  @incrementFishCaught = ->
    @totalFishCaught++
    @seasonData[@season].fishCaught++
    return

  @goToPort = ->
    if @status isnt "At port"
      @status = "At port"
      @hasReturned = true
      @ocean.log.info "Fisher " + @name + " returned to port."
    return

  @goToSea = ->
    @status = "At sea"
    @changeMoney -@ocean.microworld.params.costDeparture
    @ocean.log.info "Fisher " + @name + " sailed to sea."
    return

  @tryToFish = ->
    @changeMoney -@ocean.microworld.params.costCast
    @incrementCast()
    if @ocean.isSuccessfulCastAttempt()
      @changeMoney @ocean.microworld.params.fishValue
      @incrementFishCaught()
      @ocean.takeOneFish()
      @ocean.log.info "Fisher " + @name + " caught one fish."
    else
      @ocean.log.info "Fisher " + @name + " tried to catch " + "a fish, and failed."
    return

  @runBot = ->
    @changeMoney -@ocean.microworld.params.costSecond  if @status is "At sea"
    return  unless @isBot()

    # If I'm an erratic bot, randomly return early and don't do anything
    if @isErratic() and Math.random() > @params.probAction
      return

    # If I'm a regular bot, randomly go to sea and randomly return to port
    if !@isErratic()
      if @status is "At port" and Math.random() > @params.probAction
        @goToSea()
      else if @status is "At sea" and Math.random > @params.probAction
        @goToPort()

    # Am I done?
    @goToPort() if @getIntendedCasts() <= @getActualCasts()

    @tryToFish() if @status is "At sea" and @ocean.areThereFish()

    return

  return
