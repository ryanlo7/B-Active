
var routerProperties = function(req, res, next) {
	return {
		req: req, 
		res: res,
		next: next
	};
}

var updateUser = function(properties, email, updateSet) {
	let req = properties.req;
	let res = properties.res;
	let next = properties.next;

	let db = req.app.locals.db;
	const userCollection = db.collection("Users");

	userCollection.findOne({"email": email}, function(err, resultUser) {
		if (err) {
			next(err);
			return;
		}
		if (result.length === 0) {
			res.status(404).send(`Unable to find user with email`);
			return;
		}
		userCollection.updateOne({"email": email}, updateSet, function(err, updateResult) {
			if (err) {
				next(err);
				return;
			}
			res.status(201).send(`Successfully updated user data`);
			return;
		});
	});
}

var insertUser = function(properties, email, password) {
	let req = properties.req;
	let res = properties.res;
	let next = properties.next;

	let db = req.app.locals.db;
	const userCollection = db.collection("Users");
	const valuesCollection = db.collection("Values");
	
	userCollection.find({"email": email}).toArray(
		function(err, result) {
			if (err) {
				next(err);
				return;
			}
			if (result.length !== 0) {
				res.status(404).send(`Email already in use`);
				return;
			}

			valuesCollection.find({"name": "Users"}).toArray(function(err, resId) {
				if (err) {
					next(err);
					return;
				}
				let maxUserId = resId[0].maxUserId;

				let defaultAvailability = [];
				for (let i = 0; i < 7; i++) {
					let week = [];
					for (let j = 0; j < 48; j++) {
						week.push(false);
					}
					defaultAvailability.push(week);
				}

				let newUser = {
					userId: maxUserId,
					email: email,
					password: password,
					availability: defaultAvailability,
					activities: [],
					events: []
				};
				userCollection.insertOne(newUser, function (err, insertResult) {
					if (err) {
						next(err);
						return;
					}
					let newValue = {$set: {"maxUserId": maxUserId + 1}}; // this is buggy
					valuesCollection.updateOne({"name": "Users"}, newValue, function(err, updateResult) {
						if (err) {
							next(err);
							return;
						}
						res.status(201).render('profile', {
							userId: newUser.userId,
							email: newUser.email,
							activities: newUser.activities,
							availability: newUser.availability,
							events: newUser.events
						});
						return;
					});
				});
			});
			return;
		}
	);
}

module.exports = {
	insertUser: insertUser,
	updateUser: updateUser,
	routerProperties: routerProperties
};