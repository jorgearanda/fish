/*global describe:true, it:true*/
const assert = require('assert');
const request = require('supertest');

// const app = require('./app').app;

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

});
