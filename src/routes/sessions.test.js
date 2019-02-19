/*global describe:true, beforeEach:true, it:true*/
const assert = require('assert');
const request = require('supertest');

const app = require('../app').app;
const Superuser = require('../models/superuser-model').Superuser;
const setUpTestDb = require('../unit-utils').setUpTestDb;

const superuser = {
  username: 'kermit',
  name: 'Kermit The Frog',
  email: 'kermit@muppets.show',
  passwordHash: '$2a$12$I5X7O/wRBX3OtKuy47OHz.0mJBLMN8NmQCRDpY84/5tGN02.zwOFG',
  rawPassword: '123456789',
};

describe('POST /superuser-sessions', () => {
  beforeEach(done => {
    setUpTestDb()
      .then(() => createSuperuser(superuser))
      .then(() => done());
  });

  it('should create a session for valid credentials', done => {
    const userAgent = request.agent(app);
    userAgent
      .post('/superuser-sessions')
      .send({ username: superuser.username, password: superuser.rawPassword })
      .end((err, res) => {
        assert(err === null, err);
        assert(res.statusCode === 200, 'The status code should be 200');
        return done();
      });
  });

  it('should 409 on invalid credentials', done => {
    const userAgent = request.agent(app);
    userAgent
      .post('/superuser-sessions')
      .send({ username: superuser.username, password: 'bad password' })
      .end((err, res) => {
        assert(err === null, err);
        assert(res.statusCode === 409, 'The status code should be 409');
        return done();
      });
  });

  it('should 400 on missing credentials', done => {
    const userAgent = request.agent(app);
    userAgent
      .post('/superuser-sessions')
      .send({ username: superuser.username })
      .end((err, res) => {
        assert(err === null, err);
        assert(res.statusCode === 400, 'The status code should be 400');
        return done();
      });
  });
});

function createSuperuser(fields) {
  return new Promise((resolve, reject) => {
    Superuser.create(fields, (err, doc) => {
      if (err) reject(err);
      resolve(doc);
    });
  });
}
