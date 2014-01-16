var async = require('async');
var log = require('winston');

var Experimenter = require('../models/experimenter-model.js').Experimenter;

// POST /sessions
exports.createSession = function (req, res) {
   var username = req.body.username;
   var password = req.body.password;
   if (!username || !password) {
      return res.status(400).send('Missing username or password');
   }

   async.waterfall([
      function findExperimenter(next) {
         Experimenter.findOne({ username: username },
            function onFound(err, exp) {
               if (err) return next({message: err.message, status: 500});
               if (!exp) return next({message: 'Invalid credentials', status: 409});

               return next(null, exp);
            });
      },
      function checkPassword(exp, next) {
         Experimenter.comparePasswords(password, exp.passwordHash,
            function onCompared(err, match) {
               if (err) return next({message: err.message, status: 500});
               if (!match) return next({message: 'Invalid credentials', status: 409});

               return next(null, exp);
            })
      }
   ],
   function resolve(err, exp) {
      if (err && err.status === 500) {
         log.error('Error on POST /sessions', err);
         return res.status(500).send({errors: 'Internal Server Error'});
      }
      if (err) {
         log.info('Failed login for ' + username);
         return res.status(err.status).send({errors: err.message});
      }

      req.session.username = username;
      log.info('Valid login for ' + username);
      return res.status(200).send(exp);
   });
};
