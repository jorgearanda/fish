exports.isUser = function isUser(req, res, next) {
  if (!req.session || !req.session.userId) return res.send(401);
  return next();
};

// Used for checking experimenter authentication
exports.authenticate = function(req, res, next) {
  if (req.session && req.session.userId) {
    if (req.session.userId === req.params.accountId) {
      return next();
    }
    return res.redirect('/admin');
  }
  return res.redirect('/admin');
};
