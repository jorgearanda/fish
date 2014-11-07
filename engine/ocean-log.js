'use strict';

var log = require('winston');

exports.OceanLog = function OceanLog(oceanName) {
    this.oceanName = oceanName;
    this.entries = [];

    this.debug = function (msg) {
        log.debug('Ocean ' + this.oceanName + ': ' + msg);
    };

    this.info = function (msg) {
        this.saveEntry(msg);
        log.info('Ocean ' + this.oceanName + ': ' + msg);
    };

    this.warn = function (msg) {
        this.saveEntry(msg);
        log.warn('Ocean ' + this.oceanName + ': ' + msg);
    };

    this.error = function (msg) {
        this.saveEntry(msg);
        log.error('Ocean ' + this.oceanName + ': ' + msg);
    };

    this.saveEntry = function (msg) {
        this.entries.push({
            time: new Date(),
            entry: msg
        });
    };
};
