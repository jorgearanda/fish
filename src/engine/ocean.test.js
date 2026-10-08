'use strict';
/*global describe:true, it:true*/

var should = require('should');
var mongoose = require('mongoose');

var Ocean = require('./ocean').Ocean;
var o, io, ioAdmin, mw;

// Play resumes after a countdown run by the game loop; run it to the end
function finishResume(ocean) {
  for (var i = 0; i < 100 && ocean.resumingIn !== null; i++) ocean.advanceResumeCountdown();
}

describe('Engine - Ocean', function() {
  beforeEach(function(done) {
    io = require('../app').io;
    ioAdmin = require('../app').ioAdmin;
    mw = {
      name: 'Test Microworld',
      status: 'test',
      experimenter: {
        _id: new mongoose.Types.ObjectId(),
        username: 'AnExperimenter',
      },
      params: {
        numFishers: 4,
        seasonDuration: 10,
        enableEarlyEnd: true,
        initialDelay: 5,
        seasonDelay: 5,
        certainFish: 10,
        availableMysteryFish: 0,
        reportedMysteryFish: 0,
        fishValue: 1.0,
        costDeparture: 0.0,
        costSecond: 0.0,
        costCast: 0.1,
        chanceCatch: 1.0,
        numSeasons: 4,
        catchIntentionsEnabled: false,
        catchIntentDialogDuration: 17,
        catchIntentSeasons: [2,4,6,8],
        profitSeasonDisabled: false,
        profitTotalDisabled: false,
        profitGapDisabled: true,
        bots: [
          {
            name: 'bot 1',
          },
          {
            name: 'bot 2',
          },
          {
            name: 'bot 3',
          },
        ],
      },
    };
    o = new Ocean(mw, io, ioAdmin);
    return done();
  });

  it('should initialize with default settings', function(done) {
    o.time.should.be.ok;
    o.id.should.be.ok;
    o.status.should.equal('setup');
    o.fishers.length.should.equal(3);
    o.season.should.equal(0);
    o.seconds.should.equal(0);
    o.warnSeconds.should.equal(3);
    o.secondsSinceAllReturned.should.equal(0);
    o.certainFish.should.equal(0);
    o.mysteryFish.should.equal(0);
    o.reportedMysteryFish.should.equal(0);
    o.microworld.name.should.equal('Test Microworld');
    o.microworld.experimenter.username.should.equal('AnExperimenter');
    o.results.length.should.equal(0);
    o.log.should.be.ok;
    return done();
  });

  describe('hasRoom()', function() {
    it('should return true if there are fishing spots left', function(done) {
      o.hasRoom().should.equal(true);
      o.fishers.push({});
      o.hasRoom().should.equal(false);
      return done();
    });
  });

  describe('allHumansIn()', function() {
    it('should return true if there are no fishing spots left', function(done) {
      o.allHumansIn().should.equal(false);
      o.fishers.push({});
      o.allHumansIn().should.equal(true);
      return done();
    });
  });

  describe('addFisher()', function() {
    it('should add a fisher to the fishers array', function(done) {
      o.addFisher('p001');
      o.fishers.length.should.equal(4);
      o.fishers[3].type.should.equal('human');
      o.log.entries.length.should.equal(1);
      return done();
    });

    it('should assign default fisher class when classes enabled and no fClass provided', function(done) {
      mw.params.fisherClassesEnabled = true;
      mw.params.fisherClasses = ['Class A', 'Class B'];
      mw.params.fisherClassEmojis = { 'Class A': '⭐', 'Class B': '🔵' };
      var oWithClasses = new Ocean(mw, io, ioAdmin, { endOcean: function(){} });
      oWithClasses.addFisher('p001', {});
      oWithClasses.fishers[3].params.fClass.should.equal('Class A');
      // Clean up
      delete mw.params.fisherClassesEnabled;
      delete mw.params.fisherClasses;
      delete mw.params.fisherClassEmojis;
      return done();
    });

    it('should keep valid fisher class when classes enabled and valid fClass provided', function(done) {
      mw.params.fisherClassesEnabled = true;
      mw.params.fisherClasses = ['Class A', 'Class B'];
      mw.params.fisherClassEmojis = { 'Class A': '⭐', 'Class B': '🔵' };
      var oWithClasses = new Ocean(mw, io, ioAdmin, { endOcean: function(){} });
      oWithClasses.addFisher('p001', { fClass: 'Class B' });
      oWithClasses.fishers[3].params.fClass.should.equal('Class B');
      // Clean up
      delete mw.params.fisherClassesEnabled;
      delete mw.params.fisherClasses;
      delete mw.params.fisherClassEmojis;
      return done();
    });

    it('should assign default fisher class when classes enabled and invalid fClass provided', function(done) {
      mw.params.fisherClassesEnabled = true;
      mw.params.fisherClasses = ['Class A', 'Class B'];
      mw.params.fisherClassEmojis = { 'Class A': '⭐', 'Class B': '🔵' };
      var oWithClasses = new Ocean(mw, io, ioAdmin, { endOcean: function(){} });
      oWithClasses.addFisher('p001', { fClass: 'InvalidClass' });
      oWithClasses.fishers[3].params.fClass.should.equal('Class A');
      // Clean up
      delete mw.params.fisherClassesEnabled;
      delete mw.params.fisherClasses;
      delete mw.params.fisherClassEmojis;
      return done();
    });

    it('should match fisher class case-insensitively and normalize to canonical name', function(done) {
      mw.params.fisherClassesEnabled = true;
      mw.params.fisherClasses = ['Class A', 'Class B'];
      mw.params.fisherClassEmojis = { 'Class A': '⭐', 'Class B': '🔵' };
      var oWithClasses = new Ocean(mw, io, ioAdmin, { endOcean: function(){} });
      oWithClasses.addFisher('p001', { fClass: 'class b' });
      oWithClasses.fishers[3].params.fClass.should.equal('Class B');
      oWithClasses.addFisher('p002', { fClass: 'CLASS A' });
      oWithClasses.fishers[4].params.fClass.should.equal('Class A');
      // Clean up
      delete mw.params.fisherClassesEnabled;
      delete mw.params.fisherClasses;
      delete mw.params.fisherClassEmojis;
      return done();
    });
  });

  describe('removeFisher()', function() {
    it('should remove a human fisher from the fishers array, if it is present', function(done) {
      o.addFisher('p001');
      o.removeFisher('p001');
      o.fishers.length.should.equal(3);
      o.log.entries.length.should.equal(3); // addFisher, removeFisher, and endOcean logging
      return done();
    });

    it('should remove the right human fisher from the fishers array', function(done) {
      o.addFisher('p001');
      o.addFisher('p002');
      o.removeFisher('p001');
      o.fishers.length.should.equal(4);
      o.fishers[3].name.should.equal('p002');
      return done();
    });

    it('should not remove a fisher if the name is not found', function(done) {
      o.addFisher('p001');
      o.removeFisher('unexistent');
      o.fishers.length.should.equal(4);
      return done();
    });
  });

  describe('findFisherIndex()', function() {
    it('should find the location of a fisher in the fishers array', function(done) {
      o.addFisher('p001');
      o.findFisherIndex('bot 1').should.equal(0);
      o.findFisherIndex('bot 2').should.equal(1);
      o.findFisherIndex('bot 3').should.equal(2);
      o.findFisherIndex('p001').should.equal(3);
      return done();
    });
  });

  describe('isEveryoneReady()', function() {
    it('should return false when not all fishers have joined', function(done) {
      o.isEveryoneReady().should.equal(false);
      return done();
    });

    it('should return false when humans are not ready', function(done) {
      o.addFisher('p001');
      o.isEveryoneReady().should.equal(false);
      return done();
    });

    it('should return true when humans are ready', function(done) {
      o.addFisher('p001');
      o.addFisher('p002');
      o.fishers[3].ready = true;
      o.isEveryoneReady().should.equal(false);
      o.fishers[4].ready = true;
      o.isEveryoneReady().should.equal(true);
      return done();
    });
  });

  describe('hasEveryoneReturned()', function() {
    it("should only return true when every fisher's hasReturned field is true", function(done) {
      o.addFisher('p001');
      o.hasEveryoneReturned().should.equal(false);
      o.fishers[0].hasReturned = true;
      o.hasEveryoneReturned().should.equal(false);
      o.fishers[3].hasReturned = true;
      o.hasEveryoneReturned().should.equal(false);
      o.fishers[1].hasReturned = true;
      o.fishers[2].hasReturned = true;
      o.hasEveryoneReturned().should.equal(true);
      return done();
    });
  });

  describe('shouldEndSeason()', function() {
    it('should return false when the season still has seconds to go and not all fishers have returned', function(done) {
      o.addFisher('p001');
      o.shouldEndSeason().should.equal(false);
      o.seconds = 5;
      o.shouldEndSeason().should.equal(false);
      o.fishers[3].hasReturned = true;
      o.shouldEndSeason().should.equal(false);
      return done();
    });

    it('should return true when the season has no more seconds to go', function(done) {
      o.addFisher('p001');
      o.seconds = 10;
      o.shouldEndSeason().should.equal(true);
      return done();
    });

    it('should return false when all fishers have returned and enableEarlyEnd is false', function(done) {
      o.microworld.params.enableEarlyEnd = false;
      o.addFisher('p001');
      o.fishers[0].hasReturned = true;
      o.fishers[1].hasReturned = true;
      o.fishers[2].hasReturned = true;
      o.fishers[3].hasReturned = true;
      o.secondsSinceAllReturned = 3;
      o.shouldEndSeason().should.equal(false);
      return done();
    });

    it('should return true when all fishers have returned, enableEarlyEnd is true, and three seconds have passed', function(done) {
      o.addFisher('p001');
      o.fishers[0].hasReturned = true;
      o.fishers[1].hasReturned = true;
      o.fishers[2].hasReturned = true;
      o.fishers[3].hasReturned = true;
      o.secondsSinceAllReturned = 3;
      o.shouldEndSeason().should.equal(true);
      return done();
    });

    it('should return false when all fishers have returned, enableEarlyEnd is true, but three seconds have not passed', function(done) {
      o.addFisher('p001');
      o.fishers[0].hasReturned = true;
      o.fishers[1].hasReturned = true;
      o.fishers[2].hasReturned = true;
      o.fishers[3].hasReturned = true;
      o.secondsSinceAllReturned = 2;
      o.shouldEndSeason().should.equal(false);
      return done();
    });
  });

  describe('pause()', function() {
    it('should not pause if the simulation is not in running nor resting state', function(done) {
      o.pause('MrPause');
      o.status.should.equal('setup');
      o.status = 'initial delay';
      o.pause('MrPause');
      o.status.should.equal('initial delay');
      o.status = 'over';
      o.pause('MrPause');
      o.status.should.equal('over');
      return done();
    });

    it('should enter the pause state if the simulation is running or resting', function(done) {
      o.status = 'running';
      o.pause('MrPause');
      o.status.should.equal('paused');
      o.unpauseState.should.equal('running');
      o.pausedBy.should.equal('MrPause');

      o = new Ocean(mw, io);
      o.status = 'resting';
      o.pause('MrPause');
      o.status.should.equal('paused');
      o.unpauseState.should.equal('resting');
      o.pausedBy.should.equal('MrPause');
      return done();
    });

    it('should notify clients that the simulation was paused', function(done) {
      var socket = require('socket.io-client')('http://localhost:8080', { multiplex: false });
      socket.on('connect', function() {
        socket.on('pause', function() {
          socket.disconnect();
          return done();
        });
        o.status = 'running';
        o.pause('MrPause');
      });

      io.sockets.on('connection', function(socket) {
        socket.join(o.id);
      });
    });
  });

  describe('resume()', function() {
    it('should return to the status prior to paused', function(done) {
      o.status = 'running';
      o.pause('MrPause');
      o.status.should.equal('paused');

      o.resume('MrPause');
      // Counts down for the initial delay (5 s here) first
      o.status.should.equal('paused');
      o.resumingIn.should.equal(5);
      finishResume(o);
      o.status.should.equal('running');
      return done();
    });

    it('should count down one second per loop tick before resuming', function() {
      o.status = 'running';
      o.pause('MrPause');
      o.resume('MrPause');
      o.advanceResumeCountdown();
      o.resumingIn.should.equal(4);
      o.getSimStatus().resumingIn.should.equal(4);
      o.advanceResumeCountdown();
      o.advanceResumeCountdown();
      o.advanceResumeCountdown();
      o.status.should.equal('paused');
      o.advanceResumeCountdown();
      o.status.should.equal('running');
      should(o.resumingIn).be.null();
    });

    it('should count down the initial delay, but at least 2 and at most 5 seconds', function() {
      [[0, 2], [1, 2], [2, 2], [3, 3], [5, 5], [8, 5], [30, 5], [undefined, 2]].forEach(function(c) {
        o.microworld.params.initialDelay = c[0];
        o.resumeCountdownSeconds().should.equal(c[1], 'initial delay ' + c[0]);
      });
    });

    it('should cancel the countdown if the game is paused again', function() {
      o.addFisher('p001');
      o.microworld.params.disconnectHandlingEnabled = true;
      o.microworld.params.disconnectDuringGrace = 'pause';
      o.microworld.params.disconnectGracePeriod = 30;
      o.microworld.params.disconnectsAllowed = 3;
      o.status = 'running';
      o.pause('MrPause');
      o.resume('MrPause');
      o.fisherDisconnected('p001'); // someone drops during the countdown
      o.advanceResumeCountdown();
      should(o.resumingIn).be.null();
      o.status.should.equal('paused');
      o.clearDisconnectTimers();
    });

    it('should report the phase length for the clock, also while paused', function() {
      o.status = 'running';
      o.getSimStatus().phaseLength.should.equal(10); // seasonDuration
      o.pause('MrPause');
      o.getSimStatus().phaseLength.should.equal(10);
      o.status = 'resting';
      o.getSimStatus().phaseLength.should.equal(5); // seasonDelay
      o.status = 'initial delay';
      o.getSimStatus().phaseLength.should.equal(5); // initialDelay
    });

    it('should not return to the status prior to paused if the request comes from someone else', function(done) {
      o.status = 'running';
      o.pause('MrPause');
      o.status.should.equal('paused');

      o.resume('SomeoneElse');
      o.status.should.equal('paused');
      return done();
    });

    it('should notify clients that the simulation has resumed', function(done) {
      var socket = require('socket.io-client')('http://localhost:8080', { multiplex: false });
      socket.on('connect', function() {
        socket.on('resume', function() {
          socket.disconnect();
          return done();
        });
        o.status = 'running';
        o.pause('MrPause');
        o.resume('MrPause');
        finishResume(o);
      });

      io.sockets.on('connection', function(socket) {
        socket.join(o.id);
      });
    });
  });

  describe('getSimStatus()', function() {
    it('should return the relevant status information', function(done) {
      o.season = 1;
      o.status = 'running';
      o.fishers[0].prepareFisherForSeason(1);
      o.fishers[1].prepareFisherForSeason(1);
      var st = o.getSimStatus();
      st.season.should.equal(1);
      st.status.should.equal('running');
      st.certainFish.should.equal(0);
      st.mysteryFish.should.equal(0);
      st.reportedMysteryFish.should.equal(0);
      st.fishers.length.should.equal(3);
      st.fishers[0].name.should.equal('bot 1');
      st.fishers[0].seasonData[1].fishCaught.should.equal(0);
      st.fishers[0].totalCasts.should.equal(0);
      st.fishers[0].totalDepartures.should.equal(0);
      st.fishers[0].totalSecondsAtSea.should.equal(0);
      return done();
    });
  });

  describe('resetTimer()', function() {
    it('should set the seconds count back to zero', function(done) {
      o.seconds = 20;
      o.resetTimer();
      o.seconds.should.equal(0);
      return done();
    });
  });

  describe('tick()', function() {
    it('should increment the seconds count', function(done) {
      o.tick();
      o.seconds.should.equal(1);
      o.tick();
      o.seconds.should.equal(2);
      return done();
    });

    it('should increment the secondsSinceAllReturned count, if everyone returned', function(done) {
      o.fishers[0].hasReturned = true;
      o.fishers[1].hasReturned = true;
      o.fishers[2].hasReturned = true;
      o.tick();
      o.secondsSinceAllReturned.should.equal(1);
      o.tick();
      o.secondsSinceAllReturned.should.equal(2);
      return done();
    });

    it('should not increment the secondsSinceAllReturned count, if not everyone returned', function(done) {
      o.fishers[0].hasReturned = true;
      o.fishers[1].hasReturned = true;
      o.tick();
      o.secondsSinceAllReturned.should.equal(0);
      o.tick();
      o.secondsSinceAllReturned.should.equal(0);
      return done();
    });
  });

  describe('hasReachedInitialDelay()', function() {
    it('should report whether seconds has reached the initialDelay parameter', function(done) {
      o.hasReachedInitialDelay().should.equal(false);
      o.seconds = 5;
      o.hasReachedInitialDelay().should.equal(true);
      return done();
    });
  });

  describe('hasReachedSeasonDelay()', function() {
    it('should report whether seconds has reached the seasonDelay parameter', function(done) {
      o.seconds = 1;
      o.hasReachedSeasonDelay().should.equal(false);
      o.seconds = 5;
      o.hasReachedSeasonDelay().should.equal(true);
      return done();
    });
  });

  describe('hasReachedSeasonDuration()', function() {
    it('should report whether seconds has reached the seasonDuration parameter', function(done) {
      o.hasReachedSeasonDuration().should.equal(false);
      o.seconds = 10;
      o.hasReachedSeasonDuration().should.equal(true);
      return done();
    });
  });

  describe('readRules()', function() {
    it('should set the ready flag of a human fisher to true', function(done) {
      o.addFisher('p001');
      o.fishers[3].ready.should.equal(false);
      o.readRules('p001');
      o.fishers[3].ready.should.equal(true);
      return done();
    });

    it('should set readyTime on the fisher', function(done) {
      o.addFisher('p001');
      var should = require('should');
      should.equal(o.fishers[3].readyTime, null);
      var before = Date.now();
      o.readRules('p001');
      var after = Date.now();
      o.fishers[3].readyTime.should.be.within(before, after);
      return done();
    });

    it('should leave entryTime unchanged after readRules', function(done) {
      o.addFisher('p001');
      var entryTime = o.fishers[3].entryTime;
      o.readRules('p001');
      o.fishers[3].entryTime.should.equal(entryTime);
      return done();
    });
  });

  describe('bot lobby timestamps', function() {
    it('should offset bot entryTime by k minutes for the kth bot', function(done) {
      var now = Date.now();
      // formula: (botIdx * 60 + rand * 60) * 1000, so bot k falls in [k*60s, (k+1)*60s] before now
      o.fishers[0].entryTime.should.be.within(now - 61000, now + 1000);
      o.fishers[1].entryTime.should.be.within(now - 121000, now - 59000);
      o.fishers[2].entryTime.should.be.within(now - 181000, now - 119000);
      return done();
    });

    it('should offset bot readyTime by k minutes for the kth bot', function(done) {
      var now = Date.now();
      o.fishers[0].readyTime.should.be.within(now - 61000, now + 1000);
      o.fishers[1].readyTime.should.be.within(now - 121000, now - 59000);
      o.fishers[2].readyTime.should.be.within(now - 181000, now - 119000);
      return done();
    });
  });

  describe('getLobbyStatus()', function() {
    it('should return numFishers slots', function(done) {
      var status = o.getLobbyStatus();
      status.slots.length.should.equal(mw.params.numFishers);
      return done();
    });

    it('should fill slots for existing fishers and pad missing slots with null', function(done) {
      // 3 bots present, 1 human slot missing (numFishers = 4)
      var status = o.getLobbyStatus();
      status.slots[0].should.not.equal(null);
      status.slots[1].should.not.equal(null);
      status.slots[2].should.not.equal(null);
      should.equal(status.slots[3], null);
      return done();
    });

    it('should include entryTime and readyTime for present fishers', function(done) {
      var status = o.getLobbyStatus();
      status.slots[0].should.have.property('entryTime');
      status.slots[0].should.have.property('readyTime');
      return done();
    });

    it('should show null readyTime for a human fisher who has not yet read rules', function(done) {
      o.addFisher('p001');
      var status = o.getLobbyStatus();
      should.equal(status.slots[3].readyTime, null);
      return done();
    });

    it('should show non-null readyTime after fisher reads rules', function(done) {
      o.addFisher('p001');
      o.readRules('p001');
      var status = o.getLobbyStatus();
      status.slots[3].readyTime.should.be.ok;
      return done();
    });

    it('should have no missing slots once all fishers have joined', function(done) {
      o.addFisher('p001');
      var status = o.getLobbyStatus();
      status.slots.forEach(function(slot) {
        should.exist(slot);
      });
      return done();
    });
  });

  describe('attemptToFish()', function() {
    it('should catch a fish for the fisher when chanceCatch is 1.0', function(done) {
      o.addFisher('p001');
      o.readRules('p001');
      o.season = 1;
      o.setAvailableFish();
      o.fishers[0].prepareFisherForSeason(1);
      o.fishers[1].prepareFisherForSeason(1);
      o.fishers[2].prepareFisherForSeason(1);
      o.fishers[3].prepareFisherForSeason(1);
      o.status = 'running';
      o.fishers[3].status = 'At sea';
      o.attemptToFish('p001');
      o.certainFish.should.equal(9);
      o.fishers[3].totalFishCaught.should.equal(1);
      o.fishers[3].money.should.equal(0.9);
      o.fishers[3].seasonData[1].actualCasts.should.equal(1);
      o.fishers[3].seasonData[1].fishCaught.should.equal(1);
      o.fishers[3].seasonData[1].startMoney.should.equal(0);
      o.fishers[3].seasonData[1].endMoney.should.equal(0.9);
      return done();
    });

    it('should not catch a fish for the fisher when chanceCatch is 0.0', function(done) {
      o.addFisher('p001');
      o.readRules('p001');
      o.microworld.params.chanceCatch = 0.0;
      o.season = 1;
      o.setAvailableFish();
      o.fishers[0].prepareFisherForSeason(1);
      o.fishers[1].prepareFisherForSeason(1);
      o.fishers[2].prepareFisherForSeason(1);
      o.fishers[3].prepareFisherForSeason(1);
      o.status = 'running';
      o.fishers[3].status = 'At sea';
      o.attemptToFish('p001');
      o.certainFish.should.equal(10);
      o.fishers[3].totalFishCaught.should.equal(0);
      o.fishers[3].money.should.equal(-0.1);
      o.fishers[3].seasonData[1].actualCasts.should.equal(1);
      o.fishers[3].seasonData[1].fishCaught.should.equal(0);
      o.fishers[3].seasonData[1].startMoney.should.equal(0);
      o.fishers[3].seasonData[1].endMoney.should.equal(-0.1);
      return done();
    });

    it('should not catch a fish if there are no more fish', function(done) {
      o.addFisher('p001');
      o.readRules('p001');
      o.microworld.params.chanceCatch = 1.0;
      o.season = 1;
      o.setAvailableFish();
      o.certainFish = 0;
      o.fishers[0].prepareFisherForSeason(1);
      o.fishers[1].prepareFisherForSeason(1);
      o.fishers[2].prepareFisherForSeason(1);
      o.fishers[3].prepareFisherForSeason(1);
      o.status = 'running';
      o.fishers[3].status = 'At sea';
      o.attemptToFish('p001');
      o.certainFish.should.equal(0);
      o.fishers[3].totalFishCaught.should.equal(0);
      o.fishers[3].money.should.equal(-0.1);
      o.fishers[3].seasonData[1].actualCasts.should.equal(1);
      o.fishers[3].seasonData[1].fishCaught.should.equal(0);
      o.fishers[3].seasonData[1].startMoney.should.equal(0);
      o.fishers[3].seasonData[1].endMoney.should.equal(-0.1);
      return done();
    });
  });

  describe('late actions (e.g. delayed by network latency)', function() {
    beforeEach(function() {
      o.addFisher('p001');
      o.readRules('p001');
      o.microworld.params.chanceCatch = 1.0;
      o.season = 1;
      o.setAvailableFish();
      for (var i = 0; i < 4; i++) o.fishers[i].prepareFisherForSeason(1);
    });

    ['resting', 'paused', 'over', 'initial delay'].forEach(function(status) {
      it('should ignore a fishing attempt while the ocean is ' + status, function() {
        o.status = status;
        o.fishers[3].status = 'At sea';
        o.attemptToFish('p001');
        o.certainFish.should.equal(10);
        o.fishers[3].money.should.equal(0);
        o.fishers[3].totalCasts.should.equal(0);
        o.fishers[3].seasonData[1].actualCasts.should.equal(0);
      });

      it('should ignore a departure while the ocean is ' + status, function() {
        o.status = status;
        o.goToSea('p001');
        o.fishers[3].status.should.equal('At port');
        o.fishers[3].money.should.equal(0);
        o.fishers[3].totalDepartures.should.equal(0);
      });
    });

    it('should ignore a fishing attempt by a fisher at port', function() {
      o.status = 'running';
      o.attemptToFish('p001');
      o.certainFish.should.equal(10);
      o.fishers[3].money.should.equal(0);
      o.fishers[3].totalCasts.should.equal(0);
    });

    it('should allow a departure while the season is running', function() {
      o.status = 'running';
      o.goToSea('p001');
      o.fishers[3].status.should.equal('At sea');
      o.fishers[3].totalDepartures.should.equal(1);
    });
  });

  describe('disconnect handling', function() {
    var GRACE = 0.05; // seconds, so the tests run quickly

    function enable(overrides) {
      var params = {
        disconnectHandlingEnabled: true,
        disconnectGracePeriod: GRACE,
        disconnectDuringGrace: 'pause',
        disconnectsAllowed: 3,
        disconnectLostAction: 'end',
      };
      for (var k in overrides || {}) params[k] = overrides[k];
      for (var p in params) o.microworld.params[p] = params[p];
      // These tests are about who is waited for; the resume countdown that
      // follows is tested under pause()/resume(), so skip it here
      o.resumeCountdownSeconds = function() { return 0; };
    }

    function events(pId) {
      return o.connectionEvents.filter(function(e) { return !pId || e.participant === pId; })
        .map(function(e) { return e.event; });
    }

    function human(pId) {
      return o.fishers[o.findFisherIndex(pId)];
    }

    beforeEach(function() {
      o.addFisher('p001');
      o.addFisher('p002');
      o.status = 'running';
    });

    afterEach(function() {
      o.clearDisconnectTimers();
    });

    it('should not apply when switched off, or before the game starts', function() {
      o.disconnectHandlingApplies().should.be.false();
      enable();
      o.disconnectHandlingApplies().should.be.true();
      o.status = 'setup';
      o.disconnectHandlingApplies().should.be.false();
      o.status = 'over';
      o.disconnectHandlingApplies().should.be.false();
    });

    it('should pause the game and send the absent fisher\'s boat to port', function() {
      enable();
      human('p001').status = 'At sea';
      o.fisherDisconnected('p001');
      o.status.should.equal('paused');
      o.unpauseState.should.equal('running');
      human('p001').status.should.equal('At port');
      events('p001').should.eql(['disconnected', 'sent to port']);
      o.isFisherDisconnected('p001').should.be.true();
    });

    it('should resume and record the time away when the fisher returns in time', function(done) {
      enable();
      o.fisherDisconnected('p001');
      o.fisherReconnected('p001');
      o.status.should.equal('running');
      events('p001').should.eql(['disconnected', 'reconnected']);
      o.connectionEvents[1].secondsAway.should.equal(0);
      setTimeout(function() {
        // The grace timer was cancelled: nothing more happens
        o.isLost('p001').should.be.false();
        o.status.should.equal('running');
        done();
      }, GRACE * 2000);
    });

    it('should keep the game paused until every absent fisher is back', function() {
      enable();
      o.fisherDisconnected('p001');
      o.fisherDisconnected('p002');
      o.fisherReconnected('p001');
      o.status.should.equal('paused');
      o.fisherReconnected('p002');
      o.status.should.equal('running');
    });

    it('should end and record the game when the grace period runs out', function(done) {
      enable({ disconnectLostAction: 'end' });
      o.fisherDisconnected('p001');
      setTimeout(function() {
        o.status.should.equal('over');
        o.endReason.should.equal('disconnect');
        o.isLost('p001').should.be.true();
        var ended = o.connectionEvents.filter(function(e) { return e.event === 'game ended'; })[0];
        ended.reason.should.equal('grace period expired');
        done();
      }, GRACE * 2000);
    });

    it('should remove the fisher and play on when that is the chosen action', function(done) {
      enable({ disconnectLostAction: 'remove' });
      o.fisherDisconnected('p001');
      setTimeout(function() {
        should(o.findFisherIndex('p001')).be.null();
        should(o.findFisherIndex('p002')).not.be.null();
        o.isLost('p001').should.be.true();
        o.status.should.equal('running');
        events('p001').should.eql(['disconnected', 'removed']);
        done();
      }, GRACE * 2000);
    });

    it('should lose a fisher at once when they go over the disconnects allowed', function() {
      enable({ disconnectsAllowed: 1, disconnectLostAction: 'remove' });
      o.fisherDisconnected('p001');
      o.fisherReconnected('p001');
      o.fisherDisconnected('p001');
      o.isLost('p001').should.be.true();
      o.lostParticipants.p001.should.equal('too many disconnects');
      o.status.should.equal('running');
    });

    it('should keep playing during the grace period when set to continue', function() {
      enable({ disconnectDuringGrace: 'continue' });
      o.fisherDisconnected('p001');
      o.status.should.equal('running');
      o.isFisherDisconnected('p001').should.be.true();
      o.fisherReconnected('p001');
      o.status.should.equal('running');
    });

    it('should stay paused for a Pause button press after the absent fisher returns', function() {
      enable();
      o.pause('p002');
      o.fisherDisconnected('p001');
      o.fisherReconnected('p001');
      o.status.should.equal('paused');
      o.resume('p002');
      o.status.should.equal('running');
    });

    it('should not let the Pause button\'s owner resume while someone is being waited for', function() {
      enable();
      o.pause('p002');
      o.fisherDisconnected('p001');
      o.resume('p002');
      o.status.should.equal('paused');
      o.fisherReconnected('p001');
      o.status.should.equal('running');
    });

    it('should stop the grace timers when the game ends', function(done) {
      enable({ disconnectLostAction: 'remove' });
      o.fisherDisconnected('p001');
      o.endOcean('time');
      setTimeout(function() {
        o.isLost('p001').should.be.false();
        o.endReason.should.equal('time');
        done();
      }, GRACE * 2000);
    });
  });

  describe('dashboard tracking', function() {
    it('should include the ocean ID in the simulation data sent to the dashboard', function() {
      o.grabSimulationData().oceanId.should.equal(o.id);
    });

    it('should stop listing a run as running as soon as it ends', function() {
      var om = { trackedSimulations: {} };
      var tracked = new Ocean(mw, io, ioAdmin, om);
      om.trackedSimulations[tracked.id] = tracked.grabSimulationData();
      om.trackedSimulations.other = { code: 'OTHER' };
      tracked.endOcean('time');
      should.not.exist(om.trackedSimulations[tracked.id]);
      should.exist(om.trackedSimulations.other);
      tracked.isRemovable().should.be.true();
    });
  });

  describe('recordConnectionEvent()', function() {
    function record(status, season, unpauseState) {
      o.status = status;
      o.season = season;
      o.unpauseState = unpauseState;
      o.recordConnectionEvent('p001', 'disconnected');
      return o.connectionEvents[o.connectionEvents.length - 1];
    }

    it('should count an event during a season toward that season', function() {
      var e = record('running', 1);
      e.phase.should.equal('running');
      e.resultsSeason.should.equal(1);
    });

    it('should count an event in the break between seasons toward the next season', function() {
      var e = record('resting', 1);
      e.phase.should.equal('resting');
      e.resultsSeason.should.equal(2);
    });

    it('should count the countdown before the first season toward season 1', function() {
      record('initial delay', 0).resultsSeason.should.equal(1);
    });

    it('should use what the game was doing before a pause', function() {
      var e = record('paused', 1, 'resting');
      e.phase.should.equal('resting');
      e.resultsSeason.should.equal(2);
    });
  });

  describe('recordDevice() and getDevices()', function() {
    var ua = 'Mozilla/5.0 (Linux; Android 9; SM-A105F) Chrome/90.0 Mobile Safari/537.36';

    it('should start with no devices', function() {
      o.getDevices().should.eql([]);
    });

    it('should record one device per participant, keeping the latest', function() {
      o.addFisher('p001');
      o.recordDevice('p001', { userAgent: ua, deviceClass: 'desktop' });
      o.recordDevice('p001', { userAgent: ua, deviceClass: 'phone' });
      var devices = o.getDevices();
      devices.length.should.equal(1);
      devices[0].participant.should.equal('p001');
      devices[0].deviceClass.should.equal('phone');
      devices[0].model.should.equal('SM-A105F');
    });

    it('should keep the device of a participant who has left', function() {
      o.addFisher('p001');
      o.recordDevice('p001', { userAgent: ua });
      o.removeFisher('p001');
      o.getDevices().length.should.equal(1);
    });
  });

  describe('catchIntentIsEnabled()', function() {
    it('should return true if the catchIntentions parameter is true', function(done) {
      o.catchIntentIsEnabled().should.equal(false);
      o.microworld.params.catchIntentionsEnabled = true;
      o.catchIntentIsEnabled().should.equal(true);
      return done();
    });
  });

  describe('catchIntentIsActive()', function() {
    it('should return true if it is enabled and a season in in the active list', function(done) {
      o.catchIntentIsActive(1).should.equal(false);
      o.catchIntentIsActive(2).should.equal(false);
      o.catchIntentIsActive(3).should.equal(false);
      o.catchIntentIsActive(4).should.equal(false);
      o.microworld.params.catchIntentionsEnabled = true;
      // o.microworld.params.catchIntentSeasons = [2,4];
      o.catchIntentIsActive(1).should.equal(false);
      o.catchIntentIsActive(2).should.equal(true);
      o.catchIntentIsActive(3).should.equal(false);
      o.catchIntentIsActive(4).should.equal(true);
      return done();
    });
  });

});

