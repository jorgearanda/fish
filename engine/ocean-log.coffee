"use strict"
log = require("winston")
exports.OceanLog = OceanLog = (oceanName) ->
  @oceanName = oceanName
  @entries = []
  @debug = (msg) ->
    log.debug "Ocean " + @oceanName + ": " + msg
    return

  @info = (msg) ->
    @saveEntry msg
    log.info "Ocean " + @oceanName + ": " + msg
    return

  @warn = (msg) ->
    @saveEntry msg
    log.warn "Ocean " + @oceanName + ": " + msg
    return

  @error = (msg) ->
    @saveEntry msg
    log.error "Ocean " + @oceanName + ": " + msg
    return

  @saveEntry = (msg) ->
    @entries.push "" + new Date() + ": " + msg
    return

  return
