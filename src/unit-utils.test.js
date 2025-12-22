const should = require('should');
const mongoose = require('mongoose');
const unitUtils = require('./unit-utils');

describe('Unit Utils', () => {
  describe('setUpTestDb', () => {
    it('should set NODE_ENV to test', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      try {
        await unitUtils.setUpTestDb();
        process.env.NODE_ENV.should.equal('test');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('should return a promise', () => {
      const result = unitUtils.setUpTestDb();
      result.should.be.a.Promise();
    });

    it('should successfully connect and clear database', async () => {
      // This test actually runs the function since we're in test mode
      // and verifies it completes without error
      const originalEnv = process.env.NODE_ENV;

      try {
        await unitUtils.setUpTestDb();
        // If we get here, the function completed successfully
        mongoose.connection.readyState.should.be.greaterThan(0);
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });
});
