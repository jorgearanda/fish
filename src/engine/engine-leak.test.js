'use strict';
/*global describe:true, it:true, beforeEach:true, afterEach:true, before:true, after:true*/

var should = require('should');
var EventEmitter = require('events');
var mongoose = require('mongoose');

var Microworld = require('../models/microworld-model').Microworld;
var Experimenter = require('../models/experimenter-model').Experimenter;
var setUpTestDb = require('../unit-utils').setUpTestDb;

describe('Engine - Socket Listener Cleanup (Issue #1)', function() {
  var engine = require('./engine').engine;
  var testMicroworld, testExperimenter;

  // Create a mock socket that tracks listener registration
  function createMockSocket() {
    var socket = new EventEmitter();
    var listenerCounts = {};

    // Override 'on' to track registrations
    var originalOn = socket.on.bind(socket);
    socket.on = function(event, handler) {
      listenerCounts[event] = (listenerCounts[event] || 0) + 1;
      return originalOn(event, handler);
    };

    // Override 'off' to track removals
    var originalOff = socket.off.bind(socket);
    socket.off = function(event, handler) {
      if (listenerCounts[event]) {
        listenerCounts[event]--;
      }
      return originalOff(event, handler);
    };

    // Add helper to get listener count for tracked events
    socket.getTrackedListenerCount = function(event) {
      return listenerCounts[event] || 0;
    };

    // Add helper to get total listener count for game events
    socket.getGameListenerCount = function() {
      var gameEvents = ['readRules', 'attemptToFish', 'recordIntendedCatch',
                        'goToSea', 'return', 'requestPause', 'requestResume'];
      var total = 0;
      gameEvents.forEach(function(event) {
        total += (listenerCounts[event] || 0);
      });
      return total;
    };

    socket.join = function() {}; // Mock join
    socket.emit = socket.emit.bind(socket); // Ensure emit works properly

    return socket;
  }

  // Create mock io that produces trackable sockets
  function createMockIo() {
    var mockIo = {
      sockets: new EventEmitter(),
      in: function() {
        return { emit: function() {} };
      }
    };

    mockIo.sockets.in = function() {
      return { emit: function() {} };
    };

    // Also make mockIo itself an EventEmitter for ioAdmin
    mockIo.on = function(event, handler) {
      // For ioAdmin connection events
    };
    mockIo.in = function() {
      return { emit: function() {} };
    };

    return mockIo;
  }

  before(async function() {
    this.timeout(10000);
    await setUpTestDb();

    // Create test experimenter
    testExperimenter = await Experimenter.create({
      username: 'leaktest',
      passwordHash: '$2a$12$I5X7O/wRBX3OtKuy47OHz.0mJBLMN8NmQCRDpY84/5tGN02.zwOFG',
    });

    // Create test microworld
    testMicroworld = await Microworld.create({
      name: 'Leak Test MW',
      code: 'LEAKTEST' + Date.now(),
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
        profitSeasonDisabled: false,
        profitTotalDisabled: false,
        profitGapDisabled: true,
        bots: [],
      },
    });
  });

  after(async function() {
    await Microworld.deleteMany({});
    await Experimenter.deleteMany({});
  });

  describe('Event listener cleanup on disconnect', function() {
    it('should remove all game event listeners when socket disconnects', function(done) {
      this.timeout(5000);

      // Create mock io instances
      var io = createMockIo();
      var ioAdmin = createMockIo();

      // Initialize the engine with mock io
      engine(io, ioAdmin);

      // Create a mock socket
      var mockSocket = createMockSocket();

      // Simulate socket connection (this triggers engine's connection handler)
      io.sockets.emit('connection', mockSocket);

      // Simulate entering ocean
      mockSocket.emit('enterOcean', testMicroworld._id.toString(), 'testParticipant1');

      // Wait for ocean assignment callback
      setTimeout(function() {
        // Check that game listeners were registered
        var listenersBeforeDisconnect = mockSocket.getGameListenerCount();

        // Should have 7 game event listeners registered
        listenersBeforeDisconnect.should.equal(7,
          'Should have 7 game event listeners after entering ocean, but found ' + listenersBeforeDisconnect);

        // Now simulate disconnect
        mockSocket.emit('disconnect');

        // After disconnect, all game listeners should be removed
        var listenersAfterDisconnect = mockSocket.getGameListenerCount();

        // THIS IS THE KEY ASSERTION:
        // With the fix applied, this will PASS because listeners are removed
        listenersAfterDisconnect.should.equal(0,
          'All game event listeners should be removed after disconnect. ' +
          'Found ' + listenersAfterDisconnect + ' remaining listeners. ' +
          'This indicates a memory leak.');

        done();
      }, 500);
    });

    it('should not accumulate listeners across multiple connect/disconnect cycles', function(done) {
      this.timeout(10000);

      var io = createMockIo();
      var ioAdmin = createMockIo();

      // Initialize the engine
      engine(io, ioAdmin);

      var cycleCount = 5;
      var mockSockets = [];

      function runCycle(cycleNum, callback) {
        var mockSocket = createMockSocket();
        mockSockets.push(mockSocket);

        io.sockets.emit('connection', mockSocket);
        mockSocket.emit('enterOcean', testMicroworld._id.toString(), 'participant' + cycleNum);

        setTimeout(function() {
          mockSocket.emit('disconnect');

          setTimeout(function() {
            callback();
          }, 100);
        }, 200);
      }

      // Run multiple cycles sequentially
      function runAllCycles(currentCycle) {
        if (currentCycle > cycleCount) {
          // After all cycles, check that no listeners remain on any socket
          var totalRemainingListeners = 0;
          mockSockets.forEach(function(socket) {
            totalRemainingListeners += socket.getGameListenerCount();
          });

          // With the fix, all listeners should be cleaned up (0 total)
          totalRemainingListeners.should.equal(0,
            'No game event listeners should remain after ' + cycleCount + ' disconnect cycles. ' +
            'Found ' + totalRemainingListeners + ' remaining. This indicates a memory leak.');

          done();
        } else {
          runCycle(currentCycle, function() {
            runAllCycles(currentCycle + 1);
          });
        }
      }

      runAllCycles(1);
    });
  });

  describe('Listener count verification', function() {
    it('should have exactly 7 game event listeners after entering ocean', function(done) {
      this.timeout(5000);

      var io = createMockIo();
      var ioAdmin = createMockIo();

      engine(io, ioAdmin);

      var mockSocket = createMockSocket();

      io.sockets.emit('connection', mockSocket);
      mockSocket.emit('enterOcean', testMicroworld._id.toString(), 'counterTest1');

      setTimeout(function() {
        var count = mockSocket.getGameListenerCount();

        // Should have exactly these 7 listeners:
        // readRules, attemptToFish, recordIntendedCatch, goToSea, return, requestPause, requestResume
        count.should.equal(7, 'Should have exactly 7 game event listeners, found ' + count);

        // Also verify disconnect listener exists
        mockSocket.listenerCount('disconnect').should.be.greaterThan(0,
          'Should have disconnect listener');

        // Clean up
        mockSocket.emit('disconnect');

        done();
      }, 500);
    });

    it('should have 0 game event listeners after disconnect', function(done) {
      this.timeout(5000);

      var io = createMockIo();
      var ioAdmin = createMockIo();

      engine(io, ioAdmin);

      var mockSocket = createMockSocket();

      io.sockets.emit('connection', mockSocket);
      mockSocket.emit('enterOcean', testMicroworld._id.toString(), 'counterTest2');

      setTimeout(function() {
        // Disconnect
        mockSocket.emit('disconnect');

        // Verify cleanup
        var count = mockSocket.getGameListenerCount();
        count.should.equal(0, 'Should have 0 game event listeners after disconnect, found ' + count);

        done();
      }, 500);
    });
  });
});
