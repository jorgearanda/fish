'use strict';

var logger = require('winston');
var ObjectId = require('mongoose').Types.ObjectId;

var Run = require('../models/run-model').Run;
var csvConvert = require('json-2-csv');

// Per participant and season: number of disconnects, seconds away (counted
// for the season the disconnect happened in, once they are back), and why
// they were lost, if they were. A disconnect during the break before a season
// counts toward that season (resultsSeason). Events after a participant's
// last season row (e.g. lost during the break before a season they never
// played) go on that last row, so nothing goes missing from the CSV.
function summarizeConnectionEvents(events, lastSeasonByFisher) {
  var summary = {}; // participant -> season -> { disconnects, secondsAway, lost }
  var disconnectSeason = {}; // participant -> season of their latest disconnect
  events.forEach(function(e) {
    var season = e.resultsSeason !== undefined && e.resultsSeason !== null ? e.resultsSeason : e.season;
    var last = lastSeasonByFisher[e.participant];
    if (last !== undefined && season > last) season = last;
    if (e.event === 'reconnected' && disconnectSeason[e.participant] !== undefined) {
      season = disconnectSeason[e.participant];
    }
    var forFisher = summary[e.participant] = summary[e.participant] || {};
    var s = forFisher[season] = forFisher[season] || { disconnects: 0, secondsAway: 0, lost: '' };
    if (e.event === 'disconnected') {
      s.disconnects++;
      disconnectSeason[e.participant] = season;
    }
    if (e.event === 'reconnected') s.secondsAway += e.secondsAway || 0;
    if (e.event === 'removed' || e.event === 'game ended') s.lost = e.event + ': ' + e.reason;
  });
  return summary;
}

function lastSeasonPerFisher(results) {
  var last = {};
  results.forEach(function(r) {
    r.fishers.forEach(function(f) {
      if (last[f.name] === undefined || r.season > last[f.name]) last[f.name] = r.season;
    });
  });
  return last;
}

// Turns list of nested object form of queried runs to a list of objects
function flattenRunResults(runs) {
  var flattenArray = [];
  var produceAllRuns = Array.isArray(runs);
  if (!produceAllRuns) runs = [runs];
  for (var i = 0; i < runs.length; i++) {
    var results = runs[i].results;
    var parentalId = runs[i]._id.toString();
    var devicesByFisher = {};
    (runs[i].devices || []).forEach(function(d) {
      devicesByFisher[d.participant] = d;
    });
    var connectionByFisher = summarizeConnectionEvents(runs[i].connectionEvents || [], lastSeasonPerFisher(results));
    var endReason = runs[i].endReason || '';
    for (var j = 0; j < results.length; j++) {
      var fishers = results[j].fishers;
      var season = results[j].season;
      var fishAtStart = results[j].fishStart;
      var fishAtEnd = results[j].fishEnd;
      var groupRestraint = results[j].groupRestraint;
      var groupEfficiency = results[j].groupEfficiency;

      for (var k = 0; k < fishers.length; k++) {
        var toPush = {};
        toPush['Run ID'] = parentalId;
        toPush.Fisher = fishers[k].name;
        toPush.Type = fishers[k].type;
        toPush.Greed = fishers[k].greed;
        toPush.GreedSpread = fishers[k].greedSpread;
        toPush.Season = season;
        toPush['Fish at Start'] = fishAtStart;
        toPush['Fish at End'] = fishAtEnd;
        toPush['Fish Planned'] = fishers[k].fishPlanned;
        toPush['Fish Taken'] = fishers[k].fishTaken;
        toPush.Profit = fishers[k].profit;
        toPush['Individual Restraint'] = fishers[k].individualRestraint;
        toPush['Group Restraint'] = groupRestraint;
        toPush['Individual Efficiency'] = fishers[k].individualEfficiency;
        toPush['Group Efficiency'] = groupEfficiency;

        // This fisher's disconnects in this season; the end reason is the run's
        var connection = (connectionByFisher[fishers[k].name] || {})[season] ||
          { disconnects: 0, secondsAway: 0, lost: '' };
        toPush.Disconnects = connection.disconnects;
        toPush['Seconds Away'] = connection.secondsAway;
        toPush.Lost = connection.lost;
        toPush['Run End Reason'] = endReason;

        // Device columns last (the CSV keeps this order). They stay empty for
        // bots and for runs saved before devices were recorded
        var device = devicesByFisher[fishers[k].name] || {};
        toPush['Device Class'] = device.deviceClass || '';
        toPush['Device Brand'] = device.brand || '';
        toPush['Device Model'] = device.model || '';
        toPush.OS = device.os || '';
        toPush['OS Version'] = device.osVersion || '';
        toPush.Browser = device.browser || '';
        toPush['Browser Version'] = device.browserVersion || '';
        toPush['In-App Browser'] = device.inAppBrowser || '';
        toPush['Screen Size'] = device.screenWidth ? device.screenWidth + 'x' + device.screenHeight : '';
        toPush['User Agent'] = device.userAgent || '';
        flattenArray.push(toPush);
      }
    }
  }

  return flattenArray;
}
exports.flattenRunResults = flattenRunResults;

// Generates a CSV file containing the results of the queried runs
function generateCSVRuns(runs, req, res) {
  var csvArray = flattenRunResults(runs);
  var sendHeader = { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=' };
  if (Array.isArray(runs)) {
    sendHeader['Content-Disposition'] += runs[0].microworld.name + '.csv';
  } else {
    sendHeader['Content-Disposition'] += runs.microworld.name + ' ' + runs.time + '.csv';
  }

  csvConvert.json2csv(csvArray, function(err, csv) {
    if (err) {
      if (Array.isArray(runs)) {
        logger.error('Error on GET /runs/?csv=true&mw=' + req.query.mw, err);
      } else {
        logger.error('Error on GET /runs/' + req.params.id + '?csv=true');
      }

      return res.sendStatus(500);
    }

    res.set(sendHeader);
    return res.status(200).send(csv);
  });
}

// GET /runs
exports.list = function(req, res) {
  var fields;
  var query = { 'microworld.experimenter._id': ObjectId(req.session.userId) };
  if (req.query.mw) query['microworld._id'] = ObjectId(req.query.mw);

  if (req.query.csv === 'true' && !req.query.mw) return res.sendStatus(400);
  if (req.query.csv === 'true' && req.query.mw) {
    fields = { results: 1, microworld: 1, devices: 1, endReason: 1, connectionEvents: 1 };
  } else {
    fields = { _id: 1, time: 1, participants: 1 };
  }

  Run.find(query, fields, { sort: { time: 1 } }, function found(err, runs) {
    if (err) {
      logger.error('Error on GET /runs', err);
      return res.sendStatus(500);
    }

    // initiate download
    if (req.query.csv === 'true') return generateCSVRuns(runs, req, res);
    return res.status(200).send(runs);
  });
};

// GET /runs/:id
exports.show = function(req, res) {
  Run.findOne(
    {
      _id: ObjectId(req.params.id),
      'microworld.experimenter._id': ObjectId(req.session.userId),
    },
    function foundCb(err, run) {
      if (err) {
        logger.error('Error on GET /runs/' + req.params.id, err);
        return res.sendStatus(500);
      }

      // initiate download
      if (req.query.csv === 'true') return generateCSVRuns(run, req, res);
      return res.status(200).send(run);
    }
  );
};
