db = db.getSiblingDB('fish');
db.getCollection('experimenters').deleteMany({});
db.getCollection('microworlds').deleteMany({});
db.getCollection('sessions').deleteMany({});