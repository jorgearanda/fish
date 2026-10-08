const mongoose = require('mongoose');

const config = require('./config');

exports.setUpTestDb = async function setUpTestDb() {
  process.env.NODE_ENV = 'test';
  await connect();
  await clearDatabase();
};

async function connect() {
  const state = mongoose.connection.readyState;

  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (state === 1) {
    // Already connected
    return;
  }

  if (state === 2) {
    // Connection in progress - wait for it
    await new Promise((resolve, reject) => {
      mongoose.connection.once('connected', resolve);
      mongoose.connection.once('error', reject);
    });
    return;
  }

  // Not connected and not connecting - initiate connection
  // Use family: 4 to force IPv4 (localhost may resolve to IPv6 ::1 which MongoDB may not listen on)
  await mongoose.connect(config.db.test, { family: 4 });
}

async function clearDatabase() {
  const collections = Object.values(mongoose.connection.collections);
  if (collections.length === 0) {
    return;
  }
  await Promise.all(collections.map(collection => collection.deleteMany({})));
}
