'use strict';
/*global describe:true, it:true*/

var request = require('supertest');
var should = require('should');

describe('App - Error Handling', function() {
  var app;

  before(function() {
    app = require('./app').app;
  });

  describe('Malformed JSON Handling (Bug #3)', function() {
    it('should handle malformed JSON gracefully without crashing', function(done) {
      this.timeout(5000);

      // Send malformed JSON (starts with 't' instead of valid JSON)
      // This mimics the production error: "SyntaxError: Unexpected token t in JSON at position 0"
      request(app)
        .post('/runs')
        .set('Content-Type', 'application/json')
        .send('this is not valid json')
        .expect(400) // Should return 400 Bad Request instead of crashing
        .end(function(err, res) {
          if (err) return done(err);

          // The response should indicate a bad request
          res.status.should.equal(400);
          should.exist(res.body);

          return done();
        });
    });

    it('should handle empty JSON body gracefully', function(done) {
      this.timeout(5000);

      request(app)
        .post('/runs')
        .set('Content-Type', 'application/json')
        .send('')
        .end(function(err, res) {
          // Empty body should not crash the server
          // Status may vary (404, 400, 409) depending on route
          res.status.should.not.equal(500);
          return done();
        });
    });

    it('should still process valid JSON correctly', function(done) {
      this.timeout(5000);

      // Valid JSON should still work
      request(app)
        .post('/runs')
        .set('Content-Type', 'application/json')
        .send({ code: 'TESTCODE123' })
        .end(function(err, res) {
          // May return 409 (invalid code) or other status, but shouldn't be 400 or crash
          res.status.should.not.equal(500); // Should not be server error
          return done();
        });
    });
  });
});
