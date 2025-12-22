const should = require('should');
const access = require('./access');

describe('Middlewares - Access Control', () => {
  let req, res, next;

  beforeEach(() => {
    req = { session: {}, params: {} };
    res = {
      sendStatus: function(code) {
        this.statusCode = code;
        return this;
      },
      redirect: function(path) {
        this.redirectPath = path;
        return this;
      },
      statusCode: null,
      redirectPath: null,
    };
    next = function() {
      next.called = true;
    };
    next.called = false;
  });

  describe('allowUsers', () => {
    it('should call next() when user is logged in', () => {
      req.session.userId = 'user123';
      access.allowUsers(req, res, next);
      next.called.should.equal(true);
    });

    it('should return 401 when session is missing', () => {
      req.session = null;
      access.allowUsers(req, res, next);
      res.statusCode.should.equal(401);
      next.called.should.equal(false);
    });

    it('should return 401 when userId is missing', () => {
      req.session = {};
      access.allowUsers(req, res, next);
      res.statusCode.should.equal(401);
      next.called.should.equal(false);
    });

    it('should return 401 when session is undefined', () => {
      req.session = undefined;
      access.allowUsers(req, res, next);
      res.statusCode.should.equal(401);
      next.called.should.equal(false);
    });
  });

  describe('allowOnlySuperusers', () => {
    it('should call next() when user is a superuser', () => {
      req.session.superuser = true;
      access.allowOnlySuperusers(req, res, next);
      next.called.should.equal(true);
    });

    it('should return 401 when user is not a superuser', () => {
      req.session.userId = 'user123';
      req.session.superuser = false;
      access.allowOnlySuperusers(req, res, next);
      res.statusCode.should.equal(401);
      next.called.should.equal(false);
    });

    it('should return 401 when session is missing', () => {
      req.session = null;
      access.allowOnlySuperusers(req, res, next);
      res.statusCode.should.equal(401);
      next.called.should.equal(false);
    });

    it('should return 401 when superuser flag is missing', () => {
      req.session.userId = 'user123';
      access.allowOnlySuperusers(req, res, next);
      res.statusCode.should.equal(401);
      next.called.should.equal(false);
    });
  });

  describe('allowSelfAndSuperusers', () => {
    it('should call next() when user is a superuser', () => {
      req.session.superuser = true;
      req.session.userId = 'user123';
      req.params.id = 'user456';
      access.allowSelfAndSuperusers(req, res, next);
      next.called.should.equal(true);
    });

    it('should call next() when user is accessing their own resource', () => {
      req.session.userId = 'user123';
      req.params.id = 'user123';
      access.allowSelfAndSuperusers(req, res, next);
      next.called.should.equal(true);
    });

    it('should return 401 when user is accessing another user\'s resource', () => {
      req.session.userId = 'user123';
      req.params.id = 'user456';
      access.allowSelfAndSuperusers(req, res, next);
      res.statusCode.should.equal(401);
      next.called.should.equal(false);
    });

    it('should return 401 when session is missing', () => {
      req.session = null;
      req.params.id = 'user123';
      access.allowSelfAndSuperusers(req, res, next);
      res.statusCode.should.equal(401);
      next.called.should.equal(false);
    });

    it('should return 401 when userId is missing', () => {
      req.session = {};
      req.params.id = 'user123';
      access.allowSelfAndSuperusers(req, res, next);
      res.statusCode.should.equal(401);
      next.called.should.equal(false);
    });
  });

  describe('isUserSameAsParamsId', () => {
    it('should call next() when userId matches accountId param', () => {
      req.session.userId = 'user123';
      req.params.accountId = 'user123';
      access.isUserSameAsParamsId(req, res, next);
      next.called.should.equal(true);
    });

    it('should redirect to /admin when userId does not match accountId', () => {
      req.session.userId = 'user123';
      req.params.accountId = 'user456';
      access.isUserSameAsParamsId(req, res, next);
      res.redirectPath.should.equal('/admin');
      next.called.should.equal(false);
    });

    it('should redirect to /admin when session is missing', () => {
      req.session = null;
      req.params.accountId = 'user123';
      access.isUserSameAsParamsId(req, res, next);
      res.redirectPath.should.equal('/admin');
      next.called.should.equal(false);
    });

    it('should redirect to /admin when userId is missing', () => {
      req.session = {};
      req.params.accountId = 'user123';
      access.isUserSameAsParamsId(req, res, next);
      res.redirectPath.should.equal('/admin');
      next.called.should.equal(false);
    });

    it('should redirect to /admin when session is undefined', () => {
      req.session = undefined;
      req.params.accountId = 'user123';
      access.isUserSameAsParamsId(req, res, next);
      res.redirectPath.should.equal('/admin');
      next.called.should.equal(false);
    });
  });
});
