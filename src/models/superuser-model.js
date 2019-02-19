var bcrypt = require('bcrypt');
var mongoose = require('mongoose');

var BCRYPT_COST = 12;

var Schema = mongoose.Schema;

var superuserSchema = new Schema({
  username: {
    type: String,
    unique: true,
  },
  passwordHash: String,
  name: String,
  email: String,
});

superuserSchema.statics.hashPassword = function hash(rawPassword, next) {
  return bcrypt.hash(rawPassword, BCRYPT_COST, next);
};

superuserSchema.statics.comparePasswords = function(raw, hash, next) {
  return bcrypt.compare(raw, hash, next);
};

exports.Superuser = mongoose.model('Superuser', superuserSchema);
