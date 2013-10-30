'use strict';

var fs = require('fs');
var _ = require("underscore");
_.str = require("underscore.string");

var oceanGroups;
var settings;

function loadOceanGroups() {
   var allSavedFiles = fs.readdirSync("saved");
   var lastGroupsFile = null;
   for (var savedFile in allSavedFiles) {
      if (_.str.startsWith(allSavedFiles[savedFile], "groups")) {
         if (lastGroupsFile == null || lastGroupsFile < allSavedFiles[savedFile]) {
            lastGroupsFile = allSavedFiles[savedFile];
         }
      }
   }

   var groupsString = null;
   if (lastGroupsFile != null) {
      console.log("Loading groups from saved/" + lastGroupsFile);
      groupsString = fs.readFileSync("saved/" + lastGroupsFile, {encoding:"utf8"});
      console.log(groupsString);
   }

   var oceanGroupsDetails = null;
   if (groupsString != null) {
      oceanGroupsDetails = JSON.parse(groupsString);
   }

   return oceanGroupsDetails;
}

function loadSettings() {
   var allSavedFiles = fs.readdirSync("saved");
   var lastOceanFile = null;
   for (var savedFile in allSavedFiles) {
      if (_.str.startsWith(allSavedFiles[savedFile], "oceans")) {
         if (lastOceanFile == null || lastOceanFile < allSavedFiles[savedFile]) {
            lastOceanFile = allSavedFiles[savedFile];
         }
      }
   }
   var oceansString = null;
   if (lastOceanFile != null) {
      console.log("Loading oceans from saved/" + lastOceanFile);
      oceansString = fs.readFileSync("saved/" + lastOceanFile, {encoding:"utf8"});
   }
   return oceansString != null ? JSON.parse(oceansString) : new Object();
}

function saveCurrentOceans() {
   var ts = new Date().getTime().toString();
   var filenameGroups = "saved/groups" + ts + ".txt"
   var filenameOceans = "saved/oceans" + ts + ".txt"
   fs.writeFile(filenameGroups, JSON.stringify(oceanGroups), function (err) {
      if (err) {
         return console.log(err);
      }
   });
   fs.writeFile(filenameOceans, JSON.stringify(settings), function (err) {
      if (err) {
         return console.log(err);
      }
   });
   console.log("Current simulation settings logged under " + filenameGroups +
      " and " + filenameOceans + ".");
}

function deleteOceanGroup(name) {
   delete oceanGroups[name];
   for (var i in settings) {
      if (settings[i].settings.name === name) {
         console.log('Deleting ' + i);
         delete settings[i];
      }
   }
}

if (process.argv.length === 3) {
   oceanGroups = loadOceanGroups();
   settings = loadSettings();
   deleteOceanGroup(process.argv[2]);
   saveCurrentOceans();
} else {
   console.log("Usage: node ocean-cleanse.js ocean-to-nuke");
}