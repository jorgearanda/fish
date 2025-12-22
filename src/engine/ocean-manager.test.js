'use strict';
/*global describe:true, it:true, beforeEach:true, afterEach:true*/

var should = require('should');
var mongoose = require('mongoose');

var OceanManager = require('./ocean-manager').OceanManager;
var Microworld = require('../models/microworld-model').Microworld;

describe('Engine - OceanManager', function() {
  var io, ioAdmin, om;

  beforeEach(function(done) {
    io = require('../app').io;
    ioAdmin = require('../app').ioAdmin;
    om = new OceanManager(io, ioAdmin);
    return done();
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
        experimenter: new mongoose.Types.ObjectId(),
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
  });
});
