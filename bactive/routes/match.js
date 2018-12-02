var express = require('express');
var database = require('./database');
var router = express.Router();
var verify = require('./verify');


/* GET users listing. */
router.get('/:userid', function(req, res, next) {
  // res.send('This is the match page. Main algorithm for users match with other users of similar interests here');

    var db = req.app.locals.db; //get instance of db
	var userId = parseInt(req.params.userid);

	db.collection('Users')
			.find({'userId': userId})
			.toArray(function(err, results) {
				if (results.length == 0) {
					res.status(404).send("404: hi userId not found");
				} else {
					user = results[0]; // should only be one match

					if (!verify.checkLogin(req.cookies.jwt, user.email)) {
						res.status(401).redirect('/login');
						return;
					}

					var matchedResults = [];
					matchUsers(req, res, next, userId, matchedResults);
				}
			});

  //matchUsers(req, res, next, userId);

  // res.send('alg done');
});

// router.post('/', function(req, res, next) {
// 	// var userId = parseInt(req.params.userid);
// 	// matchUsers(req, res, next, userId);
// });

const MAX_AVAILABILITY_SCORE = 6;
const MAX_INTEREST_SCORE = 7.5;
const MAX_SKILL_SCORE = 5;
const NORMALIZED_BASE = 10.0;
const DAYS = 7;
const TIME_SLOTS = 48;


/**
	* Key function to generate matches for a single user, given the user id.
	* @param {Object} req The express routing HTTP client request object.
	* @param {Object} res The express routing HTTP client response object.
	* @param {callback} next The express routing callback function to invoke next middleware in the stack.
	* @param {number} userId An integer that represents a user id.
	* @return {!Array} A sorted array of matching users, from highest score match
	* to lowest score match.
*/
function matchUsers(req, res, next, userId, matches) {
	// Add in code to get data from database.
	// Pass in objects of data for two users into match user function to get score match.
	// Keep mapping of each user to score match (i.e. dictionary). Make sure that
	// match is not attmepted for user with himself/herself.
	// var results = [];
	let performMatch = function(curr_user, matchResults) {
		currUser = curr_user[0];
		database.searchUsers(database.routerProperties(req, res, next), {"userId": {$ne: userId}}, matchResults, function(users, matchResultsArray) {
			for (let i = 0; i < users.length; i ++) {
				let potentialMatchUser = users[i];
				matchResultsArray.push(matchUser(currUser, potentialMatchUser));
				console.log(matchResultsArray.length)
				// do something with result - or not, just keep appending to results and return
			}
			res.render('match', {
					 	userId: userId,
						matches: matchResultsArray,
					});
		});
	};
	database.searchUsers(database.routerProperties(req, res, next), {"userId": userId}, matches, performMatch);
}

/**
	* Compute a match score for two users.
	* @param {Object} curr_user An object containing the user profile information for the logged
	* in user.
	* @param {Object} potential_match An object containing the user profile information for the the
	* match candidate for the logged in user.
	* @return {Array} An array of a matched activity and the match score.
	* A score representing how good the match is between the logged in user and the potential match. 
	* This match is based on availability, interest level, and skill level.
*/
function matchUser(curr_user, potential_match) {
	var availability_match_score = getAvailabilityMatchScore(curr_user["availability"], potential_match["availability"]);
	var activity_match = getBestActivityMatch(curr_user["activities"], potential_match["activities"]);
	var total_score = 0;

	if (activity_match["interest_score"] != 0 && availability_match_score != 0) {
		total_score = activity_match["interest_score"] + activity_match["skill_score"] + availability_match_score;
	}
	return [activity_match["name"], total_score];
}


/**
	* Returns a score for the availability match between two users. 
	* This is done by computing the largest overlapping block of time between the two users.
	* This score is capped at a maximum defined by a constant MAX_AVAILABILITY_SCORE. 
	* @param {Array<Array<<boolean>>} curr_user_availability A list of true/false availabilities
	* for the current user for each thirty-minute time slot on each day of the week.
	* @param {Array<Array<<boolean>>} potential_match_availability A list of true/false availabilities
	* for the potentialMatch for each thirty-minute time slot on each day of the week.
	* @return {number} A score representing how good the time availability match is, where 0 represents
	* a failed match and MAX_AVAILABILITY_SCORE is the highest possible match score for this category.
*/

