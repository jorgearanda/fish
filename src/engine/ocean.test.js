'use strict';
/*global describe:true, it:true*/

var should = require('should');

var Ocean = require('./ocean').Ocean;
var o, io, mw;

describe('Engine - Ocean', function() {
  beforeEach(function(done) {
    io = require('../app').io;
    mw = {
      name: 'Test Microworld',
      experimenter: {
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
        profitDisplayEnabled: false,
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
    o = new Ocean(mw, io);
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
  });

  describe('removeFisher()', function() {
    it('should remove a human fisher from the fishers array, if it is present', function(done) {
      o.addFisher('p001');
      o.removeFisher('p001');
      o.fishers.length.should.equal(3);
      o.log.entries.length.should.equal(2);
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
      o.status.should.equal('running');
      return done();
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

  describe('profitDisplayIsEnabled()', function() {
    it('should return true if the profitDisplay parameter is true', function(done) {
      o.profitDisplaysIsEnabled().should.equal(false);
      o.microworld.params.profitDisplayEnabled = true;
      o.profitDisplayIsEnabled().should.equal(true);
      return done();
    });
  });

});
