/*global describe:true, it:true*/
const assert = require('assert');
const request = require('supertest');

const app = require('./app').app;

describe('Sanity checks', () => {
  describe('The test system', () => {
    it('should run a simple test', done => {
      assert('hello' === 'hello', 'The `hello` strings should match');
      return done();
    });

    it('should perform tests in the test environment', done => {
      assert(process.env.NODE_ENV === 'test', 'The NODE_ENV should be `test`');
      return done();
    });
  });

  describe('The web server', () => {
    it('should respond to pings', done => {
      request(app)
        .get('/ping')
        .expect(200)
        .end(function(err, res) {
          assert(err === null, err);
          assert(res.text === 'pong', 'The app did not return with a `pong`');
          return done();
        });
    });
  });
});
