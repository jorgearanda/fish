/*global describe:true, beforeEach:true, it:true*/
const assert = require('assert');
const request = require('supertest');

const app = require('../app').app;
const Experimenter = require('../models/experimenter-model').Experimenter;

const experimenter = {
  username: 'honeydew',
  name: 'Professor Honeydew',
  email: 'honeydew@muppets.show',
  passwordHash: '$2a$12$I5X7O/wRBX3OtKuy47OHz.0mJBLMN8NmQCRDpY84/5tGN02.zwOFG',
  rawPassword: '123456789',
};
const anotherExperimenter = {
  username: 'beaker',
  name: 'Assistant Professor Beaker',
  email: 'beaker@muppets.show',
  passwordHash: 'we do not need a valid hash',
};
let account_id;
let agent;

describe('GET /a/:id/profile', () => {
  describe('when a user is logged in', () => {
    beforeEach(done => {
      createUser(experimenter)
        .then(doc => getAgentForUser(doc, experimenter.rawPassword))
        .then(result => {
          account_id = result.doc.id;
          agent = result.agent;
          return done();
        });
    });

    it('should return a profile for the experimenter account', done => {
      agent
        .get('/a/' + account_id + '/profile')
        .expect(200)
        .end((err, res) => {
          assert(err === null, err);
          assert(res.text.includes('Update Profile'), 'Bad page header');
          assert(res.text.includes(experimenter.username), 'Bad username');
          assert(res.text.includes(experimenter.name), 'Bad name');
          assert(res.text.includes(experimenter.email), 'Bad email');
          return done();
        });
    });

    it('should redirect to login when trying to access an invalid profile', done => {
      agent
        .get('/a/notAValidId/profile')
        .expect(302)
        .end((err, res) => {
          assert(err === null, err);
          assert(res.header.location === '/admin', 'Bad redirection target');
          return done();
        });
    });

    it('should redirect to login when trying to access another valid profile', done => {
      createUser(anotherExperimenter).then(doc => {
        agent
          .get('/a/' + doc.id + '/profile')
          .expect(302)
          .end((err, res) => {
            assert(err === null, err);
            assert(res.header.location === '/admin', 'Bad redirection target');
            return done();
          });
      });
    });
  });

  describe('when a user is *not* logged in', () => {
    beforeEach(done => {
      createUser(experimenter).then(doc => {
        account_id = doc.id;
        agent = request.agent(app);
        return done();
      });
    });

    it('should not return a profile, even if it exists', done => {
      agent
        .get('/a/' + account_id + '/profile')
        .expect(302)
        .end((err, res) => {
          assert(err === null, err);
          assert(res.header.location === '/admin', 'Bad redirection target');
          return done();
        });
    });
  });
});

function createUser(fields) {
  return new Promise((resolve, reject) => {
    Experimenter.create(fields, (err, doc) => {
      if (err) reject(err);
      resolve(doc);
    });
  });
}

function getAgentForUser(fields, rawPassword) {
  return new Promise((resolve, reject) => {
    const userAgent = request.agent(app);
    userAgent
      .post('/sessions')
      .send({ username: fields.username, password: rawPassword })
      .end(err => {
        if (err) reject(err);
        resolve({ doc: fields, agent: userAgent });
      });
  });
}