function getAvailabilityMatchScore(curr_user_availability, potential_match_availability) {
	var num_overlapping_periods = getAvailabilityMatch(curr_user_availability, potential_match_availability);

	// Thirty minutes is two short for an activity, so a match requires at least an hour of matched times.
	// Furthermore, activity matches are not expected to have an activity for over three hours, 
	// so a maximum cutoff is set for highest possible match.
	if (num_overlapping_periods <= 1) {
		num_overlapping_periods = 0;
	} else if (num_overlapping_periods > MAX_AVAILABILITY_SCORE) {
		num_overlapping_periods = MAX_AVAILABILITY_SCORE;
	}
	return computeNormalizedScore(num_overlapping_periods, MAX_AVAILABILITY_SCORE);
}


/**
	* Returns maximum number of consecutive overlapping half-hours for two users. This could
	* span over multiple days of the week, as long as it is a consecutive chunk of hours (i.e.
	* 11:00 PM on Monday until 1 AM on Tuesday).
	* @param {Array<Array<<boolean>>} curr_user_availability A list of true/false availabilities
	* for the current user for each thirty-minute time slot on each day of the week.
	* @param {Array<Array<<boolean>>} potential_match_availability A list of true/false availabilities
	* for the potentialMatch for each thirty-minute time slot on each day of the week.
	* @return {number} The maximum number of overlapping consecutive half-hours between the two users.
*/
function getAvailabilityMatch(curr_user_availability, potential_match_availability) {
	var max_sequence = 0;
	var curr_sequence = 0;

	for (var i = 0; i < curr_user_availability.length; i++) {
		for (var j = 0; j < curr_user_availability[i].length; j++) {
			if (curr_user_availability[i][j] && potential_match_availability[i][j]) {
				curr_sequence++;
				if (curr_sequence > max_sequence) {
					max_sequence = curr_sequence;
				}
			}
		 	else {
				curr_sequence = 0;
			}
		}
	}

	return max_sequence;
}

/**
	* Returns an object containing the best activity match between two users and the
	* interest and skill level scores for that activity.
	* @param {Array<Object>} curr_user_activities A list of activities for the current user with
	* interest and skill level scores.
	* @param {Array<Object>} potential_match_activities A list of activities for the potential
	* match user with interest and skill level scores.
	* @return {Object} The matched activity yielding the highest score for the current user.
	* The object contains a field for the activity name, a field for the interest match score, and
	* a field for the skill match score.
*/
function getBestActivityMatch(curr_user_activities, potential_match_activities) {
	return getBestActivityMatchFromList(generateActivityMatches(curr_user_activities, potential_match_activities));
}

/**
	* Generates a list of activity matches with an interest match and a skill match for each activity.
	* @param {Array<Object>} curr_user_activities A list of activities for the current user with
	* interest and skill level scores.
	* @param {Array<Object>} potential_match_activities A list of activities for the potential
	* match user with interest and skill level scores.
	* @return {Array<Object>} List of objects with the potential match activities. Each object has
	* the name of the potential match activity, a skill score, and an interest score.
*/
function generateActivityMatches(curr_user_activities, potential_match_activities) {
	var activity_matches = [];

	// Create a list with all activities with match score temporarily as 0.
	for (var i = 0; i < curr_user_activities.length; i++) {
		var activity_match = {};
		activity_match["name"] = curr_user_activities[i]["name"];
		activity_match["skill_score"] = 0;
		activity_match["interest_score"] = 0;
		activity_matches.push(activity_match);
	}

	// Fill array of matched activities.
	for (var i = 0; i < curr_user_activities.length; i++) {
		for (var j = 0; j < potential_match_activities.length; j++) {
			if (curr_user_activities[i]["name"] !== potential_match_activities[j]["name"]) {
				continue;
			}
			activity_matches[i]["skill_score"] = computeSkillMatch(curr_user_activities[i]["skill"], potential_match_activities[j]["skill"]);
			activity_matches[i]["interest_score"] = computeInterestMatch(curr_user_activities[i]["interest"], potential_match_activities[j]["interest"]);
		}
	}
	return activity_matches;
}

