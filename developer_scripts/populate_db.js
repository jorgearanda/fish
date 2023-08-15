db = db.getSiblingDB('fish');
db.experimenters.insertOne( 
	{ 
		"email" : "test@example.com", 
		"name" : "The Admin", 
		"passwordHash" : "$2a$12$I5X7O/wRBX3OtKuy47OHz.0mJBLMN8NmQCRDpY84/5tGN02.zwOFG", 
		"username" : "admin"
	}
);