describe('profit display accessors', function() {
  afterEach(function() {
    o.microworld.params.profitSeasonDisabled = false;
    o.microworld.params.profitTotalDisabled = false;
    o.microworld.params.profitGapDisabled = true;
  });

  it('profitSeasonIsDisabled returns false by default', function(done) {
    o.profitSeasonIsDisabled().should.equal(false);
    return done();
  });

  it('profitSeasonIsDisabled returns true when profitSeasonDisabled is true', function(done) {
    o.microworld.params.profitSeasonDisabled = true;
    o.profitSeasonIsDisabled().should.equal(true);
    return done();
  });

  it('profitTotalIsDisabled returns false by default', function(done) {
    o.profitTotalIsDisabled().should.equal(false);
    return done();
  });

  it('profitTotalIsDisabled returns true when profitTotalDisabled is true', function(done) {
    o.microworld.params.profitTotalDisabled = true;
    o.profitTotalIsDisabled().should.equal(true);
    return done();
  });

  it('profitGapIsDisabled returns true by default', function(done) {
    o.profitGapIsDisabled().should.equal(true);
    return done();
  });

  it('profitGapIsDisabled returns true when fisherAdvantageEnabled is false even if profitGapDisabled is false', function(done) {
    o.microworld.params.profitGapDisabled = false;
    o.profitGapIsDisabled().should.equal(true);
    return done();
  });

  it('profitGapIsDisabled returns false when fisherAdvantageEnabled is true and profitGapDisabled is false', function(done) {
    o.microworld.params.profitGapDisabled = false;
    o.microworld.params.fisherAdvantageEnabled = true;
    o.profitGapIsDisabled().should.equal(false);
    return done();
  });

  it('profitDisplayIsDisabled returns true only when all three are disabled', function(done) {
    o.microworld.params.profitSeasonDisabled = true;
    o.microworld.params.profitTotalDisabled = true;
    o.microworld.params.profitGapDisabled = true;
    o.profitDisplayIsDisabled().should.equal(true);
    return done();
  });

  it('profitDisplayIsDisabled returns false when only some are disabled', function(done) {
    o.microworld.params.profitSeasonDisabled = true;
    o.microworld.params.profitGapDisabled = true;
    o.profitDisplayIsDisabled().should.equal(false);
    return done();
  });
});