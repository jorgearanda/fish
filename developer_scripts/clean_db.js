db = db.getSiblingDB('fish');
db.getCollection('experimenters').remove();
db.getCollection('microworlds').remove();
db.getCollection('sessions').remove();