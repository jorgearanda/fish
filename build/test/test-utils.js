"use strict";
var config, mongoose;

process.env.NODE_ENV = "test";

mongoose = require("mongoose");

config = require("../config");

beforeEach(function(done) {
  var checkState, clearDB, reconnect;
  clearDB = function() {
    var count, i, total;
    total = Object.keys(mongoose.connection.collections).length;
    if (total === 0) {
      return done();
    }
    count = 0;
    for (i in mongoose.connection.collections) {
      mongoose.connection.collections[i].remove(function(err) {
        if (err) {
          throw err;
        }
        count += 1;
        if (count >= total) {
          return done();
        }
      });
    }
  };
  reconnect = function() {
    mongoose.connect(config.db.test, function(err) {
      if (err) {
        throw err;
      }
      return clearDB();
    });
  };
  checkState = function() {
    switch (mongoose.connection.readyState) {
      case 0:
        reconnect();
        break;
      case 1:
        clearDB();
        break;
      default:
        global.setImmediate(checkState);
    }
  };
  checkState();
});

afterEach(function(done) {
  mongoose.disconnect();
  return done();
});
