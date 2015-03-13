"use strict"

#global describe:true, it:true
should = require("should")
mongoose = require("mongoose")
request = require("supertest")
testUtils = require("./test-utils")
app = require("../app").app
describe "Sanity checks", ->
  describe "The test system", ->
    it "should run an isolated test", (done) ->
      "hello".should.equal "hello"
      done()

    it "should perform tests in the test environment", (done) ->
      process.env.NODE_ENV.should.equal "test"
      done()

    it "should have a mongoose connection", (done) ->
      mongoose.connection.readyState.should.equal 1
      done()

    return

  describe "The web server", ->
    it "should respond to pings", (done) ->
      request(app).get("/ping").expect(200).end (err, res) ->
        should.not.exist err
        res.text.should.equal "pong"
        done()

      return

    return

  return

