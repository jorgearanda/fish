"use strict";
var Fisher, should, testUtils;

should = require("should");

testUtils = require("../test-utils");

Fisher = require("../../engine/fisher").Fisher;

describe("Engine - Fisher", function() {
  it("should initialize", function(done) {
    var f;
    f = new Fisher("Mr. Tuna", "bot", {}, {});
    return done();
  });
  it("should set new fishers with sensible defaults", function(done) {
    var f;
    f = new Fisher("Mr. Tuna", "bot", {}, {});
    f.name.should.equal("Mr. Tuna");
    f.type.should.equal("bot");
    f.ready.should.equal(true);
    f.status.should.equal("At port");
    f.season.should.equal(0);
    return done();
    f = new Fisher("A Participant", "human", {}, {});
    f.name.should.equal("A Participant");
    f.type.should.equal("human");
    f.ready.should.equal(false);
    f.status.should.equal("At port");
    f.season.should.equal(0);
    return done();
  });
  describe("isBot()", function() {
    it("should return true for bot fishers", function(done) {
      var f;
      f = new Fisher("Mr. Tuna", "bot", {}, {});
      f.isBot().should.equal(true);
      return done();
    });
    it("should return false for human fishers", function(done) {
      var f;
      f = new Fisher("A Participant", "human", {}, {});
      f.isBot().should.equal(false);
      return done();
    });
  });
  describe("calculateSeasonGreed()", function() {
    it("should maintain a constant greed when the trend is \"stable\" and the predictability is \"regular\"", function(done) {
      var f, ocean, params;
      params = {
        greed: 0.4,
        greedSpread: 0.3,
        trend: "stable",
        predictability: "regular"
      };
      ocean = {
        season: 1,
        microworld: {
          params: {
            numSeasons: 4
          }
        }
      };
      f = new Fisher("Mr. Tuna", "bot", params, ocean);
      f.calculateSeasonGreed().should.equal(0.4);
      ocean.season = 2;
      f.calculateSeasonGreed().should.equal(0.4);
      ocean.season = 3;
      f.calculateSeasonGreed().should.equal(0.4);
      ocean.season = 4;
      f.calculateSeasonGreed().should.equal(0.4);
      return done();
    });
    it("should increase greed through the seasons when the trend is set to \"increase\"", function(done) {
      var f, greedAtSeason1, greedAtSeason2, greedAtSeason3, greedAtSeason4, ocean, params;
      params = {
        greed: 0.4,
        greedSpread: 0.3,
        trend: "increase",
        predictability: "regular"
      };
      ocean = {
        season: 1,
        microworld: {
          params: {
            numSeasons: 4
          }
        }
      };
      f = new Fisher("Mr. Tuna", "bot", params, ocean);
      greedAtSeason1 = f.calculateSeasonGreed();
      ocean.season += 1;
      greedAtSeason2 = f.calculateSeasonGreed();
      ocean.season += 1;
      greedAtSeason3 = f.calculateSeasonGreed();
      ocean.season += 1;
      greedAtSeason4 = f.calculateSeasonGreed();
      ocean.season += 1;
      greedAtSeason1.should.be.greaterThan(0.0);
      greedAtSeason1.should.be.lessThan(greedAtSeason2);
      greedAtSeason2.should.be.lessThan(greedAtSeason3);
      greedAtSeason3.should.be.lessThan(greedAtSeason4);
      greedAtSeason4.should.be.lessThan(1.0);
      return done();
    });
    it("should decrease greed through the seasons when the trend is set to \"decrease\"", function(done) {
      var f, greedAtSeason1, greedAtSeason2, greedAtSeason3, greedAtSeason4, ocean, params;
      params = {
        greed: 0.4,
        greedSpread: 0.3,
        trend: "decrease",
        predictability: "regular"
      };
      ocean = {
        season: 1,
        microworld: {
          params: {
            numSeasons: 4
          }
        }
      };
      f = new Fisher("Mr. Tuna", "bot", params, ocean);
      greedAtSeason1 = f.calculateSeasonGreed();
      ocean.season += 1;
      greedAtSeason2 = f.calculateSeasonGreed();
      ocean.season += 1;
      greedAtSeason3 = f.calculateSeasonGreed();
      ocean.season += 1;
      greedAtSeason4 = f.calculateSeasonGreed();
      ocean.season += 1;
      greedAtSeason1.should.be.lessThan(1.0);
      greedAtSeason1.should.be.greaterThan(greedAtSeason2);
      greedAtSeason2.should.be.greaterThan(greedAtSeason3);
      greedAtSeason3.should.be.greaterThan(greedAtSeason4);
      greedAtSeason4.should.be.greaterThan(0.0);
      return done();
    });
    it("should randomize greed when predictability is set to \"erratic\"", function(done) {
      var f, greed1, greed2, ocean, params;
      params = {
        greed: 0.4,
        greedSpread: 0.3,
        trend: "stable",
        predictability: "erratic"
      };
      ocean = {
        season: 1,
        microworld: {
          params: {
            numSeasons: 4
          }
        }
      };
      f = new Fisher("Mr. Tuna", "bot", params, ocean);
      greed1 = f.calculateSeasonGreed();
      greed2 = f.calculateSeasonGreed();
      greed1.should.not.equal(greed2);
      return done();
    });
  });
  describe("calculateSeasonCasts()", function() {
    it("should return zero for a completely non-greedy fisher", function(done) {
      var casts, f, ocean;
      ocean = {
        certainFish: 40,
        mysteryFish: 0,
        microworld: {
          params: {
            spawnFactor: 2.0,
            chanceCatch: 1.0
          }
        },
        fishers: [{}, {}, {}, {}]
      };
      f = new Fisher("Mr. Tuna", "bot", {}, ocean);
      casts = f.calculateSeasonCasts(0.0);
      casts.should.equal(0);
      ocean.mysteryFish = 20;
      casts = f.calculateSeasonCasts(0.0);
      casts.should.equal(0);
      ocean.microworld.params.spawnFactor = 20;
      casts = f.calculateSeasonCasts(0.0);
      casts.should.equal(0);
      return done();
    });
    it("should return a full share of fish, so that the stock would exactly collapse if everyone fished equally, for a completely greedy fisher", function(done) {
      var casts, f, ocean;
      ocean = {
        certainFish: 40,
        mysteryFish: 0,
        microworld: {
          params: {
            spawnFactor: 2.0,
            chanceCatch: 1.0
          }
        },
        fishers: [{}, {}, {}, {}]
      };
      f = new Fisher("Mr. Tuna", "bot", {}, ocean);
      casts = f.calculateSeasonCasts(1.0);
      casts.should.equal(10);
      ocean.mysteryFish = 20;
      casts = f.calculateSeasonCasts(1.0);
      casts.should.equal(15);
      ocean.fishers = [{}];
      casts = f.calculateSeasonCasts(1.0);
      casts.should.equal(60);
      return done();
    });
    it("should return an exceedingly large share of fish, so that the stock would not be enough if everyone fished equally, for a fisher with greed > 1.0", function(done) {
      var casts, f, ocean;
      ocean = {
        certainFish: 40,
        mysteryFish: 0,
        microworld: {
          params: {
            spawnFactor: 2.0,
            chanceCatch: 1.0
          }
        },
        fishers: [{}, {}, {}, {}]
      };
      f = new Fisher("Mr. Tuna", "bot", {}, ocean);
      casts = f.calculateSeasonCasts(2.0);
      casts.should.equal(20);
      ocean.mysteryFish = 20;
      casts = f.calculateSeasonCasts(2.0);
      casts.should.equal(30);
      ocean.fishers = [{}];
      casts = f.calculateSeasonCasts(2.0);
      casts.should.equal(120);
      return done();
    });
    it("should return a share of fish so that the stock would exactly restore for a fisher with 0.5 greed", function(done) {
      var casts, f, ocean;
      ocean = {
        certainFish: 40,
        mysteryFish: 0,
        microworld: {
          params: {
            spawnFactor: 2.0,
            chanceCatch: 1.0
          }
        },
        fishers: [{}, {}, {}, {}]
      };
      f = new Fisher("Mr. Tuna", "bot", {}, ocean);
      casts = f.calculateSeasonCasts(0.5);
      casts.should.equal(5);
      ocean.mysteryFish = 40;
      casts = f.calculateSeasonCasts(0.5);
      casts.should.equal(10);
      ocean.microworld.params.spawnFactor = 3.0;
      casts = f.calculateSeasonCasts(0.5);
      casts.should.equal(13);
      ocean.mysteryFish = 20;
      ocean.fishers = [{}];
      casts = f.calculateSeasonCasts(0.5);
      casts.should.equal(40);
      return done();
    });
    it("should consider probabilities of catching fish lesser than 100%", function(done) {
      var casts, f, ocean;
      ocean = {
        certainFish: 40,
        mysteryFish: 0,
        microworld: {
          params: {
            spawnFactor: 2.0,
            chanceCatch: 0.5
          }
        },
        fishers: [{}, {}, {}, {}]
      };
      f = new Fisher("Mr. Tuna", "bot", {}, ocean);
      casts = f.calculateSeasonCasts(0.5);
      casts.should.equal(10);
      ocean.mysteryFish = 40;
      casts = f.calculateSeasonCasts(0.5);
      casts.should.equal(20);
      ocean.microworld.params.spawnFactor = 3.0;
      casts = f.calculateSeasonCasts(0.5);
      casts.should.equal(27);
      ocean.mysteryFish = 20;
      ocean.fishers = [{}];
      casts = f.calculateSeasonCasts(0.5);
      casts.should.equal(80);
      ocean.mysteryFish = 0;
      ocean.microworld.params.spawnFactor = 2.0;
      ocean.microworld.params.chanceCatch = 0.1;
      casts = f.calculateSeasonCasts(0.5);
      casts.should.equal(200);
      ocean.mysteryFish = 40;
      casts = f.calculateSeasonCasts(0.5);
      casts.should.equal(400);
      ocean.microworld.params.chanceCatch = 0.9;
      ocean.mysteryFish = 0;
      casts = f.calculateSeasonCasts(0.5);
      casts.should.equal(22);
      return done();
    });
  });
  describe("prepareFisherForSeason()", function() {
    it("should set all of the season parameters for the fisher", function(done) {
      var f, ocean, params;
      params = {
        greed: 0.5,
        trend: "stable",
        predictability: "regular"
      };
      ocean = {
        season: 1,
        certainFish: 40,
        mysteryFish: 0,
        microworld: {
          params: {
            numSeasons: 4,
            spawnFactor: 2.0,
            chanceCatch: 0.5
          }
        },
        fishers: [{}, {}, {}, {}]
      };
      f = new Fisher("Mr. Tuna", "bot", params, ocean);
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
    it("should set the basic season parameters for human fishers", function(done) {
      var f;
      f = new Fisher("A Participant", "human", {}, {});
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
});
