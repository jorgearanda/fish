exports.isUser = function isUser(req, res, next) {
  if (!req.session || !req.session.userId) return res.send(401);
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
