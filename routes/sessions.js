// POST /sessions
exports.createSession = function (req, res) {
   // TODO
   if (!req.body.username || !req.body.password) return res.send(500);
   return res.status(200).send({'_id': '12345'});
};
