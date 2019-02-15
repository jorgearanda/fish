/*global describe:true, it:true*/
const assert = require('assert');
const ObjectId = require('mongoose').Types.ObjectId;

const DbId = require('./db-id').DbId;


describe('DbId', () => {
  const validIdString = '52d823fca288c98f65000000';
  const invalidIdString = 'nope';

  it('should create and provide an ObjectId', done => {
    const dbId = new DbId(validIdString);
    assert(dbId.isValid(), 'The id string ' + validIdString + ' should be valid');
    assert(dbId.asObjectId instanceof ObjectId, 'Expected the id to be an instance of ObjectId');

    return done();
  });

  it('should return `null` for an invalid ObjectId string', done => {
    const dbId = new DbId(invalidIdString);
    assert(!dbId.isValid(), 'The id string ' + invalidIdString + ' should be invalid');
    assert(dbId.asObjectId === null, 'Expected an invalid id to return null');

    return done();
  })
});
