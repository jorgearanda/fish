var ObjectId, Run, csvConvert, flattenRunResults, generateCSVRuns, logger;

flattenRunResults = function(runs) {
  var fishAtEnd, fishAtStart, fishers, flattenArray, groupEfficiency, groupRestraint, i, j, k, parentalId, produceAllRuns, results, season, toPush;
  flattenArray = [];
  produceAllRuns = Array.isArray(runs);
  if (!produceAllRuns) {
    runs = [runs];
  }
  i = 0;
  while (i < runs.length) {
    results = runs[i].results;
    parentalId = runs[i]._id.toString();
    j = 0;
    while (j < results.length) {
      fishers = results[j].fishers;
      season = results[j].season;
      fishAtStart = results[j].fishStart;
      fishAtEnd = results[j].fishEnd;
      groupRestraint = results[j].groupRestraint;
      groupEfficiency = results[j].groupEfficiency;
      k = 0;
      while (k < fishers.length) {
        toPush = {};
        if (produceAllRuns) {
          toPush["Run ID"] = parentalId;
        }
        toPush.Fisher = fishers[k].name;
        toPush.Type = fishers[k].type;
        toPush.Greed = fishers[k].greed;
        toPush.GreedSpread = fishers[k].greedSpread;
        toPush.Season = season;
        toPush["Fish at Start"] = fishAtStart;
        toPush["Fish at End"] = fishAtEnd;
        toPush["Fish Taken"] = fishers[k].fishTaken;
        toPush.Profit = fishers[k].profit;
        toPush["Individual Restraint"] = fishers[k].individualRestraint;
        toPush["Group Restraint"] = groupRestraint;
        toPush["Individual Efficiency"] = fishers[k].individualEfficiency;
        toPush["Group Efficiency"] = groupEfficiency;
        flattenArray.push(toPush);
        k++;
      }
      j++;
    }
    i++;
  }
  return flattenArray;
};

generateCSVRuns = function(runs, req, res) {
  var csvArray, sendHeader;
  csvArray = flattenRunResults(runs);
  sendHeader = {
    "Content-Type": "text/csv",
    "Content-Disposition": "attachment; filename="
  };
  if (Array.isArray(runs)) {
    sendHeader["Content-Disposition"] += runs[0].microworld.name + ".csv";
  } else {
    sendHeader["Content-Disposition"] += runs.microworld.name + " " + runs.time + ".csv";
  }
  csvConvert.json2csv(csvArray, function(err, csv) {
    if (err) {
      if (Array.isArray(runs)) {
        logger.error("Error on GET /runs/?csv=true&mw=" + req.query.mw, err);
      } else {
        logger.error("Error on GET /runs/" + req.params.id + "?csv=true");
      }
      return res.send(500);
    }
    res.set(sendHeader);
    return res.status(200).send(csv);
  });
};

"use strict";

logger = require("winston");

ObjectId = require("mongoose").Types.ObjectId;

Run = require("../models/run-model").Run;

csvConvert = require("json-2-csv");

exports.list = function(req, res) {
  var fields, found, query;
  fields = void 0;
  query = {
    "microworld.experimenter._id": ObjectId(req.session.userId)
  };
  if (req.query.mw) {
    query["microworld._id"] = ObjectId(req.query.mw);
  }
  if (req.query.csv === "true" && !req.query.mw) {
    return res.send(400);
  }
  if (req.query.csv === "true" && req.query.mw) {
    fields = {
      results: 1,
      microworld: 1
    };
  } else {
    fields = {
      _id: 1,
      time: 1,
      participants: 1
    };
  }
  Run.find(query, fields, {
    sort: {
      time: 1
    }
  }, found = function(err, runs) {
    if (err) {
      logger.error("Error on GET /runs", err);
      return res.send(500);
    }
    if (req.query.csv === "true") {
      return generateCSVRuns(runs, req, res);
    }
    return res.status(200).send(runs);
  });
};

exports.show = function(req, res) {
  var foundCb;
  Run.findOne({
    _id: ObjectId(req.params.id),
    "microworld.experimenter._id": ObjectId(req.session.userId)
  }, foundCb = function(err, run) {
    if (err) {
      logger.error("Error on GET /runs/" + req.params.id, err);
      return res.send(500);
    }
    if (req.query.csv === "true") {
      return generateCSVRuns(run, req, res);
    }
    return res.status(200).send(run);
  });
};
