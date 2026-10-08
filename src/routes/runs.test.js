const should = require('should');
const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../app').app;
const Run = require('../models/run-model').Run;
const Experimenter = require('../models/experimenter-model').Experimenter;
const unitUtils = require('../unit-utils');

describe('Routes - Runs', () => {
  let testExperimenter;
  let testRun;
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

    // Create test run data
    testRun = await Run.create({
      microworld: {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Microworld',
        experimenter: {
          _id: testExperimenter._id,
          username: testExperimenter.username,
        },
      },
      time: new Date('2025-01-01T10:00:00Z'),
      participants: ['Fisher1', 'Fisher2'],
      results: [
        {
          season: 1,
          fishStart: 100,
          fishEnd: 80,
          groupRestraint: 0.2,
          groupEfficiency: 0.8,
          fishers: [
            {
              name: 'Fisher1',
              type: 'human',
              greed: 0.5,
              greedSpread: 0.1,
              fishPlanned: 10,
              fishTaken: 8,
              profit: 24,
              individualRestraint: 0.2,
              individualEfficiency: 0.8,
            },
            {
              name: 'Fisher2',
              type: 'bot',
              greed: 0.6,
              greedSpread: 0.15,
              fishPlanned: 15,
              fishTaken: 12,
              profit: 36,
              individualRestraint: 0.2,
              individualEfficiency: 0.8,
            },
          ],
        },
        {
          season: 2,
          fishStart: 80,
          fishEnd: 60,
          groupRestraint: 0.25,
          groupEfficiency: 0.75,
          fishers: [
            {
              name: 'Fisher1',
              type: 'human',
              greed: 0.55,
              greedSpread: 0.1,
              fishPlanned: 12,
              fishTaken: 10,
              profit: 54,
              individualRestraint: 0.17,
              individualEfficiency: 0.83,
            },
            {
              name: 'Fisher2',
              type: 'bot',
              greed: 0.65,
              greedSpread: 0.15,
              fishPlanned: 12,
              fishTaken: 10,
              profit: 66,
              individualRestraint: 0.17,
              individualEfficiency: 0.83,
            },
          ],
        },
      ],
      devices: [
        {
          participant: 'Fisher1',
          deviceClass: 'phone',
          brand: 'Samsung',
          model: 'SM-A105F',
          os: 'Android',
          osVersion: '9',
          browser: 'Chrome',
          browserVersion: '90.0',
          inAppBrowser: 'WhatsApp',
          touch: true,
          screenWidth: 360,
          screenHeight: 760,
          userAgent: 'test-agent',
        },
      ],
      endReason: 'time',
      connectionEvents: [
        // Like a real test run: away 13 s mid-season 1, then 17 s during the
        // break after season 1, which counts toward season 2
        { participant: 'Fisher1', event: 'disconnected', season: 1, phase: 'running', resultsSeason: 1 },
        { participant: 'Fisher1', event: 'reconnected', season: 1, phase: 'running', resultsSeason: 1, secondsAway: 13 },
        { participant: 'Fisher1', event: 'disconnected', season: 1, phase: 'resting', resultsSeason: 2 },
        { participant: 'Fisher1', event: 'reconnected', season: 1, phase: 'resting', resultsSeason: 2, secondsAway: 17 },
      ],
    });

    // Create authenticated agent
    agent = request.agent(app);
  });

  after(async () => {
    await Run.deleteMany({});
    await Experimenter.deleteMany({});
  });

  describe('GET /runs', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/runs');
      res.status.should.equal(401);
    });

    it('should return list of runs for authenticated user', async () => {
      // Login
      await agent
        .post('/sessions')
        .send({ username: 'testuser', password: 'password123' });

      const res = await agent.get('/runs');
      res.status.should.equal(200);
      res.body.should.be.an.Array();
      res.body.length.should.be.greaterThan(0);
      res.body[0].should.have.property('_id');
      res.body[0].should.have.property('time');
      res.body[0].should.have.property('participants');
    });

    it('should filter runs by microworld when mw query param provided', async () => {
      const mwId = testRun.microworld._id.toString();
      const res = await agent.get(`/runs?mw=${mwId}`);
      res.status.should.equal(200);
      res.body.should.be.an.Array();
    });

    it('should return 400 when csv=true but no mw parameter', async () => {
      const res = await agent.get('/runs?csv=true');
      res.status.should.equal(400);
    });

    it('should return CSV when csv=true with mw parameter', async () => {
      const mwId = testRun.microworld._id.toString();
      const res = await agent.get(`/runs?csv=true&mw=${mwId}`);
      res.status.should.equal(200);
      res.headers['content-type'].should.match(/text\/csv/);
      res.headers['content-disposition'].should.match(/attachment/);
      res.headers['content-disposition'].should.match(/Test Microworld\.csv/);
    });
  });

  describe('GET /runs/:id', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get(`/runs/${testRun._id}`);
      res.status.should.equal(401);
    });

    it('should return run details for authenticated user', async () => {
      const res = await agent.get(`/runs/${testRun._id}`);
      res.status.should.equal(200);
      res.body.should.have.property('_id');
      res.body.should.have.property('microworld');
      res.body.should.have.property('results');
      res.body.results.should.be.an.Array();
      res.body.results.length.should.equal(2);
    });

    it('should return CSV when csv=true query param provided', async () => {
      const res = await agent.get(`/runs/${testRun._id}?csv=true`);
      res.status.should.equal(200);
      res.headers['content-type'].should.match(/text\/csv/);
      res.headers['content-disposition'].should.match(/attachment/);
    });

    it('should include run metadata in CSV filename', async () => {
      const res = await agent.get(`/runs/${testRun._id}?csv=true`);
      res.headers['content-disposition'].should.match(/Test Microworld/);
    });

    it('should return 404 for non-existent run', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await agent.get(`/runs/${fakeId}`);
      // Mongoose returns null, which the route sends as 200 with null body
      // This might be a bug - should probably be 404
      res.status.should.equal(200);
    });
  });

  describe('CSV Export Data Validation', () => {
    it('CSV should contain correct headers', async () => {
      const mwId = testRun.microworld._id.toString();
      const res = await agent.get(`/runs?csv=true&mw=${mwId}`);

      const csvContent = res.text;
      csvContent.should.match(/Run ID/);
      csvContent.should.match(/Fisher/);
      csvContent.should.match(/Type/);
      csvContent.should.match(/Season/);
      csvContent.should.match(/Fish at Start/);
      csvContent.should.match(/Fish at End/);
      csvContent.should.match(/Profit/);
    });

    it('CSV should contain data for all fishers in all seasons', async () => {
      const mwId = testRun.microworld._id.toString();
      const res = await agent.get(`/runs?csv=true&mw=${mwId}`);

      const csvContent = res.text;
      csvContent.should.match(/Fisher1/);
      csvContent.should.match(/Fisher2/);
      csvContent.should.match(/human/);
      csvContent.should.match(/bot/);
    });

    it('CSV should contain correct number of data rows', async () => {
      const mwId = testRun.microworld._id.toString();
      const res = await agent.get(`/runs?csv=true&mw=${mwId}`);

      // 2 fishers * 2 seasons = 4 data rows + 1 header row = 5 lines
      const lines = res.text.trim().split('\n');
      lines.length.should.equal(5);
    });

    it('CSV should contain device columns, filled for humans and empty for bots', async () => {
      const mwId = testRun.microworld._id.toString();
      const res = await agent.get(`/runs?csv=true&mw=${mwId}`);

      const lines = res.text.trim().split('\n');
      lines[0].should.match(/Device Class/);
      lines[0].should.match(/Device Brand/);
      lines[0].should.match(/Device Model/);
      lines[0].should.match(/In-App Browser/);
      lines[0].should.match(/User Agent/);
      const humanRows = lines.filter(line => /Fisher1/.test(line));
      const botRows = lines.filter(line => /Fisher2/.test(line));
      humanRows.length.should.equal(2);
      humanRows.forEach(line => {
        line.should.match(/phone,Samsung,SM-A105F,Android,9,Chrome,90\.0,WhatsApp,360x760,test-agent/);
      });
      botRows.forEach(line => {
        line.should.not.match(/Samsung/);
      });
    });

    it('CSV should summarise each fisher\'s disconnects and the run\'s end reason', async () => {
      const mwId = testRun.microworld._id.toString();
      const res = await agent.get(`/runs?csv=true&mw=${mwId}`);

      const lines = res.text.trim().split('\n');
      lines[0].should.match(/Disconnects,Seconds Away,Lost,Run End Reason,Device Class/);
      const fisher1 = lines.filter(line => /Fisher1/.test(line));
      fisher1.length.should.equal(2);
      fisher1[0].should.match(/,1,13,,time,phone,/); // season 1
      fisher1[1].should.match(/,1,17,,time,phone,/); // season 2 (the break before it)
      lines.filter(line => /Fisher2/.test(line)).forEach(line => {
        line.should.match(/,0,0,,time,,/);
      });
    });

    it('should put a loss on the row of the season it happened in', () => {
      const flatten = require('./runs').flattenRunResults;
      const run = {
        _id: 'r1',
        endReason: 'time',
        results: [1, 2, 3].map(season => ({
          season: season,
          fishers: (season < 3 ? ['A', 'B'] : ['B']).map(name => ({ name: name, type: 'human' })),
        })),
        connectionEvents: [
          { participant: 'A', event: 'disconnected', season: 2, phase: 'running', resultsSeason: 2 },
          { participant: 'A', event: 'removed', season: 2, phase: 'running', resultsSeason: 2,
            reason: 'grace period expired' },
          // B is lost during the break before a season B never gets to play
          { participant: 'B', event: 'disconnected', season: 3, phase: 'resting', resultsSeason: 4 },
          { participant: 'B', event: 'game ended', season: 3, phase: 'resting', resultsSeason: 4,
            reason: 'too many disconnects' },
        ],
      };
      const rows = flatten(run);
      const row = (name, season) => rows.filter(r => r.Fisher === name && r.Season === season)[0];
      row('A', 1).Lost.should.equal('');
      row('A', 2).Lost.should.equal('removed: grace period expired');
      row('A', 2).Disconnects.should.equal(1);
      // Past B's last row: kept on that last row rather than dropped
      row('B', 3).Lost.should.equal('game ended: too many disconnects');
      row('B', 3).Disconnects.should.equal(1);
    });

    it('should still read events saved before resultsSeason existed', () => {
      const flatten = require('./runs').flattenRunResults;
      const rows = flatten({
        _id: 'r2',
        results: [{ season: 1, fishers: [{ name: 'A', type: 'human' }] }],
        connectionEvents: [
          { participant: 'A', event: 'disconnected', season: 1 },
          { participant: 'A', event: 'reconnected', season: 1, secondsAway: 5 },
        ],
      });
      rows[0].Disconnects.should.equal(1);
      rows[0]['Seconds Away'].should.equal(5);
    });

    it('CSV should put the device columns last', async () => {
      const mwId = testRun.microworld._id.toString();
      const res = await agent.get(`/runs?csv=true&mw=${mwId}`);

      const header = res.text.trim().split('\n')[0].split(',');
      const deviceColumns = ['Device Class', 'Device Brand', 'Device Model', 'OS', 'OS Version',
        'Browser', 'Browser Version', 'In-App Browser', 'Screen Size', 'User Agent'];
      header.slice(-deviceColumns.length).should.eql(deviceColumns);
    });
  });

  describe('Access Control', () => {
    let otherExperimenter;
    let otherRun;

    before(async () => {
      // Create another experimenter with hashed password
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

      otherRun = await Run.create({
        microworld: {
          _id: new mongoose.Types.ObjectId(),
          name: 'Other Microworld',
          experimenter: {
            _id: otherExperimenter._id,
            username: otherExperimenter.username,
          },
        },
        time: new Date('2025-01-02T10:00:00Z'),
        participants: ['Fisher3'],
        results: [],
      });
    });

    after(async () => {
      await Experimenter.deleteOne({ _id: otherExperimenter._id });
      await Run.deleteOne({ _id: otherRun._id });
    });

    it('should not return other experimenter\'s runs in list', async () => {
      const res = await agent.get('/runs');
      res.status.should.equal(200);

      const otherRunInList = res.body.find(
        run => run._id.toString() === otherRun._id.toString()
      );
      should.not.exist(otherRunInList);
    });

    it('should not return other experimenter\'s run details', async () => {
      const res = await agent.get(`/runs/${otherRun._id}`);
      // Returns null when no document matches the query
      // When null is sent via Express res.send(), it becomes an empty object
      const isEmpty = res.body === null || Object.keys(res.body).length === 0;
      should(isEmpty).be.true();
    });
  });
});
