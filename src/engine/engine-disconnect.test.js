'use strict';
/*global describe:true, it:true, before:true, after:true*/

// Disconnect handling through the socket layer: a participant drops, rejoins
// with a new socket, and is refused once lost. The ocean logic itself is
// tested in ocean.test.js.

var should = require('should');
var EventEmitter = require('events');

var Microworld = require('../models/microworld-model').Microworld;
var Experimenter = require('../models/experimenter-model').Experimenter;
var setUpTestDb = require('../unit-utils').setUpTestDb;

describe('Engine - Disconnect handling', function() {
  var engine = require('./engine').engine;
  var GRACE = 0.2; // seconds
  var mw, om, ocean, mwId;

  function createMockSocket(id) {
    var socket = new EventEmitter();
    socket.id = id;
    socket.sent = [];
    // Record what the server sends to this participant
    var emit = socket.emit.bind(socket);
    socket.emit = function(event, data, extra) {
      socket.sent.push({ event: event, data: data });
      if (event === 'ocean') socket.sentOcean = extra;
      return emit.apply(null, arguments);
    };
    socket.join = function() {};
    socket.leave = function() {};
    return socket;
  }

  function sent(socket, event) {
    return socket.sent.filter(function(s) { return s.event === event; });
  }

  function connect(id, pId) {
    var socket = createMockSocket(id);
    io.sockets.emit('connection', socket);
    socket.emit('enterOcean', mwId, pId, {});
    return socket;
  }

  var room = { emit: function() {} };
  var io = { sockets: new EventEmitter(), in: function() { return room; }, on: function() {} };
  io.sockets.in = function() { return room; };
  io.sockets.connected = {};

  before(async function() {
    this.timeout(10000);
    await setUpTestDb();
    var experimenter = await Experimenter.create({ username: 'disconnecttest', passwordHash: 'x' });
    mw = await Microworld.create({
      name: 'Disconnect Test MW',
      code: 'DISC' + Date.now(),
      status: 'test',
      experimenter: { _id: experimenter._id, username: experimenter.username },
      dateCreated: new Date(),
      params: {
        numFishers: 2,
        numHumans: 2,
        seasonDuration: 10,
        initialDelay: 5,
        seasonDelay: 5,
        certainFish: 10,
        availableMysteryFish: 0,
        reportedMysteryFish: 0,
        numSeasons: 2,
        catchIntentSeasons: [],
        bots: [],
        disconnectHandlingEnabled: true,
        disconnectGracePeriod: GRACE,
        disconnectDuringGrace: 'pause',
        disconnectsAllowed: 3,
        disconnectLostAction: 'remove',
      },
    });
    mwId = mw._id.toString();
    om = engine(io, io);
  });

  after(async function() {
    if (ocean) ocean.status = 'over'; // stops the ocean's loop
    await Microworld.deleteMany({});
    await Experimenter.deleteMany({});
  });

  var socketA, socketB;

  it('should seat two participants in one ocean', function(done) {
    socketA = connect('A', 'h1');
    // The second joins once the first one's ocean exists (creating it is async)
    setTimeout(function() { socketB = connect('B', 'h2'); }, 300);
    setTimeout(function() {
      var ids = Object.keys(om.oceans);
      ids.length.should.equal(1);
      ocean = om.oceans[ids[0]];
      ocean.fishers.length.should.equal(2);
      // Joined before the game started: the rules screen is wanted
      socketA.sentOcean.rejoining.should.be.false();
      // Hold the game in a manual pause: in progress, but the clock stands still
      ocean.unpauseState = 'running';
      ocean.status = 'paused';
      ocean.pausedBy = 'test';
      done();
    }, 600);
  });

  it('should keep a participant who drops mid-game in the grace period', function() {
    socketA.emit('disconnect');
    should(ocean.findFisherIndex('h1')).not.be.null();
    ocean.isFisherDisconnected('h1').should.be.true();
  });

  it('should put them back in the game when they return on a new socket', function() {
    var socketA2 = connect('A2', 'h1');
    ocean.isFisherDisconnected('h1').should.be.false();
    ocean.isCurrentSocket('h1', 'A2').should.be.true();
    sent(socketA2, 'rejoined').length.should.equal(1);
    // ...and told up front, so the page never opens the rules screen
    sent(socketA2, 'ocean')[0].should.have.property('data');
    socketA2.sentOcean.rejoining.should.be.true();
    sent(socketA2, 'rejoined')[0].data.status.status.should.equal('paused');
    Object.keys(om.oceans).length.should.equal(1);
    socketA = socketA2;
  });

  it('should ignore the old socket\'s late disconnect after a rejoin', function() {
    var stale = createMockSocket('A-old');
    stale.emit('disconnect'); // never entered: no handlers, nothing happens
    ocean.isFisherDisconnected('h1').should.be.false();
  });

  it('should refuse a participant who returns after being lost', function(done) {
    socketB.emit('disconnect');
    setTimeout(function() {
      ocean.isLost('h2').should.be.true();
      should(ocean.findFisherIndex('h2')).be.null();
      var socketB2 = connect('B2', 'h2');
      sent(socketB2, 'joinError').length.should.equal(1);
      sent(socketB2, 'joinError')[0].data.message.should.match(/lost/);
      Object.keys(om.oceans).length.should.equal(1); // not seated in a new game
      done();
    }, GRACE * 2000);
  });

  it('should remember who was in the game when it started', function() {
    // The test skipped the real start (getOceanReady), so set it as that would
    ocean.playersAtStart = ['h1', 'h2'];
    ocean.hasPlayed('h1').should.be.true();
    ocean.hasPlayed('nobody').should.be.false();
  });

  it('should remove a dropped participant at once when handling is off', function() {
    ocean.microworld.params.disconnectHandlingEnabled = false;
    // Between seasons: h1 is the last human, and no season was really started
    // here that the game could close when it ends for lack of humans
    ocean.status = 'resting';
    socketA.emit('disconnect');
    should(ocean.findFisherIndex('h1')).be.null();
    var h1 = ocean.connectionEvents.filter(function(e) { return e.participant === 'h1'; });
    h1.map(function(e) { return e.event; }).should.eql(['disconnected', 'reconnected', 'disconnected', 'removed']);
    h1[3].reason.should.equal('disconnect handling off');
  });

  it('should show "game over", not a new game, to a page reconnecting after its game ended', function(done) {
    // h1 was the last human, so the game has ended
    ocean.isRemovable().should.be.true();
    var socket = createMockSocket('A3');
    io.sockets.emit('connection', socket);
    socket.emit('enterOcean', mwId, 'h1', {}, true);
    setTimeout(function() {
      sent(socket, 'end run').length.should.equal(1);
      sent(socket, 'end run')[0].data.should.equal('nohumans');
      sent(socket, 'ocean').length.should.equal(0);
      Object.keys(om.oceans).length.should.equal(1);
      done();
    }, 100);
  });

  it('should still let a fresh visit with the same ID start a new game', function(done) {
    var socket = createMockSocket('A4');
    io.sockets.emit('connection', socket);
    socket.emit('enterOcean', mwId, 'h1', {}, false);
    setTimeout(function() {
      sent(socket, 'ocean').length.should.equal(1);
      Object.keys(om.oceans).length.should.equal(2);
      done();
    }, 300);
  });
});

