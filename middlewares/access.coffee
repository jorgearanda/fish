"use strict"
exports.isUser = isUser = (req, res, next) ->
  return res.send(401)  if not req.session or not req.session.userId
  next()


# Used for checking experimenter authentication
exports.authenticate = (req, res, next) ->
  if req.session and req.session.userId
    return next()  if req.session.userId is req.params.accountId
    res.redirect "/admin"
  res.redirect "/admin"
  return
