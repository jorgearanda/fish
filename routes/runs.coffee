
# Turns list of nested object form of queried runs to a list of objects
flattenRunResults = (runs) ->
  flattenArray = []
  produceAllRuns = Array.isArray(runs)
  runs = [runs]  unless produceAllRuns
  i = 0

  while i < runs.length
    results = runs[i].results
    parentalId = runs[i]._id.toString()
    j = 0

    while j < results.length
      fishers = results[j].fishers
      season = results[j].season
      fishAtStart = results[j].fishStart
      fishAtEnd = results[j].fishEnd
      groupRestraint = results[j].groupRestraint
      groupEfficiency = results[j].groupEfficiency
      k = 0

      while k < fishers.length
        toPush = {}
        toPush["Run ID"] = parentalId  if produceAllRuns
        toPush.Fisher = fishers[k].name
        toPush.Type = fishers[k].type
        toPush.Greed = fishers[k].greed
        toPush.GreedSpread = fishers[k].greedSpread
        toPush.Season = season
        toPush["Fish at Start"] = fishAtStart
        toPush["Fish at End"] = fishAtEnd
        toPush["Fish Taken"] = fishers[k].fishTaken
        toPush.Profit = fishers[k].profit
        toPush["Individual Restraint"] = fishers[k].individualRestraint
        toPush["Group Restraint"] = groupRestraint
        toPush["Individual Efficiency"] = fishers[k].individualEfficiency
        toPush["Group Efficiency"] = groupEfficiency
        flattenArray.push toPush
        k++
      j++
    i++
  flattenArray

# Generates a CSV file containing the results of the queried runs
generateCSVRuns = (runs, req, res) ->
  csvArray = flattenRunResults(runs)
  sendHeader =
    "Content-Type": "text/csv"
    "Content-Disposition": "attachment; filename="

  if Array.isArray(runs)
    sendHeader["Content-Disposition"] += runs[0].microworld.name + ".csv"
  else
    sendHeader["Content-Disposition"] += runs.microworld.name + " " + runs.time + ".csv"
  csvConvert.json2csv csvArray, (err, csv) ->
    if err
      if Array.isArray(runs)
        logger.error "Error on GET /runs/?csv=true&mw=" + req.query.mw, err
      else
        logger.error "Error on GET /runs/" + req.params.id + "?csv=true"
      return res.send(500)
    res.set sendHeader
    res.status(200).send csv

  return
"use strict"
logger = require("winston")
ObjectId = require("mongoose").Types.ObjectId
Run = require("../models/run-model").Run
csvConvert = require("json-2-csv")

# GET /runs
exports.list = (req, res) ->
  fields = undefined
  query = "microworld.experimenter._id": ObjectId(req.session.userId)
  query["microworld._id"] = ObjectId(req.query.mw)  if req.query.mw
  return res.send(400)  if req.query.csv is "true" and not req.query.mw
  if req.query.csv is "true" and req.query.mw
    fields =
      results: 1
      microworld: 1
  else
    fields =
      _id: 1
      time: 1
      participants: 1
  Run.find query, fields,
    sort:
      time: 1
  , found = (err, runs) ->
    if err
      logger.error "Error on GET /runs", err
      return res.send(500)
    
    # initiate download
    return generateCSVRuns(runs, req, res)  if req.query.csv is "true"
    res.status(200).send runs

  return


# GET /runs/:id
exports.show = (req, res) ->
  Run.findOne
    _id: ObjectId(req.params.id)
    "microworld.experimenter._id": ObjectId(req.session.userId)
  , foundCb = (err, run) ->
    if err
      logger.error "Error on GET /runs/" + req.params.id, err
      return res.send(500)
    
    # initiate download
    return generateCSVRuns(run, req, res)  if req.query.csv is "true"
    res.status(200).send run

  return