describe('Ocean manager - reconnecting pages', function() {
  var OceanManager = require('./ocean-manager').OceanManager;
  var om;

  function stubOcean(options) {
    return {
      microworld: { _id: 'mw1' },
      isLost: function() { return false; },
      findFisherIndex: function() { return null; },
      hasRoom: function() { return false; },
      hasPlayed: function(p) { return p === 'h1'; },
      isRemovable: function() { return options.over; },
      endReason: options.over ? 'time' : null,
    };
  }

  beforeEach(function() {
    var room = { emit: function() {} };
    var io = { sockets: { in: function() { return room; } }, in: function() { return room; } };
    om = new OceanManager(io, io);
  });

  it('should refuse a page removed from a game still in progress', function(done) {
    om.oceans.o1 = stubOcean({ over: false });
    om.assignFisherToOcean('mw1', 'h1', {}, function(oId, failure) {
      should(oId).be.null();
      failure.should.equal('removed');
      done();
    }, true);
  });

  it('should send a page whose game ended to "game over"', function(done) {
    om.oceans.o1 = stubOcean({ over: true });
    om.assignFisherToOcean('mw1', 'h1', {}, function(oId, failure, info) {
      failure.should.equal('gameOver');
      info.endReason.should.equal('time');
      done();
    }, true);
  });
});
