'use strict';

var log = require('winston');
var OceanManager = require('./ocean-manager').OceanManager;

// Why a returning participant may not rejoin (from OceanManager.assignFisherToOcean).
// The page shows its own translation of each code (fish.js: end_<code>); the
// message is the fallback.
var REFUSALS = {
  lost: {
    log: 'lost from their game after disconnecting',
    message: 'Your connection was lost for too long, so you cannot rejoin this game.',
  },
  removed: {
    log: 'removed from their game, which is still under way',
    message: 'You were disconnected from your game and removed from it, so you cannot rejoin.',
  },
};

// A participant back in a game that already started (reload, network drop,
// new tab): end their grace period, then rebuild their screen, or show the
// end of a game that is over
function restoreRejoiningFisher(socket, ocean, pId) {
  if (ocean.isFisherDisconnected(pId)) {
    ocean.fisherReconnected(pId);
  }
  if (ocean.isGameInProgress()) {
    socket.emit('rejoined', ocean.getRejoinState());
    // Still waiting for someone else: show this participant the countdown too
    if (ocean.isDisconnectPauseActive()) ocean.updateDisconnectPause();
  } else if (ocean.isRemovable()) {
    socket.emit('end run', ocean.endReason);
  }
}

exports.engine = function engine(io, ioAdmin) {
  log.info('Starting engine');
  var om = new OceanManager(io, ioAdmin);

  io.sockets.on('connection', function(socket) {
    var clientOId;
    var clientPId;

    socket.on('enterOcean', function(mwId, pId, pParams, isRejoin) {
      clientPId = pId;
      clientOId = om.assignFisherToOcean(mwId, pId, pParams, enteredOcean, !!isRejoin);
    });

    var enteredOcean = function(newOId, failure, info) {
      if (failure === 'gameOver') {
        socket.emit('end run', info && info.endReason);
        return;
      }
      if (REFUSALS[failure]) {
        log.info('Refused rejoin by ' + clientPId + ': ' + REFUSALS[failure].log);
        socket.emit('joinError', { code: failure, message: REFUSALS[failure].message });
        return;
      }
      if (!newOId) {
        log.error('Failed to enter ocean - microworld not found or error occurred');
        socket.emit('joinError', { message: 'Unable to join simulation. The experiment may no longer be available.' });
        return;
      }

      var myOId = newOId;
      var myPId = clientPId;

      // Capture the previous socket ID before setFisherNotifier overwrites it
      var prevSocketId = om.oceans[myOId].getSocketId(myPId);

      socket.join(myOId);
      // A game already under way (or over) means this page is rejoining: it
      // must not open the rules screen (see fish.js setupOcean)
      var alreadyStarted = om.oceans[myOId].isGameInProgress() || om.oceans[myOId].isRemovable();
      socket.emit('ocean', om.oceans[myOId].getParams(), { rejoining: alreadyStarted });
      io.sockets.in(myOId).emit('lobbyStatus', om.oceans[myOId].getLobbyStatus());

      // Update ownership first so any incoming disconnect from the old socket
      // is recognised as stale before we tell it to go away
      om.oceans[myOId].setFisherNotifier(myPId, socket.id, function(event, data) {
        socket.emit(event, data);
      });

      // Now displace the previous socket (ownership already transferred above)
      if (prevSocketId && prevSocketId !== socket.id) {
        var prevSocket = io.sockets.connected[prevSocketId];
        if (prevSocket) {
          prevSocket.emit('displaced', {});
          prevSocket.leave(myOId);
          log.debug('Displaced stale socket ' + prevSocketId + ' for ' + myPId + ' from room ' + myOId);
        }
      }

      if (alreadyStarted) restoreRejoiningFisher(socket, om.oceans[myOId], myPId);

      // Define handlers as named functions so we can remove them on disconnect
      // This prevents memory leaks from accumulated event listeners
      function onReadRules() {
        if (om.oceans[myOId]) {
          om.oceans[myOId].readRules(myPId);
          io.sockets.in(myOId).emit('aFisherIsReady', myPId);
          io.sockets.in(myOId).emit('lobbyStatus', om.oceans[myOId].getLobbyStatus());
        }
      }

      function onAttemptToFish() {
        if (om.oceans[myOId]) {
          om.oceans[myOId].attemptToFish(myPId);
        }
      }

      function onRecordIntendedCatch(numFish) {
        if (om.oceans[myOId]) {
          om.oceans[myOId].recordIntendedCatch(myPId, numFish);
        }
      }

      function onGoToSea() {
        if (om.oceans[myOId]) {
          om.oceans[myOId].goToSea(myPId);
        }
      }

      function onReturn() {
        if (om.oceans[myOId]) {
          om.oceans[myOId].returnToPort(myPId);
        }
      }

      function onRequestPause() {
        if (om.oceans[myOId]) {
          om.oceans[myOId].pause(myPId);
        }
      }

      function onRequestResume() {
        if (om.oceans[myOId]) {
          om.oceans[myOId].resume(myPId);
        }
      }

      function onKeepReading() {
        if (om.oceans[myOId]) {
          om.oceans[myOId].keepReading(myPId);
        }
      }

      function onProceedToLobby() {
        if (om.oceans[myOId]) {
          om.oceans[myOId].readRules(myPId);
          io.sockets.in(myOId).emit('aFisherIsReady', myPId);
          io.sockets.in(myOId).emit('lobbyStatus', om.oceans[myOId].getLobbyStatus());
        }
      }

      function onKeepWaiting() {
        if (om.oceans[myOId]) {
          om.oceans[myOId].keepWaiting(myPId);
        }
      }

      function onDeviceInfo(info) {
        if (om.oceans[myOId]) {
          om.oceans[myOId].recordDevice(myPId, info);
        }
      }

      function onAbortFish() {
        if (om.oceans[myOId]) {
          om.oceans[myOId].clearAllAbortTimers(myPId);
          om.oceans[myOId].log.info('Fisher ' + myPId + ' aborted session.');
        }
      }

      function onDisconnect() {
        // Clean up all event listeners first to prevent memory leaks
        socket.off('readRules', onReadRules);
        socket.off('attemptToFish', onAttemptToFish);
        socket.off('recordIntendedCatch', onRecordIntendedCatch);
        socket.off('goToSea', onGoToSea);
        socket.off('return', onReturn);
        socket.off('requestPause', onRequestPause);
        socket.off('requestResume', onRequestResume);
        socket.off('keepReading', onKeepReading);
        socket.off('proceedToLobby', onProceedToLobby);
        socket.off('keepWaiting', onKeepWaiting);
        socket.off('abortFish', onAbortFish);
        socket.off('deviceInfo', onDeviceInfo);
        socket.off('disconnect', onDisconnect);

        var ocean = om.oceans[myOId];
        if (!ocean) {
          log.debug('Disconnect event for participant ' + myPId + ' but ocean ' + myOId + ' no longer exists');
        } else if (!ocean.isCurrentSocket(myPId, socket.id)) {
          // Only the active socket counts: the participant has already reconnected elsewhere
          log.debug('Stale socket disconnect for ' + myPId + ' in ocean ' + myOId + ' — skipping removal');
        } else if (ocean.disconnectHandlingApplies()) {
          // Grace period: the fisher stays in the game and may reconnect
          ocean.fisherDisconnected(myPId);
        } else {
          if (ocean.isGameInProgress()) {
            // Dropped mid-run with disconnect handling off: removed at once, as always
            var simulationData = ocean.grabSimulationData();
            simulationData.participants = [myPId];
            ioAdmin.in(ocean.microworld.experimenter._id.toString()).emit('simulationInterrupt', simulationData);
            ocean.recordConnectionEvent(myPId, 'disconnected');
            ocean.recordConnectionEvent(myPId, 'removed', { reason: 'disconnect handling off' });
          }
          om.removeFisherFromOcean(myOId, myPId);
          if (om.oceans[myOId] && om.oceans[myOId].isInSetup()) {
            io.sockets.in(myOId).emit('lobbyStatus', om.oceans[myOId].getLobbyStatus());
          }
        }

        log.debug('Cleaned up socket handlers for participant ' + myPId);
      }

      // Register all event handlers
      socket.on('readRules', onReadRules);
      socket.on('attemptToFish', onAttemptToFish);
      socket.on('recordIntendedCatch', onRecordIntendedCatch);
      socket.on('goToSea', onGoToSea);
      socket.on('return', onReturn);
      socket.on('requestPause', onRequestPause);
      socket.on('requestResume', onRequestResume);
      socket.on('keepReading', onKeepReading);
      socket.on('proceedToLobby', onProceedToLobby);
      socket.on('keepWaiting', onKeepWaiting);
      socket.on('abortFish', onAbortFish);
      socket.on('deviceInfo', onDeviceInfo);
      socket.on('disconnect', onDisconnect);
    };
  });

  ioAdmin.on('connection', function(socket) {
    var expId;

    socket.on('enterDashboard', function(experimenterId) {
      expId = experimenterId;
      log.info('Experimenter ' + expId + ' is viewing dashboard');
      socket.join(expId);
      socket.emit('currentRunningSimulations', om.trackedSimulations);
    });

    socket.on('disconnect', function() {
      log.info('Experimenter ' + expId + ' disconnected from dashboard');
    });
  });

  return om; // for tests
};
