'use strict';
/*global beforeEach:true, afterEach:true*/

process.env.NODE_ENV = 'test';

var mongoose = require('mongoose');

var config = require('../config');


beforeEach(function (done) {
    function clearDB() {
        var total = Object.keys(mongoose.connection.collections).length;
        if (total === 0) return done();

        var count = 0;
        for (var i in mongoose.connection.collections) {
            mongoose.connection.collections[i].remove(function (err) {
                if (err) throw err;

                count += 1;
                if (count >= total) return done();
            });
        }
    }

    function reconnect() {
        mongoose.connect(config.db.test, function (err) {
            if (err) throw err;
            return clearDB();
        });
    }

    function checkState() {
        switch (mongoose.connection.readyState) {
            case 0:
                reconnect();
                break;
            case 1:
                clearDB();
                break;
            default:
                global.setImmediate(checkState);
        }
    }

    checkState();
});

afterEach(function (done) {
    mongoose.disconnect();
    return done();
});
