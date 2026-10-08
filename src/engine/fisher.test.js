'use strict';
/*global describe:true, it:true*/

var should = require('should');

var Fisher = require('./fisher').Fisher;

describe('Engine - Fisher', function() {
  it('should set new fishers with sensible defaults', function(done) {
    var f = new Fisher('Mr. Tuna', 'bot', {}, {});
    f.name.should.equal('Mr. Tuna');
    f.type.should.equal('bot');
    f.ready.should.equal(true);
    f.status.should.equal('At port');
    f.season.should.equal(0);

    f = new Fisher('A Participant', 'human', {}, {});
    f.name.should.equal('A Participant');
    f.type.should.equal('human');
    f.ready.should.equal(false);
    f.status.should.equal('At port');
    f.season.should.equal(0);
    return done();
  });

  describe('lobby timestamps', function() {
    it('should set entryTime close to now for a human fisher', function(done) {
      var before = Date.now();
      var f = new Fisher('A Participant', 'human', {}, {});
      var after = Date.now();
      f.entryTime.should.be.within(before, after);
      return done();
    });

    it('should set readyTime to null for a human fisher', function(done) {
      var f = new Fisher('A Participant', 'human', {}, {});
      should.equal(f.readyTime, null);
      return done();
    });

    it('should set entryTime close to now for a bot fisher', function(done) {
      var before = Date.now();
      var f = new Fisher('Mr. Tuna', 'bot', {}, {});
      var after = Date.now();
      f.entryTime.should.be.within(before, after);
      return done();
    });

    it('should set readyTime close to now for a bot fisher', function(done) {
      var before = Date.now();
      var f = new Fisher('Mr. Tuna', 'bot', {}, {});
      var after = Date.now();
      f.readyTime.should.be.within(before, after);
      return done();
    });
  });

  describe('isBot()', function() {
    it('should return true for bot fishers', function(done) {
      var f = new Fisher('Mr. Tuna', 'bot', {}, {});
      f.isBot().should.equal(true);
      return done();
    });

    it('should return false for human fishers', function(done) {
      var f = new Fisher('A Participant', 'human', {}, {});
      f.isBot().should.equal(false);
      return done();
    });
  });

  describe('calculateSeasonGreed()', function() {
    it('should maintain a constant greed when the trend is "stable" and the predictability is "regular"', function(done) {
      var params = {
        greed: 0.4,
        greedSpread: 0.3,
        trend: 'stable',
        predictability: 'regular',
      };
      var ocean = {
        season: 1,
        microworld: {
          params: {
            numSeasons: 4,
          },
        },
      };
      var f = new Fisher('Mr. Tuna', 'bot', params, ocean);
      f.calculateSeasonGreed().should.equal(0.4);
      ocean.season = 2;
      f.calculateSeasonGreed().should.equal(0.4);
      ocean.season = 3;
      f.calculateSeasonGreed().should.equal(0.4);
      ocean.season = 4;
      f.calculateSeasonGreed().should.equal(0.4);
      return done();
    });

    it('should increase greed through the seasons when the trend is set to "increase"', function(done) {
      var params = {
        greed: 0.4,
        greedSpread: 0.3,
        trend: 'increase',
        predictability: 'regular',
      };
      var ocean = {
        season: 1,
        microworld: {
          params: {
            numSeasons: 4,
          },
        },
      };
      var f = new Fisher('Mr. Tuna', 'bot', params, ocean);
      var greedAtSeason1 = f.calculateSeasonGreed(ocean.season);
      ocean.season += 1;
      var greedAtSeason2 = f.calculateSeasonGreed(ocean.season);
      ocean.season += 1;
      var greedAtSeason3 = f.calculateSeasonGreed(ocean.season);
      ocean.season += 1;
      var greedAtSeason4 = f.calculateSeasonGreed(ocean.season);
      ocean.season += 1;
      greedAtSeason1.should.be.greaterThan(0.0);
      greedAtSeason1.should.be.lessThan(greedAtSeason2);
      greedAtSeason2.should.be.lessThan(greedAtSeason3);
      greedAtSeason3.should.be.lessThan(greedAtSeason4);
      greedAtSeason4.should.be.lessThan(1.0);
      return done();
    });

    it('should decrease greed through the seasons when the trend is set to "decrease"', function(done) {
      var params = {
        greed: 0.4,
        greedSpread: 0.3,
        trend: 'decrease',
        predictability: 'regular',
      };
      var ocean = {
        season: 1,
        microworld: {
          params: {
            numSeasons: 4,
          },
        },
      };
      var f = new Fisher('Mr. Tuna', 'bot', params, ocean);
      var greedAtSeason1 = f.calculateSeasonGreed(ocean.season);
      ocean.season += 1;
      var greedAtSeason2 = f.calculateSeasonGreed(ocean.season);
      ocean.season += 1;
      var greedAtSeason3 = f.calculateSeasonGreed(ocean.season);
      ocean.season += 1;
      var greedAtSeason4 = f.calculateSeasonGreed(ocean.season);
      ocean.season += 1;
      greedAtSeason1.should.be.lessThan(1.0);
      greedAtSeason1.should.be.greaterThan(greedAtSeason2);
      greedAtSeason2.should.be.greaterThan(greedAtSeason3);
      greedAtSeason3.should.be.greaterThan(greedAtSeason4);
      greedAtSeason4.should.be.greaterThan(0.0);
      return done();
    });

    it('should randomize greed when predictability is set to "erratic"', function(done) {
      var params = {
        greed: 0.4,
        greedSpread: 0.3,
        trend: 'stable',
        predictability: 'erratic',
      };
      var ocean = {
        season: 1,
        microworld: {
          params: {
            numSeasons: 4,
          },
        },
      };
      var f = new Fisher('Mr. Tuna', 'bot', params, ocean);
      var greed1 = f.calculateSeasonGreed();
      var greed2 = f.calculateSeasonGreed();

      // Theoretically they could be the same but come on
      greed1.should.not.equal(greed2);
      return done();
    });
  });

  describe('calculateSeasonCasts()', function() {
    it('should return zero for a completely non-greedy fisher', function(done) {
      var ocean = {
        certainFish: 40,
        mysteryFish: 0,
        microworld: {
          params: {
            spawnFactor: 2.0,
            chanceCatch: 1.0,
          },
        },
        fishers: [{}, {}, {}, {}],
      };
      var f = new Fisher('Mr. Tuna', 'bot', {}, ocean);
      var casts = f.calculateSeasonCasts(0.0);
      casts.should.equal(0);

      ocean.mysteryFish = 20;
      var casts = f.calculateSeasonCasts(0.0);
      casts.should.equal(0);

      ocean.microworld.params.spawnFactor = 20;
      var casts = f.calculateSeasonCasts(0.0);
      casts.should.equal(0);
      return done();
    });

    it('should return a full share of fish, so that the stock would exactly collapse if everyone fished equally, for a completely greedy fisher', function(done) {
      var ocean = {
        certainFish: 40,
        mysteryFish: 0,
        microworld: {
          params: {
            spawnFactor: 2.0,
            chanceCatch: 1.0,
          },
        },
        fishers: [{}, {}, {}, {}],
      };
      var f = new Fisher('Mr. Tuna', 'bot', {}, ocean);
      var casts = f.calculateSeasonCasts(1.0);
      casts.should.equal(10);

      ocean.mysteryFish = 20;
      var casts = f.calculateSeasonCasts(1.0);
      casts.should.equal(15);

      ocean.fishers = [{}];
      var casts = f.calculateSeasonCasts(1.0);
      casts.should.equal(60);
      return done();
    });

    it('should return an exceedingly large share of fish, so that the stock would not be enough if everyone fished equally, for a fisher with greed > 1.0', function(done) {
      var ocean = {
        certainFish: 40,
        mysteryFish: 0,
        microworld: {
          params: {
            spawnFactor: 2.0,
            chanceCatch: 1.0,
          },
        },
        fishers: [{}, {}, {}, {}],
      };
      var f = new Fisher('Mr. Tuna', 'bot', {}, ocean);
      var casts = f.calculateSeasonCasts(2.0);
      casts.should.equal(20);

      ocean.mysteryFish = 20;
      var casts = f.calculateSeasonCasts(2.0);
      casts.should.equal(30);

      ocean.fishers = [{}];
      var casts = f.calculateSeasonCasts(2.0);
      casts.should.equal(120);
      return done();
    });

    it('should return a share of fish so that the stock would exactly restore for a fisher with 0.5 greed', function(done) {
      var ocean = {
        certainFish: 40,
        mysteryFish: 0,
        microworld: {
          params: {
            spawnFactor: 2.0,
            chanceCatch: 1.0,
          },
        },
        fishers: [{}, {}, {}, {}],
      };
      var f = new Fisher('Mr. Tuna', 'bot', {}, ocean);
      var casts = f.calculateSeasonCasts(0.5);
      casts.should.equal(5);

      ocean.mysteryFish = 40;
      var casts = f.calculateSeasonCasts(0.5);
      casts.should.equal(10);

      ocean.microworld.params.spawnFactor = 3.0;
      var casts = f.calculateSeasonCasts(0.5);
      casts.should.equal(13);

      ocean.mysteryFish = 20;
      ocean.fishers = [{}];
      var casts = f.calculateSeasonCasts(0.5);
      casts.should.equal(40);
      return done();
    });

    it('should consider probabilities of catching fish lesser than 100%', function(done) {
      var ocean = {
        certainFish: 40,
        mysteryFish: 0,
        microworld: {
          params: {
            spawnFactor: 2.0,
            chanceCatch: 0.5,
          },
        },
        fishers: [{}, {}, {}, {}],
      };
      var f = new Fisher('Mr. Tuna', 'bot', {}, ocean);
      var casts = f.calculateSeasonCasts(0.5);
      casts.should.equal(10);

      ocean.mysteryFish = 40;
      var casts = f.calculateSeasonCasts(0.5);
      casts.should.equal(20);

      ocean.microworld.params.spawnFactor = 3.0;
      var casts = f.calculateSeasonCasts(0.5);
      casts.should.equal(27);

      ocean.mysteryFish = 20;
      ocean.fishers = [{}];
      var casts = f.calculateSeasonCasts(0.5);
      casts.should.equal(80);

      ocean.mysteryFish = 0;
      ocean.microworld.params.spawnFactor = 2.0;
      ocean.microworld.params.chanceCatch = 0.1;
      var casts = f.calculateSeasonCasts(0.5);
      casts.should.equal(200);

      ocean.mysteryFish = 40;
      var casts = f.calculateSeasonCasts(0.5);
      casts.should.equal(400);

      ocean.microworld.params.chanceCatch = 0.9;
      ocean.mysteryFish = 0;
      var casts = f.calculateSeasonCasts(0.5);
      casts.should.equal(22);
      return done();
    });
  });

  describe('prepareFisherForSeason()', function() {
    it('should set all of the season parameters for the fisher', function(done) {
      var params = {
        greed: 0.5,
        trend: 'stable',
        predictability: 'regular',
      };
      var ocean = {
        season: 1,
        certainFish: 40,
        mysteryFish: 0,
        microworld: {
          params: {
            numSeasons: 4,
            spawnFactor: 2.0,
            chanceCatch: 0.5,
          },
        },
        fishers: [{}, {}, {}, {}],
        log: {
          info: function() {},
          error: function() {},
        },
      };
      var f = new Fisher('Mr. Tuna', 'bot', params, ocean);
      f.prepareFisherForSeason(1);
      f.season.should.equal(1);
      f.hasReturned.should.equal(false);
      f.seasonData[1].actualCasts.should.equal(0);
      f.seasonData[1].greed.should.equal(params.greed);
      f.seasonData[1].fishCaught.should.equal(0);
      f.seasonData[1].startMoney.should.equal(0);
      f.seasonData[1].endMoney.should.equal(0);
      f.seasonData[1].intendedCasts.should.equal(10);
      return done();
    });

    it('should set the basic season parameters for human fishers', function(done) {
      var ocean = {
        log: {
          info: function() {},
          error: function() {},
        },
      };
      var f = new Fisher('A Participant', 'human', {}, ocean);
      f.prepareFisherForSeason(1);
      f.season.should.equal(1);
      f.hasReturned.should.equal(false);
      f.seasonData[1].actualCasts.should.equal(0);
      should.not.exist(f.seasonData[1].greed);
      f.seasonData[1].fishCaught.should.equal(0);
      f.seasonData[1].startMoney.should.equal(0);
      f.seasonData[1].endMoney.should.equal(0);
      should.not.exist(f.seasonData[1].intendedCasts);
      return done();
    });
  });

  function makeOcean(params) {
    return {
      log: {
        info: function() {},
        error: function() {},
      },
      microworld: {
        params: params,
      },
    };
  }

  describe('hasAdvantage()', function() {
    it('should return false when fisher advantage is disabled', function(done) {
      var ocean = makeOcean({ fisherAdvantageEnabled: false });
      var f = new Fisher('Mr. Tuna', 'bot', { fHasAdvantage: true }, ocean);
      f.hasAdvantage().should.equal(false);
      return done();
    });

    it('should return false when the fisher does not have advantage', function(done) {
      var ocean = makeOcean({ fisherAdvantageEnabled: true });
      var f = new Fisher('Mr. Tuna', 'bot', { fHasAdvantage: false }, ocean);
      f.hasAdvantage().should.equal(false);
      return done();
    });

    it('should return true when advantage is enabled and the fisher has it', function(done) {
      var ocean = makeOcean({ fisherAdvantageEnabled: true });
      var f = new Fisher('Mr. Tuna', 'bot', { fHasAdvantage: true }, ocean);
      f.hasAdvantage().should.equal(true);
      return done();
    });
  });

  describe('goToSea()', function() {
    it('should charge the full departure cost to a fisher without advantage', function(done) {
      var ocean = makeOcean({
        fisherAdvantageEnabled: true,
        costDeparture: 1.0,
        costDepartureReduction: 0.4,
      });
      var f = new Fisher('Mr. Tuna', 'human', { fHasAdvantage: false }, ocean);
      f.prepareFisherForSeason(0);
      f.goToSea();
      f.money.should.equal(-1.0);
      return done();
    });

    it('should charge the reduced departure cost to an advantaged fisher', function(done) {
      var ocean = makeOcean({
        fisherAdvantageEnabled: true,
        costDeparture: 1.0,
        costDepartureReduction: 0.4,
      });
      var f = new Fisher('Mr. Tuna', 'human', { fHasAdvantage: true }, ocean);
      f.prepareFisherForSeason(0);
      f.goToSea();
      f.money.should.equal(-0.6);
      return done();
    });

    it('should increment totalDepartures each time the fisher sails', function(done) {
      var ocean = makeOcean({ costDeparture: 0 });
      var f = new Fisher('Mr. Tuna', 'human', {}, ocean);
      f.prepareFisherForSeason(0);
      f.goToSea();
      f.goToPort();
      f.goToSea();
      f.totalDepartures.should.equal(2);
      return done();
    });
  });

  describe('tryToFish()', function() {
    it('should charge the full cast cost to a fisher without advantage', function(done) {
      var ocean = makeOcean({
        fisherAdvantageEnabled: true,
        costCast: 0.5,
        costCastReduction: 0.2,
      });
      ocean.isSuccessfulCastAttempt = function() { return false; };
      var f = new Fisher('Mr. Tuna', 'human', { fHasAdvantage: false }, ocean);
      f.prepareFisherForSeason(0);
      f.tryToFish();
      f.money.should.equal(-0.5);
      return done();
    });

    it('should charge the reduced cast cost to an advantaged fisher', function(done) {
      var ocean = makeOcean({
        fisherAdvantageEnabled: true,
        costCast: 0.5,
        costCastReduction: 0.2,
      });
      ocean.isSuccessfulCastAttempt = function() { return false; };
      var f = new Fisher('Mr. Tuna', 'human', { fHasAdvantage: true }, ocean);
      f.prepareFisherForSeason(0);
      f.tryToFish();
      f.money.should.equal(-0.3);
      return done();
    });

    it('should increment totalCasts each time the fisher casts', function(done) {
      var ocean = makeOcean({ costCast: 0 });
      ocean.isSuccessfulCastAttempt = function() { return false; };
      var f = new Fisher('Mr. Tuna', 'human', {}, ocean);
      f.prepareFisherForSeason(0);
      f.tryToFish();
      f.tryToFish();
      f.totalCasts.should.equal(2);
      return done();
    });
  });

  describe('runBot() per-second cost', function() {
    it('should charge the full per-second cost to a fisher at sea without advantage', function(done) {
      var ocean = makeOcean({
        fisherAdvantageEnabled: true,
        costSecond: 0.1,
        costSecondReduction: 0.06,
      });
      var f = new Fisher('Mr. Tuna', 'human', { fHasAdvantage: false }, ocean);
      f.prepareFisherForSeason(0);
      f.status = 'At sea';
      f.runBot();
      f.money.should.equal(-0.1);
      return done();
    });

    it('should charge the reduced per-second cost to an advantaged fisher at sea', function(done) {
      var ocean = makeOcean({
        fisherAdvantageEnabled: true,
        costSecond: 0.1,
        costSecondReduction: 0.06,
      });
      var f = new Fisher('Mr. Tuna', 'human', { fHasAdvantage: true }, ocean);
      f.prepareFisherForSeason(0);
      f.status = 'At sea';
      f.runBot();
      f.money.should.be.approximately(-0.04, 0.0001);
      return done();
    });

    it('should increment totalSecondsAtSea only while at sea', function(done) {
      var ocean = makeOcean({ costSecond: 0 });
      var f = new Fisher('Mr. Tuna', 'human', {}, ocean);
      f.prepareFisherForSeason(0);
      f.status = 'At port';
      f.runBot();
      f.status = 'At sea';
      f.runBot();
      f.runBot();
      f.totalSecondsAtSea.should.equal(2);
      return done();
    });
  });
});
