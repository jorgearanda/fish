"use strict"

#global describe:true, it:true
should = require("should")
testUtils = require("../test-utils")
OceanLog = require("../../engine/ocean-log").OceanLog
describe "Engine - Ocean Log", ->
  it "should initialize", (done) ->
    ol = new OceanLog("TestOcean")
    ol.oceanName.should.equal "TestOcean"
    ol.entries.length.should.equal 0
    done()

  it "should record entries on info, warn, and error", (done) ->
    ol = new OceanLog("TestOcean")
    ol.info "info"
    ol.warn "warn"
    ol.error "error"
    ol.entries.length.should.equal 3
    done()

  return

