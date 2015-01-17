'use strict';
/*global describe:true, it:true*/

var should = require('should');

var testUtils = require('../test-utils');
var OceanLog = require('../../engine/ocean-log').OceanLog;


describe('Engine - Ocean Log', function () {
    it('should initialize', function (done) {
        var ol = new OceanLog('TestOcean');
        ol.oceanName.should.equal('TestOcean');
        ol.entries.length.should.equal(0);
        return done();
    });

    it('should record entries on info, warn, and error', function (done) {
        var ol = new OceanLog('TestOcean');
        ol.info('info');
        ol.warn('warn');
        ol.error('error');
        ol.entries.length.should.equal(3);
        return done();
    });
});