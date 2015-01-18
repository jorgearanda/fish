'use strict';

var logger = require('winston');
var ObjectId = require('mongoose').Types.ObjectId;

var Run = require('../models/run-model').Run;
var csvConvert = require('json-2-csv');

// Turns list of nested object form of queried runs to a list of objects
function flattenRunResults(runs) {
    var flattenArray = [];
    var produceAllRuns = Array.isArray(runs);
    if (!produceAllRuns) runs = [runs];
    for(var i = 0; i < runs.length; i++) {
        var results = runs[i].results;
        var parentalId = runs[i]._id.toString();
        for (var j = 0; j < results.length; j++) {
            var fishers = results[j].fishers;
            var season = results[j].season;
            var fishAtStart = results[j].fishStart;
            var fishAtEnd = results[j].fishEnd;
            var groupRestraint = results[j].groupRestraint;
            var groupEfficiency = results[j].groupEfficiency;
            
            for (var k = 0; k < fishers.length; k++) {
                var toPush = {};
                if (produceAllRuns) toPush['Run ID'] = parentalId;
                toPush.Fisher = fishers[k].name;
                toPush.Type = fishers[k].type;
                toPush.Greed = fishers[k].greed;
                toPush.Season = season;
                toPush['Fish at Start'] = fishAtStart;
                toPush['Fish at End'] = fishAtEnd;
                toPush['Fish Taken'] = fishers[k].fishTaken;
                toPush.Profit = fishers[k].profit;
                toPush['Individual Restraint'] = fishers[k].individualRestraint;
                toPush['Group Restraint'] = groupRestraint;
                toPush['Individual Efficiency'] = fishers[k].individualEfficiency;
                toPush['Group Efficiency'] = groupEfficiency;
                flattenArray.push(toPush);
            }
        }
    }

    return flattenArray;
}

// Generates a CSV file containing the results of the queried runs
function generateCSVRuns(runs, res) {
    var csvArray = flattenRunResults(runs);
    var sendHeader = { 'Content-Type' : 'text/csv', 'Content-Disposition' : 'attachment; filename=' };
    if (Array.isArray(runs)) sendHeader['Content-Disposition']+= runs[0].microworld.name + '.csv';
    else sendHeader['Content-Disposition']+= runs.microworld.name + ' ' + runs.time + '.csv';
    
    csvConvert.json2csv(csvArray, function(err, csv) {
        if(err) {
            logger.error('Error on GET /runs/:id?csv=true', err);
            return res.send(500);
        }

        res.set(sendHeader);
        return res.status(200).send(csv);
    });
}


// GET /runs
exports.list = function (req, res) {
    var fields;
    var query = { 'microworld.experimenter._id': ObjectId(req.session.userId) };
    if (req.query.mw) query['microworld._id'] = ObjectId(req.query.mw);
   
    if (req.query.csv === 'true' && !req.query.mw) return res.send(400);
    if (req.query.csv === 'true' && req.query.mw) fields = { results : 1, microworld : 1 };
    else fields = {_id: 1, time: 1, participants: 1};

    Run.find(query, fields, { sort: {time: 1}}, function found(err, runs) {
        if (err) {
            logger.error('Error on GET /runs', err);
            return res.send(500);
        }

        // initiate download
        if (req.query.csv === 'true') return generateCSVRuns(runs, res); 
        return res.status(200).send(runs);
    });
};


// GET /runs/:id
exports.show = function (req, res) {
    Run.findOne({
        _id: ObjectId(req.params.id),
        'microworld.experimenter._id' : ObjectId(req.session.userId)
    }, function foundCb(err, run) {
        if (err) {
            logger.error('Error on GET /runs/' + req.params.id, err);
            return res.send(500);
        }
        
        // initiate download
        if (req.query.csv === 'true') return generateCSVRuns(run, res);
        return res.status(200).send(run);
    });
};
