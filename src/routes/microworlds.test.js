const should = require('should');
const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../app').app;
const Microworld = require('../models/microworld-model').Microworld;
const Experimenter = require('../models/experimenter-model').Experimenter;
const unitUtils = require('../unit-utils');

describe('Routes - Microworlds', () => {
  let testExperimenter;
  let testMicroworld;
  let agent;

  before(async () => {
    await unitUtils.setUpTestDb();

    // Create test experimenter with hashed password
    const passwordHash = await new Promise((resolve, reject) => {
      Experimenter.hashPassword('password123', (err, hash) => {
        if (err) reject(err);
        resolve(hash);
      });
    });

    testExperimenter = await Experimenter.create({
      username: 'testuser',
      passwordHash: passwordHash,
    });

    // Create test microworld
    testMicroworld = await Microworld.create({
      name: 'Test Microworld',
      code: 'TEST01',
      experimenter: {
        _id: testExperimenter._id,
        username: testExperimenter.username,
      },
      desc: 'A test microworld',
      status: 'test',
      dateCreated: new Date(),
      dateActive: null,
      dateArchived: null,
      numCompleted: 0,
      numAborted: 0,
      params: {
        numFishers: 4,
        numSeasons: 10,
        initialFish: 100,
      },
    });

    // Create authenticated agent
    agent = request.agent(app);
    await agent
      .post('/sessions')
      .send({ username: 'testuser', password: 'password123' });
  });

  after(async () => {
    await Microworld.deleteMany({});
    await Experimenter.deleteMany({});
  });

  describe('GET /microworlds', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/microworlds');
      res.status.should.equal(401);
    });

    it('should return list of microworlds for authenticated user', async () => {
      const res = await agent.get('/microworlds');
      res.status.should.equal(200);
      res.body.should.be.an.Array();
      res.body.length.should.be.greaterThan(0);
      res.body[0].should.have.property('name');
      res.body[0].should.have.property('code');
      res.body[0].should.have.property('status');
    });

    it('should filter microworlds by status when status query param provided', async () => {
      // Create microworlds with different statuses
      await Microworld.create({
        name: 'Active Microworld',
        code: 'ACTIVE',
        experimenter: {
          _id: testExperimenter._id,
          username: testExperimenter.username,
        },
        status: 'active',
        dateCreated: new Date(),
        dateActive: new Date(),
        params: {},
      });

      const res = await agent.get('/microworlds?status=active');
      res.status.should.equal(200);
      res.body.should.be.an.Array();
      res.body.every(mw => mw.status === 'active').should.be.true();
    });

    it('should return only experimenter\'s own microworlds', async () => {
      const res = await agent.get('/microworlds');
      res.status.should.equal(200);
      res.body.every(
        mw => mw.experimenter._id.toString() === testExperimenter._id.toString()
      ).should.be.true();
    });
  });

  describe('GET /microworlds/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get(`/microworlds/${testMicroworld._id}`);
      res.status.should.equal(401);
    });

    it('should return microworld details for authenticated user', async () => {
      const res = await agent.get(`/microworlds/${testMicroworld._id}`);
      res.status.should.equal(200);
      res.body.should.have.property('_id');
      res.body.should.have.property('name');
      res.body.should.have.property('code');
      res.body.should.have.property('status');
      res.body.should.have.property('params');
      res.body.name.should.equal('Test Microworld');
      res.body.code.should.equal('TEST01');
    });

    it('should return microworld with nested params', async () => {
      const res = await agent.get(`/microworlds/${testMicroworld._id}`);
      res.status.should.equal(200);
      res.body.params.should.have.property('numFishers');
      res.body.params.numFishers.should.equal(4);
    });
  });

  describe('POST /microworlds', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .post('/microworlds')
        .send({ name: 'New Microworld' });
      res.status.should.equal(401);
    });

    it('should create a new microworld with auto-generated code', async () => {
      const res = await agent.post('/microworlds').send({
        name: 'New Test Microworld',
        desc: 'A newly created microworld',
        numFishers: 5,
        numSeasons: 12,
      });

      res.status.should.equal(200);
      res.body.should.have.property('_id');
      res.body.should.have.property('code');
      res.body.code.should.match(/^[A-Z0-9]{6}$/);
      res.body.name.should.equal('New Test Microworld');
      res.body.status.should.equal('test');
    });

    it('should generate unique codes for multiple microworlds', async () => {
      const res1 = await agent.post('/microworlds').send({
        name: 'Microworld 1',
        desc: 'First',
      });

      const res2 = await agent.post('/microworlds').send({
        name: 'Microworld 2',
        desc: 'Second',
      });

      res1.status.should.equal(200);
      res2.status.should.equal(200);
      res1.body.code.should.not.equal(res2.body.code);
    });

    it('should set experimenter from session', async () => {
      const res = await agent.post('/microworlds').send({
        name: 'Session Test',
        desc: 'Testing experimenter assignment',
      });

      res.status.should.equal(200);
      res.body.experimenter._id.should.equal(testExperimenter._id.toString());
      res.body.experimenter.username.should.equal(testExperimenter.username);
    });

    it('should set initial status to test', async () => {
      const res = await agent.post('/microworlds').send({
        name: 'Status Test',
        desc: 'Testing initial status',
      });

      res.status.should.equal(200);
      res.body.status.should.equal('test');
      should.exist(res.body.dateCreated);
      should.not.exist(res.body.dateActive);
      should.not.exist(res.body.dateArchived);
    });

    it('should store params excluding name and desc', async () => {
      const res = await agent.post('/microworlds').send({
        name: 'Params Test',
        desc: 'Testing params storage',
        numFishers: 6,
        numSeasons: 15,
        fishValue: 3.5,
        certainFish: 100,
      });

      res.status.should.equal(200);
      res.body.params.should.have.property('numFishers', 6);
      res.body.params.should.have.property('numSeasons', 15);
      res.body.params.should.have.property('fishValue', 3.5);
      res.body.params.should.have.property('certainFish', 100);
      res.body.params.should.not.have.property('name');
      res.body.params.should.not.have.property('desc');
    });

    it('should append clone suffix when clone param is true', async () => {
      const res = await agent.post('/microworlds').send({
        name: 'Original',
        desc: 'Clone test',
        clone: true,
      });

      res.status.should.equal(200);
      res.body.name.should.match(/Original clone [A-Z0-9]{6}/);
    });

    it('should initialize counters to zero', async () => {
      const res = await agent.post('/microworlds').send({
        name: 'Counter Test',
        desc: 'Testing counters',
      });

      res.status.should.equal(200);
      res.body.numCompleted.should.equal(0);
      res.body.numAborted.should.equal(0);
    });
  });

  describe('PUT /microworlds/:id', () => {
    let updateableMicroworld;

    beforeEach(async () => {
      updateableMicroworld = await Microworld.create({
        name: 'Updateable',
        code: 'UPDATE',
        experimenter: {
          _id: testExperimenter._id,
          username: testExperimenter.username,
        },
        status: 'test',
        dateCreated: new Date(),
        params: { initialValue: 10 },
      });
    });

    afterEach(async () => {
      await Microworld.deleteOne({ _id: updateableMicroworld._id });
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .put(`/microworlds/${updateableMicroworld._id}`)
        .send({ name: 'Updated Name' });
      res.status.should.equal(401);
    });

    it('should update microworld name and description', async () => {
      const res = await agent
        .put(`/microworlds/${updateableMicroworld._id}`)
        .send({
          name: 'Updated Name',
          desc: 'Updated description',
          initialValue: 10,
        });

      res.status.should.equal(204);

      const updated = await Microworld.findById(updateableMicroworld._id);
      updated.name.should.equal('Updated Name');
      updated.desc.should.equal('Updated description');
    });

    it('should update params without duplicating name/desc', async () => {
      const res = await agent
        .put(`/microworlds/${updateableMicroworld._id}`)
        .send({
          name: 'New Name',
          desc: 'New Desc',
          fishValue: 5.0,
          certainFish: 150,
        });

      res.status.should.equal(204);

      const updated = await Microworld.findById(updateableMicroworld._id);
      updated.params.should.have.property('fishValue', 5.0);
      updated.params.should.have.property('certainFish', 150);
      updated.params.should.not.have.property('name');
      updated.params.should.not.have.property('desc');
    });

    it('should change status to active when changeTo=active', async () => {
      const res = await agent
        .put(`/microworlds/${updateableMicroworld._id}`)
        .send({
          name: 'Active Test',
          changeTo: 'active',
        });

      res.status.should.equal(204);

      const updated = await Microworld.findById(updateableMicroworld._id);
      updated.status.should.equal('active');
      should.exist(updated.dateActive);
      should.not.exist(updated.dateArchived);
    });

    it('should change status to archived when changeTo=archived', async () => {
      const res = await agent
        .put(`/microworlds/${updateableMicroworld._id}`)
        .send({
          name: 'Archive Test',
          changeTo: 'archived',
        });

      res.status.should.equal(204);

      const updated = await Microworld.findById(updateableMicroworld._id);
      updated.status.should.equal('archived');
      should.exist(updated.dateArchived);
    });

    it('should not include changeTo in params', async () => {
      const res = await agent
        .put(`/microworlds/${updateableMicroworld._id}`)
        .send({
          name: 'No ChangeTo Param',
          changeTo: 'active',
          numFishers: 8,
        });

      res.status.should.equal(204);

      const updated = await Microworld.findById(updateableMicroworld._id);
      updated.params.should.not.have.property('changeTo');
      updated.params.should.have.property('numFishers', 8);
    });
  });

  describe('DELETE /microworlds/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).delete(
        `/microworlds/${testMicroworld._id}`
      );
      res.status.should.equal(401);
    });

    it('should delete a microworld', async () => {
      const toDelete = await Microworld.create({
        name: 'To Delete',
        code: 'DELETE',
        experimenter: {
          _id: testExperimenter._id,
          username: testExperimenter.username,
        },
        status: 'test',
        dateCreated: new Date(),
        params: {},
      });

      const res = await agent.delete(`/microworlds/${toDelete._id}`);
      res.status.should.equal(204);

      const deleted = await Microworld.findById(toDelete._id);
      should.not.exist(deleted);
    });
  });

  describe('Access Control', () => {
    let otherExperimenter;
    let otherMicroworld;

    before(async () => {
      const passwordHash = await new Promise((resolve, reject) => {
        Experimenter.hashPassword('password456', (err, hash) => {
          if (err) reject(err);
          resolve(hash);
        });
      });

      otherExperimenter = await Experimenter.create({
        username: 'otheruser',
        passwordHash: passwordHash,
      });

      otherMicroworld = await Microworld.create({
        name: 'Other Microworld',
        code: 'OTHER1',
        experimenter: {
          _id: otherExperimenter._id,
          username: otherExperimenter.username,
        },
        status: 'test',
        dateCreated: new Date(),
        params: {},
      });
    });

    after(async () => {
      await Experimenter.deleteOne({ _id: otherExperimenter._id });
      await Microworld.deleteOne({ _id: otherMicroworld._id });
    });

    it('should not return other experimenter\'s microworlds in list', async () => {
      const res = await agent.get('/microworlds');
      res.status.should.equal(200);

      const otherMwInList = res.body.find(
        mw => mw._id.toString() === otherMicroworld._id.toString()
      );
      should.not.exist(otherMwInList);
    });

    it('should allow viewing other experimenter\'s microworld details', async () => {
      // Note: The show route doesn't filter by experimenter, which might be a bug
      const res = await agent.get(`/microworlds/${otherMicroworld._id}`);
      res.status.should.equal(200);
      res.body._id.should.equal(otherMicroworld._id.toString());
    });
  });

  describe('Code Generation Edge Cases', () => {
    it('should handle code conflicts by retrying', async () => {
      // Pre-create microworlds with specific codes to test retry logic
      const existingCodes = ['CODE01', 'CODE02', 'CODE03'];
      for (const code of existingCodes) {
        await Microworld.create({
          name: `Existing ${code}`,
          code: code,
          experimenter: {
            _id: testExperimenter._id,
            username: testExperimenter.username,
          },
          status: 'test',
          dateCreated: new Date(),
          params: {},
        });
      }

      // Creating a new microworld should get a different code
      const res = await agent.post('/microworlds').send({
        name: 'New After Conflicts',
        desc: 'Testing code uniqueness',
      });

      res.status.should.equal(200);
      res.body.should.have.property('code');
      existingCodes.should.not.containEql(res.body.code);
    });
  });
});
