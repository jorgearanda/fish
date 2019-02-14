'use strict';
/*global describe:true, it:true*/

var should = require('should');
var mongoose = require('mongoose');
var request = require('supertest');

var testUtils = require('./unit-utils');
var app = require('./app').app;

describe('Sanity checks', function() {
  describe('The test system', function() {
    it('should run an isolated test', function(done) {
      'hello'.should.equal('hello');
      return done();
    });

    it('should perform tests in the test environment', function(done) {
      process.env.NODE_ENV.should.equal('test');
      return done();
    });

    it('should have a mongoose connection', function(done) {
      mongoose.connection.readyState.should.equal(1);
      return done();
    });
  });

  describe('The web server', function() {
    it('should respond to pings', function(done) {
      request(app)
        .get('/ping')
        .expect(200)
        .end(function(err, res) {
          should.not.exist(err);
          res.text.should.equal('pong');
          return done();
        });
    });
  });
});
