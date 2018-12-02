use bActiveServer

db.Users.drop()
db.Activities.drop()
db.Values.drop()

db.createCollection("Users")
db.createCollection("Activities")
db.createCollection("Values")

db.Values.insert({"name": "Users", "maxUserId": 2})

db.Users.insert({ 	
					"userId": 0,
					"email": "user1@ucla.edu", 
					"password": "$2a$10$2DGJ96C77f/WwIwClPwSNuQRqjoSnDFj9GDKjg6X/PePgFdXoE4W6",
					"rating": { "scoreSum": 100, "numRatings": 25},
					"activities": [
						{"name": "basketball", "interest": 5, "skill": 5},
						{"name": "lifting", "interest": 4, "skill": 3}
					],
					"availability": [
						[true, true, true, true, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false], 
						[false, false, false, false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false],
						[false, false, false, false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, true, true,true, false, false,false, false, false],
						[false, false, false, false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false],
						[false, false, false, false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false],
						[false, false, false, false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false],
						[false, false, false, false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false]
					],
					"events": [
						{
							"eventId": 0,
							"userIds": [1], 
							"activity": "lifting", 
							"day": "monday",
							"startTime": 1518669344517, 
							"endTime": 1518670344517,
							"status": "matched",
							"location": "bfit"
						}
					]
})
db.Users.insert({ 	
					"userId": 1,
					"email": "user2@ucla.edu", 
					"password": "$2a$10$2DGJ96C77f/WwIwClPwSNuQRqjoSnDFj9GDKjg6X/PePgFdXoE4W6",
					"rating": { "scoreSum": 120, "numRatings": 25},
					"activities": [
						{"name": "basketball", "interest": 5, "skill": 5},
						{"name": "lifting", "interest": 4, "skill": 3}
					],
					"availability": [
						[true, true, true, true, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false], 
						[false, false, false, false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false],
						[false, false, false, false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, true, true,true, false, false,false, false, false],
						[false, false, false, false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false],
						[false, false, false, false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false],
						[false, false, false, false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false],
						[false, false, false, false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false,false, false, false]
					],
					"events": [
						{
							"eventId": 1,
							"userIds": [0], 
							"activity": "lifting", 
							"startTime": 1518669344517, 
							"endTime": 1518670344517,
							"status": "matched",
							"location": "bfit"
						}
					]
})

db.Users.find({})