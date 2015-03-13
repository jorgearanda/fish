"use strict"

#global beforeEach:true, afterEach:true
process.env.NODE_ENV = "test"
mongoose = require("mongoose")
config = require("../config")
beforeEach (done) ->
  clearDB = ->
    total = Object.keys(mongoose.connection.collections).length
    return done()  if total is 0
    count = 0
    for i of mongoose.connection.collections
      mongoose.connection.collections[i].remove (err) ->
        throw err  if err
        count += 1
        done()  if count >= total

    return
  reconnect = ->
    mongoose.connect config.db.test, (err) ->
      throw err  if err
      clearDB()

    return
  checkState = ->
    switch mongoose.connection.readyState
      when 0
        reconnect()
      when 1
        clearDB()
      else
        global.setImmediate checkState
    return
  checkState()
  return

afterEach (done) ->
  mongoose.disconnect()
  done()

