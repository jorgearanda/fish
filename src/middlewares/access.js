exports.isUser = function isUser(req, res, next) {
  if (!req.session || !req.session.userId) return res.sendStatus(401);
  return next();
};

exports.isSuperuser = function isSuperuser(req, res, next) {
  if (!req.session || !req.session.superuser) return res.sendStatus(401);
  return next();
};

// Used for checking experimenter authentication
function isUserSameAsParamsId(req, res, next) {
  if (
    req.session &&
    req.session.userId &&
    req.session.userId === req.params.accountId
  ) {
    return next();
  } else {
    return res.redirect('/admin');
  }
}

exports.isUserSameAsParamsId = isUserSameAsParamsId;
