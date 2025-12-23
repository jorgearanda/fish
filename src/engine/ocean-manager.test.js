'use strict';
/*global describe:true, it:true, beforeEach:true, afterEach:true, before:true, after:true*/

var should = require('should');
var mongoose = require('mongoose');

var OceanManager = require('./ocean-manager').OceanManager;
var Microworld = require('../models/microworld-model').Microworld;
var Experimenter = require('../models/experimenter-model').Experimenter;
var setUpTestDb = require('../unit-utils').setUpTestDb;

describe('Engine - OceanManager', function() {
  var io, ioAdmin, om;
  var testExperimenter;

  before(async function() {
    await setUpTestDb();

    const passwordHash = await new Promise((resolve, reject) => {
      Experimenter.hashPassword('password123', (err, hash) => {
        if (err) reject(err);
        resolve(hash);
      });
    });

    testExperimenter = await Experimenter.create({
      username: 'testuser',
      passwordHash: passwordHash,
    });
  });

  beforeEach(function(done) {
    io = require('../app').io;
    ioAdmin = require('../app').ioAdmin;
    om = new OceanManager(io, ioAdmin);
    return done();
  });

  after(async function() {
    await Microworld.deleteMany({});
    await Experimenter.deleteMany({});
  });

  describe('createOcean()', function() {
    it('should handle null microworld gracefully (Bug #1)', function(done) {
      // Use an invalid ObjectId that won't exist in the database
      var nonExistentId = new mongoose.Types.ObjectId();

      om.createOcean(nonExistentId.toString(), function(err, oceanId) {
        // Should return an error instead of crashing
        should.exist(err);
        err.message.should.match(/Microworld not found|not found/i);
        should.not.exist(oceanId);
        return done();
      });
    });

    it('should create ocean successfully with valid microworld', function(done) {
      this.timeout(5000);

      // Create a test microworld in the database
      var testMicroworld = new Microworld({
        name: 'Test Ocean Manager MW',
        code: 'TESTOM' + Date.now(),
        status: 'test',
        experimenter: {
          _id: testExperimenter._id,
          username: testExperimenter.username,
        },
        dateCreated: new Date(),
        params: {
          numFishers: 2,
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
          numSeasons: 2,
          catchIntentionsEnabled: false,
          catchIntentDialogDuration: 17,
          catchIntentSeasons: [],
          profitDisplayDisabled: false,
          bots: [],
        },
      });

      testMicroworld.save(function(saveErr) {
        if (saveErr) return done(saveErr);

        om.createOcean(testMicroworld._id.toString(), function(err, oceanId) {
          should.not.exist(err);
          should.exist(oceanId);
          should.exist(om.oceans[oceanId]);
          om.oceans[oceanId].microworld.name.should.equal('Test Ocean Manager MW');

          // Cleanup
          om.deleteOcean(oceanId);
          testMicroworld.remove(function(removeErr) {
            return done(removeErr);
          });
        });
      });
    });
  });

  describe('assignFisherToOcean()', function() {
    it('should handle null microworld gracefully when creating new ocean', function(done) {
      var nonExistentId = new mongoose.Types.ObjectId();
      var participantId = 'test-participant-1';

      om.assignFisherToOcean(nonExistentId.toString(), participantId, function(oceanId) {
        // Should not call callback or should handle error
        // This test will fail before the fix because it will crash
        // After fix, we need to ensure error is handled properly
        should.not.exist(oceanId);
        return done();
      });
    });

    it('should assign fisher to existing ocean with room', function(done) {
      this.timeout(5000);

      var testMicroworld = new Microworld({
        name: 'Test Assign MW',
        code: 'TESTASSIGN' + Date.now(),
        status: 'test',
        experimenter: {
          _id: testExperimenter._id,
          username: testExperimenter.username,
        },
        dateCreated: new Date(),
        params: {
          numFishers: 3, // Allow 3 fishers
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
          numSeasons: 2,
          catchIntentionsEnabled: false,
          catchIntentDialogDuration: 17,
          catchIntentSeasons: [],
          profitDisplayDisabled: false,
          bots: [],
        },
      });

      testMicroworld.save(function(saveErr) {
        if (saveErr) return done(saveErr);

        // Create initial ocean with first fisher
        om.assignFisherToOcean(testMicroworld._id.toString(), 'fisher1', function(oceanId1) {
          should.exist(oceanId1);

          // Assign second fisher to same ocean
          om.assignFisherToOcean(testMicroworld._id.toString(), 'fisher2', function(oceanId2) {
            should.exist(oceanId2);
            String(oceanId2).should.equal(String(oceanId1)); // Should be same ocean
            om.oceans[oceanId1].fishers.length.should.equal(2);

            // Cleanup
            om.deleteOcean(oceanId1);
            testMicroworld.remove(function(removeErr) {
              return done(removeErr);
            });
          });
        });
      });
    });

    it('should create new ocean when existing ocean is full', function(done) {
      this.timeout(5000);

      var testMicroworld = new Microworld({
        name: 'Test Full Ocean MW',
        code: 'TESTFULL' + Date.now(),
        status: 'test',
        experimenter: {
          _id: testExperimenter._id,
          username: testExperimenter.username,
        },
        dateCreated: new Date(),
        params: {
          numFishers: 1, // Only allow 1 fisher
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
          numSeasons: 2,
          catchIntentionsEnabled: false,
          catchIntentDialogDuration: 17,
          catchIntentSeasons: [],
          profitDisplayDisabled: false,
          bots: [],
        },
      });

      testMicroworld.save(function(saveErr) {
        if (saveErr) return done(saveErr);

        // Create ocean with first fisher (fills it)
        om.assignFisherToOcean(testMicroworld._id.toString(), 'fisher1', function(oceanId1) {
          should.exist(oceanId1);

          // Try to assign second fisher - should create new ocean
          om.assignFisherToOcean(testMicroworld._id.toString(), 'fisher2', function(oceanId2) {
            should.exist(oceanId2);
            String(oceanId2).should.not.equal(String(oceanId1)); // Should be different ocean
            Object.keys(om.oceans).length.should.equal(2); // Two oceans

            // Cleanup
            om.deleteOcean(oceanId1);
            om.deleteOcean(oceanId2);
            testMicroworld.remove(function(removeErr) {
              return done(removeErr);
            });
          });
        });
      });
    });
  });

  describe('removeFisherFromOcean()', function() {
    it('should remove fisher from ocean', function(done) {
      this.timeout(5000);

      var testMicroworld = new Microworld({
        name: 'Test Remove Fisher MW',
        code: 'TESTREMOVE' + Date.now(),
        status: 'test',
        experimenter: {
          _id: testExperimenter._id,
          username: testExperimenter.username,
        },
        dateCreated: new Date(),
        params: {
          numFishers: 2,
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
          numSeasons: 2,
          catchIntentionsEnabled: false,
          catchIntentDialogDuration: 17,
          catchIntentSeasons: [],
          profitDisplayDisabled: false,
          bots: [],
        },
      });

      testMicroworld.save(function(saveErr) {
        if (saveErr) return done(saveErr);

        om.assignFisherToOcean(testMicroworld._id.toString(), 'fisher1', function(oceanId) {
          should.exist(oceanId);
          om.oceans[oceanId].fishers.length.should.equal(1);

          // Remove the fisher
          om.removeFisherFromOcean(oceanId, 'fisher1');
          om.oceans[oceanId].fishers.length.should.equal(0);

          // Cleanup
          om.deleteOcean(oceanId);
          testMicroworld.remove(function(removeErr) {
            return done(removeErr);
          });
        });
      });
    });
  });

  describe('deleteOcean()', function() {
    it('should delete ocean and tracked simulations', function(done) {
      this.timeout(5000);

      var testMicroworld = new Microworld({
        name: 'Test Delete Ocean MW',
        code: 'TESTDEL' + Date.now(),
        status: 'test',
        experimenter: {
          _id: testExperimenter._id,
          username: testExperimenter.username,
        },
        dateCreated: new Date(),
        params: {
          numFishers: 1,
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
          numSeasons: 2,
          catchIntentionsEnabled: false,
          catchIntentDialogDuration: 17,
          catchIntentSeasons: [],
          profitDisplayDisabled: false,
          bots: [],
        },
      });

      testMicroworld.save(function(saveErr) {
        if (saveErr) return done(saveErr);

        om.createOcean(testMicroworld._id.toString(), function(err, oceanId) {
          should.not.exist(err);
          should.exist(oceanId);
          should.exist(om.oceans[oceanId]);

          // Add to tracked simulations
          om.trackedSimulations[oceanId] = { some: 'data' };

          // Delete ocean
          om.deleteOcean(oceanId);
          should.not.exist(om.oceans[oceanId]);
          should.not.exist(om.trackedSimulations[oceanId]);

          testMicroworld.remove(function(removeErr) {
            return done(removeErr);
          });
        });
      });
    });
  });
});
