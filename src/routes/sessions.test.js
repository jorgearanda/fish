/*global describe:true, beforeEach:true, it:true*/
const assert = require('assert');
const request = require('supertest');

const app = require('../app').app;
const Superuser = require('../models/superuser-model').Superuser;
const Experimenter = require('../models/experimenter-model').Experimenter;
const Microworld = require('../models/microworld-model').Microworld;
const setUpTestDb = require('../unit-utils').setUpTestDb;

const superuser = {
  username: 'kermit',
  name: 'Kermit The Frog',
  email: 'kermit@muppets.show',
  passwordHash: '$2a$12$I5X7O/wRBX3OtKuy47OHz.0mJBLMN8NmQCRDpY84/5tGN02.zwOFG',
  rawPassword: '123456789',
};

const experimenter = {
  username: 'honeydew',
  name: 'Professor Honeydew',
  email: 'honeydew@muppets.show',
  passwordHash: '$2a$12$I5X7O/wRBX3OtKuy47OHz.0mJBLMN8NmQCRDpY84/5tGN02.zwOFG',
  rawPassword: '123456789',
};

describe('POST /sessions', () => {
  beforeEach(done => {
    setUpTestDb()
      .then(() => createExperimenter(experimenter))
      .then(() => done());
  });

  it('should create a session for valid credentials', done => {
    const userAgent = request.agent(app);
    userAgent
      .post('/sessions')
      .send({ username: experimenter.username, password: experimenter.rawPassword })
      .end((err, res) => {
        assert(err === null, err);
        assert(res.statusCode === 200, 'The status code should be 200');
        assert(res.body.username === experimenter.username);
        return done();
      });
  });

  it('should 409 on invalid credentials (wrong password)', done => {
    const userAgent = request.agent(app);
    userAgent
      .post('/sessions')
      .send({ username: experimenter.username, password: 'wrong password' })
      .end((err, res) => {
        assert(err === null, err);
        assert(res.statusCode === 409, 'The status code should be 409');
        assert(res.body.errors === 'Invalid credentials');
        return done();
      });
  });

  it('should 409 on non-existent username', done => {
    const userAgent = request.agent(app);
    userAgent
      .post('/sessions')
      .send({ username: 'nonexistent', password: 'password' })
      .end((err, res) => {
        assert(err === null, err);
        assert(res.statusCode === 409, 'The status code should be 409');
        assert(res.body.errors === 'Invalid credentials');
        return done();
      });
  });

  it('should 400 on missing username', done => {
    const userAgent = request.agent(app);
    userAgent
      .post('/sessions')
      .send({ password: experimenter.rawPassword })
      .end((err, res) => {
        assert(err === null, err);
        assert(res.statusCode === 400, 'The status code should be 400');
        return done();
      });
  });

  it('should 400 on missing password', done => {
    const userAgent = request.agent(app);
    userAgent
      .post('/sessions')
      .send({ username: experimenter.username })
      .end((err, res) => {
        assert(err === null, err);
        assert(res.statusCode === 400, 'The status code should be 400');
        return done();
      });
  });
});

describe('POST /participant-sessions', () => {
  let testMicroworld;

  beforeEach(done => {
    setUpTestDb()
      .then(() => createExperimenter(experimenter))
      .then(exp => {
        return Microworld.create({
          name: 'Test Microworld',
          code: 'TEST123',
          experimenter: {
            _id: exp._id,
            username: exp.username,
          },
          status: 'active',
          dateCreated: new Date(),
          params: {},
        });
      })
      .then(mw => {
        testMicroworld = mw;
        done();
      });
  });

  it('should create a participant session with valid code', done => {
    const userAgent = request.agent(app);
    userAgent
      .post('/participant-sessions')
      .send({ code: 'TEST123', pid: 'participant1' })
      .end((err, res) => {
        assert(err === null, err);
        assert(res.statusCode === 200, 'The status code should be 200');
        assert(res.body.code === 'TEST123');
        assert(res.body.name === 'Test Microworld');
        return done();
      });
  });

  it('should accept test status microworlds', done => {
    Microworld.updateOne(
      { _id: testMicroworld._id },
      { status: 'test' }
    ).then(() => {
      const userAgent = request.agent(app);
      userAgent
        .post('/participant-sessions')
        .send({ code: 'TEST123', pid: 'participant2' })
        .end((err, res) => {
          assert(err === null, err);
          assert(res.statusCode === 200, 'The status code should be 200');
          return done();
        });
    });
  });

  it('should 409 on invalid code', done => {
    const userAgent = request.agent(app);
    userAgent
      .post('/participant-sessions')
      .send({ code: 'INVALID', pid: 'participant1' })
      .end((err, res) => {
        assert(err === null, err);
        assert(res.statusCode === 409, 'The status code should be 409');
        assert(res.body.errors.includes('Invalid experiment code'));
        return done();
      });
  });

  it('should 409 on archived microworld', done => {
    Microworld.updateOne(
      { _id: testMicroworld._id },
      { status: 'archived' }
    ).then(() => {
      const userAgent = request.agent(app);
      userAgent
        .post('/participant-sessions')
        .send({ code: 'TEST123', pid: 'participant3' })
        .end((err, res) => {
          assert(err === null, err);
          assert(res.statusCode === 409, 'The status code should be 409');
          return done();
        });
    });
  });

  it('should 400 on missing code', done => {
    const userAgent = request.agent(app);
    userAgent
      .post('/participant-sessions')
      .send({ pid: 'participant1' })
      .end((err, res) => {
        assert(err === null, err);
        assert(res.statusCode === 400, 'The status code should be 400');
        return done();
      });
  });

  it('should 400 on missing participant ID', done => {
    const userAgent = request.agent(app);
    userAgent
      .post('/participant-sessions')
      .send({ code: 'TEST123' })
      .end((err, res) => {
        assert(err === null, err);
        assert(res.statusCode === 400, 'The status code should be 400');
        return done();
      });
  });
});

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

function createExperimenter(fields) {
  return new Promise((resolve, reject) => {
    Experimenter.create(fields, (err, doc) => {
      if (err) reject(err);
      resolve(doc);
    });
  });
}
