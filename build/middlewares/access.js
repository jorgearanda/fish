"use strict";
var isUser;

exports.isUser = isUser = function(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.send(401);
  }
  return next();
};

exports.authenticate = function(req, res, next) {
  if (req.session && req.session.userId) {
    if (req.session.userId === req.params.accountId) {
      return next();
    }
    res.redirect("/admin");
  }
  res.redirect("/admin");
};
