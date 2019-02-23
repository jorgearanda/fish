exports.isUser = function isUser(req, res, next) {
  if (!req.session || !req.session.userId) return res.sendStatus(401);
  return next();
};

exports.isSuperuser = function isSuperuser(req, res, next) {
  if (!req.session || !req.session.superuser) return res.sendStatus(401);
  return next();
};

exports.isSuperuserOrAllowedUser = function isSuperuserOrAllowedUser(req, res, next) {
  if (
    !req.session ||
    (!req.session.superuser && req.session.userId !== req.params.id)
  ) {
    return res.sendStatus(401);
  } else {
    return next();
  }
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
