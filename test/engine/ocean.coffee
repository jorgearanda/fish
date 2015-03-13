"use strict"

#global describe:true, it:true
should = require("should")
Ocean = require("../../engine/ocean").Ocean
o = undefined
io = undefined
mw = undefined
describe "Engine - Ocean", ->
  beforeEach (done) ->
    io = require("../../app").io
    mw =
      name: "Test Microworld"
      experimenter:
        username: "AnExperimenter"

      params:
        numFishers: 4
        seasonDuration: 10
        enableEarlyEnd: true
        initialDelay: 5
        seasonDelay: 5
        certainFish: 10
        availableMysteryFish: 0
        reportedMysteryFish: 0
        fishValue: 1.0
        costDeparture: 0.0
        costSecond: 0.0
        costCast: 0.1
        chanceCatch: 1.0
        bots: [
          {
            name: "bot 1"
          }
          {
            name: "bot 2"
          }
          {
            name: "bot 3"
          }
        ]

    o = new Ocean(mw, io)
    done()

  it "should initialize with default settings", (done) ->
    o.time.should.be.ok
    o.id.should.be.ok
    o.status.should.equal "setup"
    o.fishers.length.should.equal 3
    o.season.should.equal 0
    o.seconds.should.equal 0
    o.warnSeconds.should.equal 3
    o.secondsSinceAllReturned.should.equal 0
    o.certainFish.should.equal 0
    o.mysteryFish.should.equal 0
    o.reportedMysteryFish.should.equal 0
    o.microworld.name.should.equal "Test Microworld"
    o.microworld.experimenter.username.should.equal "AnExperimenter"
    o.results.length.should.equal 0
    o.log.should.be.ok
    done()

  describe "hasRoom()", ->
    it "should return true if there are fishing spots left", (done) ->
      o.hasRoom().should.equal true
      o.fishers.push {}
      o.hasRoom().should.equal false
      done()

    return

  describe "allHumansIn()", ->
    it "should return true if there are no fishing spots left", (done) ->
      o.allHumansIn().should.equal false
      o.fishers.push {}
      o.allHumansIn().should.equal true
      done()

    return

  describe "addFisher()", ->
    it "should add a fisher to the fishers array", (done) ->
      o.addFisher "p001"
      o.fishers.length.should.equal 4
      o.fishers[3].type.should.equal "human"
      o.log.entries.length.should.equal 1
      done()

    return

  describe "removeFisher()", ->
    it "should remove a human fisher from the fishers array, if it is present", (done) ->
      o.addFisher "p001"
      o.removeFisher "p001"
      o.fishers.length.should.equal 3
      o.log.entries.length.should.equal 2
      done()

    it "should remove the right human fisher from the fishers array", (done) ->
      o.addFisher "p001"
      o.addFisher "p002"
      o.removeFisher "p001"
      o.fishers.length.should.equal 4
      o.fishers[3].name.should.equal "p002"
      done()

    it "should not remove a fisher if the name is not found", (done) ->
      o.addFisher "p001"
      o.removeFisher "unexistent"
      o.fishers.length.should.equal 4
      done()

    return

  describe "findFisherIndex()", ->
    it "should find the location of a fisher in the fishers array", (done) ->
      o.addFisher "p001"
      o.findFisherIndex("bot 1").should.equal 0
      o.findFisherIndex("bot 2").should.equal 1
      o.findFisherIndex("bot 3").should.equal 2
      o.findFisherIndex("p001").should.equal 3
      done()

    return

  describe "isEveryoneReady()", ->
    it "should return false when not all fishers have joined", (done) ->
      o.isEveryoneReady().should.equal false
      done()

    it "should return false when humans are not ready", (done) ->
      o.addFisher "p001"
      o.isEveryoneReady().should.equal false
      done()

    it "should return true when humans are ready", (done) ->
      o.addFisher "p001"
      o.addFisher "p002"
      o.fishers[3].ready = true
      o.isEveryoneReady().should.equal false
      o.fishers[4].ready = true
      o.isEveryoneReady().should.equal true
      done()

    return

  describe "hasEveryoneReturned()", ->
    it "should only return true when every fisher's hasReturned field is true", (done) ->
      o.addFisher "p001"
      o.hasEveryoneReturned().should.equal false
      o.fishers[0].hasReturned = true
      o.hasEveryoneReturned().should.equal false
      o.fishers[3].hasReturned = true
      o.hasEveryoneReturned().should.equal false
      o.fishers[1].hasReturned = true
      o.fishers[2].hasReturned = true
      o.hasEveryoneReturned().should.equal true
      done()

    return

  describe "shouldEndSeason()", ->
    it "should return false when the season still has seconds to go and not all fishers have returned", (done) ->
      o.addFisher "p001"
      o.shouldEndSeason().should.equal false
      o.seconds = 5
      o.shouldEndSeason().should.equal false
      o.fishers[3].hasReturned = true
      o.shouldEndSeason().should.equal false
      done()

    it "should return true when the season has no more seconds to go", (done) ->
      o.addFisher "p001"
      o.seconds = 10
      o.shouldEndSeason().should.equal true
      done()

    it "should return false when all fishers have returned and enableEarlyEnd is false", (done) ->
      o.microworld.params.enableEarlyEnd = false
      o.addFisher "p001"
      o.fishers[0].hasReturned = true
      o.fishers[1].hasReturned = true
      o.fishers[2].hasReturned = true
      o.fishers[3].hasReturned = true
      o.secondsSinceAllReturned = 3
      o.shouldEndSeason().should.equal false
      done()

    it "should return true when all fishers have returned, enableEarlyEnd is true, and three seconds have passed", (done) ->
      o.addFisher "p001"
      o.fishers[0].hasReturned = true
      o.fishers[1].hasReturned = true
      o.fishers[2].hasReturned = true
      o.fishers[3].hasReturned = true
      o.secondsSinceAllReturned = 3
      o.shouldEndSeason().should.equal true
      done()

    it "should return false when all fishers have returned, enableEarlyEnd is true, but three seconds have not passed", (done) ->
      o.addFisher "p001"
      o.fishers[0].hasReturned = true
      o.fishers[1].hasReturned = true
      o.fishers[2].hasReturned = true
      o.fishers[3].hasReturned = true
      o.secondsSinceAllReturned = 2
      o.shouldEndSeason().should.equal false
      done()

    return

  describe "pause()", ->
    it "should not pause if the simulation is not in running nor resting state", (done) ->
      o.pause "MrPause"
      o.status.should.equal "setup"
      o.status = "initial delay"
      o.pause "MrPause"
      o.status.should.equal "initial delay"
      o.status = "over"
      o.pause "MrPause"
      o.status.should.equal "over"
      done()

    it "should enter the pause state if the simulation is running or resting", (done) ->
      o.status = "running"
      o.pause "MrPause"
      o.status.should.equal "paused"
      o.unpauseState.should.equal "running"
      o.pausedBy.should.equal "MrPause"
      o = new Ocean(mw, io)
      o.status = "resting"
      o.pause "MrPause"
      o.status.should.equal "paused"
      o.unpauseState.should.equal "resting"
      o.pausedBy.should.equal "MrPause"
      done()

    it "should notify clients that the simulation was paused", (done) ->
      socket = require("socket.io-client")("http://localhost:8080",
        multiplex: false
      )
      socket.on "connect", ->
        socket.on "pause", ->
          socket.disconnect()
          done()

        o.status = "running"
        o.pause "MrPause"
        return

      io.sockets.on "connection", (socket) ->
        socket.join o.id
        return

      return

    return

  describe "resume()", ->
    it "should return to the status prior to paused", (done) ->
      o.status = "running"
      o.pause "MrPause"
      o.status.should.equal "paused"
      o.resume "MrPause"
      o.status.should.equal "running"
      done()

    it "should not return to the status prior to paused if the request comes from someone else", (done) ->
      o.status = "running"
      o.pause "MrPause"
      o.status.should.equal "paused"
      o.resume "SomeoneElse"
      o.status.should.equal "paused"
      done()

    it "should notify clients that the simulation has resumed", (done) ->
      socket = require("socket.io-client")("http://localhost:8080",
        multiplex: false
      )
      socket.on "connect", ->
        socket.on "resume", ->
          socket.disconnect()
          done()

        o.status = "running"
        o.pause "MrPause"
        o.resume "MrPause"
        return

      io.sockets.on "connection", (socket) ->
        socket.join o.id
        return

      return

    return

  describe "getSimStatus()", ->
    it "should return the relevant status information", (done) ->
      o.season = 1
      o.status = "running"
      o.fishers[0].prepareFisherForSeason 1
      o.fishers[1].prepareFisherForSeason 1
      st = o.getSimStatus()
      st.season.should.equal 1
      st.status.should.equal "running"
      st.certainFish.should.equal 0
      st.mysteryFish.should.equal 0
      st.reportedMysteryFish.should.equal 0
      st.fishers.length.should.equal 3
      st.fishers[0].name.should.equal "bot 1"
      st.fishers[0].seasonData[1].fishCaught.should.equal 0
      done()

    return

  describe "resetTimer()", ->
    it "should set the seconds count back to zero", (done) ->
      o.seconds = 20
      o.resetTimer()
      o.seconds.should.equal 0
      done()

    return

  describe "tick()", ->
    it "should increment the seconds count", (done) ->
      o.tick()
      o.seconds.should.equal 1
      o.tick()
      o.seconds.should.equal 2
      done()

    it "should increment the secondsSinceAllReturned count, if everyone returned", (done) ->
      o.fishers[0].hasReturned = true
      o.fishers[1].hasReturned = true
      o.fishers[2].hasReturned = true
      o.tick()
      o.secondsSinceAllReturned.should.equal 1
      o.tick()
      o.secondsSinceAllReturned.should.equal 2
      done()

    it "should not increment the secondsSinceAllReturned count, if not everyone returned", (done) ->
      o.fishers[0].hasReturned = true
      o.fishers[1].hasReturned = true
      o.tick()
      o.secondsSinceAllReturned.should.equal 0
      o.tick()
      o.secondsSinceAllReturned.should.equal 0
      done()

    return

  describe "hasReachedInitialDelay()", ->
    it "should report whether seconds has reached the initialDelay parameter", (done) ->
      o.hasReachedInitialDelay().should.equal false
      o.seconds = 5
      o.hasReachedInitialDelay().should.equal true
      done()

    return

  describe "hasReachedSeasonDelay()", ->
    it "should report whether seconds has reached the seasonDelay parameter", (done) ->
      o.hasReachedSeasonDelay().should.equal false
      o.seconds = 5
      o.hasReachedSeasonDelay().should.equal true
      done()

    return

  describe "hasReachedSeasonDuration()", ->
    it "should report whether seconds has reached the seasonDuration parameter", (done) ->
      o.hasReachedSeasonDuration().should.equal false
      o.seconds = 10
      o.hasReachedSeasonDuration().should.equal true
      done()

    return

  describe "readRules()", ->
    it "should set the ready flag of a human fisher to true", (done) ->
      o.addFisher "p001"
      o.fishers[3].ready.should.equal false
      o.readRules "p001"
      o.fishers[3].ready.should.equal true
      done()

    return

  describe "attemptToFish()", ->
    it "should catch a fish for the fisher when chanceCatch is 1.0", (done) ->
      o.addFisher "p001"
      o.readRules "p001"
      o.season = 1
      o.setAvailableFish()
      o.fishers[0].prepareFisherForSeason 1
      o.fishers[1].prepareFisherForSeason 1
      o.fishers[2].prepareFisherForSeason 1
      o.fishers[3].prepareFisherForSeason 1
      o.status = "running"
      o.attemptToFish "p001"
      o.certainFish.should.equal 9
      o.fishers[3].totalFishCaught.should.equal 1
      o.fishers[3].money.should.equal 0.9
      o.fishers[3].seasonData[1].actualCasts.should.equal 1
      o.fishers[3].seasonData[1].fishCaught.should.equal 1
      o.fishers[3].seasonData[1].startMoney.should.equal 0
      o.fishers[3].seasonData[1].endMoney.should.equal 0.9
      done()

    it "should not catch a fish for the fisher when chanceCatch is 0.0", (done) ->
      o.addFisher "p001"
      o.readRules "p001"
      o.microworld.params.chanceCatch = 0.0
      o.season = 1
      o.setAvailableFish()
      o.fishers[0].prepareFisherForSeason 1
      o.fishers[1].prepareFisherForSeason 1
      o.fishers[2].prepareFisherForSeason 1
      o.fishers[3].prepareFisherForSeason 1
      o.status = "running"
      o.attemptToFish "p001"
      o.certainFish.should.equal 10
      o.fishers[3].totalFishCaught.should.equal 0
      o.fishers[3].money.should.equal -0.1
      o.fishers[3].seasonData[1].actualCasts.should.equal 1
      o.fishers[3].seasonData[1].fishCaught.should.equal 0
      o.fishers[3].seasonData[1].startMoney.should.equal 0
      o.fishers[3].seasonData[1].endMoney.should.equal -0.1
      done()

    it "should not catch a fish if there are no more fish", (done) ->
      o.addFisher "p001"
      o.readRules "p001"
      o.microworld.params.chanceCatch = 1.0
      o.season = 1
      o.setAvailableFish()
      o.certainFish = 0
      o.fishers[0].prepareFisherForSeason 1
      o.fishers[1].prepareFisherForSeason 1
      o.fishers[2].prepareFisherForSeason 1
      o.fishers[3].prepareFisherForSeason 1
      o.status = "running"
      o.attemptToFish "p001"
      o.certainFish.should.equal 0
      o.fishers[3].totalFishCaught.should.equal 0
      o.fishers[3].money.should.equal -0.1
      o.fishers[3].seasonData[1].actualCasts.should.equal 1
      o.fishers[3].seasonData[1].fishCaught.should.equal 0
      o.fishers[3].seasonData[1].startMoney.should.equal 0
      o.fishers[3].seasonData[1].endMoney.should.equal -0.1
      done()

    return

  return