/**
	* Returns an object containing the best activity match between two users and the
	* interest and skill level scores for that activity, given a list of activities and scores.
	* The best match is defined as having the highest skill score and interest score combined, 
	* disregarding activities with an interest match of 0.
	* @param {Array<Object>} activity_matches Current activity matches with name, skill score, and interest
	* score for each activity.
	* @return {Object} The matched activity yielding the highest score for the current user.
	* The object contains a field for the activity name, a field for the interest match score, and
	* a field for the skill match score.
*/
function getBestActivityMatchFromList(activity_matches) {
	var best_activity_match = {};
	// Default initialization so that keys are present in the object. When using the score in other functions,
	// handle exceptional case of having 0 interest match score (meaning no match).
	best_activity_match["name"] = "lifting";
	best_activity_match["skill_score"] = 0;
	best_activity_match["interest_score"] = 0;
	var max_score = 0;

	for (var i = 0; i < activity_matches.length; i++) {
		if (activity_matches[i]["interest_score"] == 0) {
			continue;
		} else {
			var curr_score = activity_matches[i]["interest_score"] + activity_matches[i]["skill_score"];
			if (curr_score > max_score) {
				max_score = curr_score;
				best_activity_match["name"] = activity_matches[i]["name"];
				best_activity_match["skill_score"] = activity_matches[i]["skill_score"];
				best_activity_match["interest_score"] = activity_matches[i]["interest_score"];
			}
		}
	}
	return best_activity_match;
}

/**
	* Returns a score for interest match. The computation most highly weights the current
	* user's interests, and then weights the other user's interest level with secondary importance.
	* Note that an interest level of 1 is the lowest possible interest for an activity, so this
	* automatically results in a score of 0 for the interest match.
	* @param {number} curr_user_interest Interest level for current user
	* @param {number} potential_match_interest Interest level for other user
	* @return {number} A normalized score representing the interest match between two users.
*/
function computeInterestMatch(curr_user_interest, potential_match_interest) {
	var unnormalized_score = curr_user_interest + 0.5*(potential_match_interest);
	if (curr_user_interest == 1 || potential_match_interest == 1) {
		unnormalized_score = 0;
	}
	return computeNormalizedScore(unnormalized_score, MAX_INTEREST_SCORE);
}

/**
	* Returns a score for skill match. The score is high if the two users have similar skill levels.
	* @param {number} curr_user_skill Skill level of current user
	* @param {number} potential_match_skill Skill level of potential match
	* @return {number} A normalized score representing the skill level match between two users.
*/
function computeSkillMatch(curr_user_skill, potential_match_skill) {
	var unnormalized_score = MAX_SKILL_SCORE - Math.abs(curr_user_skill-potential_match_skill)
	return computeNormalizedScore(unnormalized_score, MAX_SKILL_SCORE);
}

/**
	* Normalizes the score for the three categories, so all three types of scores
	* have the same maximum and minimum values.
	* @param {number} curr_score Current score for that category
	* @param {number} curr_max Maximum score for that cateogry
	* @return {number} A normalized score representing the match score between two users for one category.
*/
function computeNormalizedScore(curr_score, curr_max) {
	return curr_score*1.0/curr_max*NORMALIZED_BASE;
}

module.exports = router;

//UNCOMMENT BELOW FOR MATCHING FUNCTION TESTING PURPOSES (and comment out above 'module.exports = router')
// module.exports = {
// 	MAX_AVAILABILITY_SCORE:MAX_AVAILABILITY_SCORE,
// 	MAX_INTEREST_SCORE:MAX_INTEREST_SCORE,
// 	MAX_SKILL_SCORE:MAX_SKILL_SCORE,
//  	NORMALIZED_BASE:NORMALIZED_BASE,
// 	DAYS:DAYS,
// 	TIME_SLOTS:TIME_SLOTS,
// 	matchUsers:matchUsers,
// 	matchUser:matchUser,
// 	getAvailabilityMatchScore:getAvailabilityMatchScore,
// 	getAvailabilityMatch:getAvailabilityMatch,
// 	getBestActivityMatch:getBestActivityMatch,
// 	router
// };