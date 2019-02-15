/*global describe:true, beforeEach:true, it:true*/
import assert from 'assert';
import request from 'supertest';

import { app } from '../app';
import { Experimenter } from '../models/experimenter-model';


describe('GET /a/:id/profile', () => {
  let account_id;
  const exp = {
    username: 'honeydew',
    name: 'Professor Honeydew',
    email: 'honeydew@muppets.show',
    passwordHash: 'notReallyAHash',
  };

  beforeEach((done) => {
    // createExperimenter(exp).then(() => done());
    Experimenter.create(exp, (_, doc) => {
      account_id = doc.id;
      return done();
    });
  });

  it('should return a profile for the experimenter account', (done) => {
    request(app)
      .get('/a/' + account_id + '/profile')
      .expect(200)
      .end((err, res) => {
        assert(err === null, err);
        assert(res.text.includes('Update Profile'), 'Bad heading');
        assert(res.text.includes(exp.username), 'Bad username');
        assert(res.text.includes(exp.name), 'Bad name');
        assert(res.text.includes(exp.email), 'Bad email');

        return done();
      });
  });
});

// async function not working
// async function createExperimenter(exp) {
//   Experimenter.create(exp, (_, doc) => {
//     return doc.id;
//   });
// }
