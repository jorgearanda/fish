const isUser = req => req.session && req.session.userId;
const isSuperuser = req => req.session && req.session.superuser;
const isSameUserAsParam = req => isUser(req) && req.session.userId === req.params.id;

exports.allowUsers = (req, res, next) => {
  if (isUser(req)) {
    return next();
  } else {
    return res.sendStatus(401);
  }
};

exports.allowOnlySuperusers = (req, res, next) => {
  if (isSuperuser(req)) {
    return next();
  } else {
    return res.sendStatus(401);
  }
};

exports.allowSelfAndSuperusers = (req, res, next) => {
  if (isSuperuser(req) || isSameUserAsParam(req)) {
    return next();
  } else {
    return res.sendStatus(401);
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
