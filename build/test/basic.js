"use strict";
var app, mongoose, request, should, testUtils;

should = require("should");

mongoose = require("mongoose");

request = require("supertest");

testUtils = require("./test-utils");

app = require("../app").app;

describe("Sanity checks", function() {
  describe("The test system", function() {
    it("should run an isolated test", function(done) {
      "hello".should.equal("hello");
      return done();
    });
    it("should perform tests in the test environment", function(done) {
      process.env.NODE_ENV.should.equal("test");
      return done();
    });
    it("should have a mongoose connection", function(done) {
      mongoose.connection.readyState.should.equal(1);
      return done();
    });
  });
  describe("The web server", function() {
    it("should respond to pings", function(done) {
      request(app).get("/ping").expect(200).end(function(err, res) {
        should.not.exist(err);
        res.text.should.equal("pong");
        return done();
      });
    });
  });
});
