const mongoose = require('mongoose');

const config = require('./config');

exports.setUpTestDb = function setUpTestDb() {
  process.env.NODE_ENV = 'test';
  return new Promise(resolve => {
    connect()
      .then(() => clearDatabase())
      .then(() => resolve());
  });
};

function connect() {
  return new Promise((resolve, reject) => {
    mongoose.connect(config.db.test, err => {
      if (err) reject(err);
      resolve();
    });
  });
}

function clearDatabase() {
  return new Promise((resolve, reject) => {
    const total = Object.keys(mongoose.connection.collections).length;
    if (total === 0) resolve();

    let count = 0;
    for (let i in mongoose.connection.collections) {
      mongoose.connection.collections[i].deleteMany({}, function(err) {
        if (err) reject(err);

        count += 1;
        if (count >= total) {
          resolve();
        }
      });
    }
  });
}
