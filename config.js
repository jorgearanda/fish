var mongo = process.env.MONGO_HOST || 'localhost';

module.exports = {
    db: {
        development: 'mongodb://' + mongo + '/fish',
        production: 'mongodb://' + mongo + '/fish',
        test: 'mongodb://' + mongo + '/fish-test'
    }
};
