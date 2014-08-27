'use strict';

var log = require('winston');

exports.OceanLog = function OceanLog(oceanName) {
    this.oceanName = oceanName;
    this.entries = [];

    this.debug = function (msg) {
        log.debug('Ocean ' + this.oceanName + ': ' + msg);
    };

    this.info = function (msg) {
        var tsText = new Date().toString();
        this.entries.push(tsText + ': ' + msg);
        log.info('Ocean ' + this.oceanName + ': ' + msg);
    };

    this.warn = function (msg) {
        var tsText = new Date().toString();
        this.entries.push(tsText + ': ' + msg);
        log.warn('Ocean ' + this.oceanName + ': ' + msg);
    };

    this.error = function (msg) {
        var tsText = new Date().toString();
        this.entries.push(tsText + ': ' + msg);
        log.error('Ocean ' + this.oceanName + ': ' + msg);
    };
};
