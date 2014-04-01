'use strict';

exports.isUser = function isUser(req, res, next) {
    if (!req.session || !req.session.userId) return res.send(401);
    return next();
}