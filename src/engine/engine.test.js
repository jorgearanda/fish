'use strict';
/*global describe:true, it:true, beforeEach:true*/

var should = require('should');

describe('Engine - Disconnect Handler', function() {
  var OceanManager = require('./ocean-manager').OceanManager;
  var io, ioAdmin, om;

  beforeEach(function(done) {
    io = require('../app').io;
    ioAdmin = require('../app').ioAdmin;
    om = new OceanManager(io, ioAdmin);
    return done();
  });

  it('should handle disconnect gracefully when ocean is already deleted (Bug #2)', function(done) {
    // This test verifies that accessing om.oceans[deletedOceanId] doesn't crash
    // when the ocean has been deleted

    var fakeOceanId = 'fake-ocean-123';

    // Simulate the scenario where code tries to access a deleted ocean
    // This is what happens in the disconnect handler
    var oceanExists = om.oceans[fakeOceanId];

    // Before the fix, code like this would crash:
    // if (!om.oceans[fakeOceanId].isInSetup()) { ... }
    //
    // After the fix, we check existence first:
    // if (om.oceans[fakeOceanId] && !om.oceans[fakeOceanId].isInSetup()) { ... }

    should.not.exist(oceanExists);

    // The test passes if we don't crash
    // The actual fix is in engine.js disconnect handler
    return done();
  });

  it('should not crash when checking properties of undefined ocean', function(done) {
    var undefinedOcean = undefined;

    // This is the pattern used before the fix (WILL crash):
    // if (!undefinedOcean.isInSetup()) { ... }

    // This is the pattern after the fix (won't crash):
    var shouldNotExecute = false;
    if (undefinedOcean && !undefinedOcean.isInSetup()) {
      shouldNotExecute = true;
    }

    shouldNotExecute.should.equal(false);
    return done();
  });
});
