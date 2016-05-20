//
//  Lansite Server MatchBox
//  By Tanner Krewson
//

var crypto = require('crypto');

var Box = require('./shared/Box');
var Dispatcher = require('./shared/Dispatcher');


MatchBox.prototype = Object.create(Box.prototype);

function MatchBox(data) {
	Box.call(this);
	this.id = MatchBox.id;

	this.matches = [];
}

MatchBox.id = "MatchBox";

MatchBox.prototype.addResponseListeners = function(socket, stream) {
	//Runs the parent addResponseListeners function
	Box.prototype.addResponseListeners.call(this, socket, stream);
	
	var self = this;
	socket.on(self.unique + '-accept', function(msg){
		//check if the user is logged in
		var user = stream.users.checkIfUserExists(msg.unique);
		if (user) {
			//recreate user object to prevent maximum call stack size error
			//TODO: Find a more elegant solution
			var jsonUser = {
				unique: user.unique,
				id: user.id,
				displayName: user.displayName,
				realName: user.realName,
				isOp: user.isOp
			}
			var match = self.getMatchByUnique(msg.data.matchUnique);

			//if the user is already in the match, this will not be null
			var checkUser = match.checkIfUserInMatch(jsonUser.unique);

			//if the match exists and the user was not found in the match
			if (match !== null && checkUser === null){
				//add them to this match
				match.addUser(jsonUser);
			}
			Dispatcher.sendUpdatedBoxToAll(self, stream.users);
		} else {
			console.log("I'll play failed");
		}
	})
	socket.on(self.unique + '-cancel', function(msg){
		//check if the user is logged in
		var user = stream.users.checkIfUserExists(msg.unique);
		if (user) {
			var match = self.getMatchByUnique(msg.data.matchUnique);

			//if the user is already in the match, this will not be null
			var userToRemove = match.checkIfUserInMatch(user.unique);

			//if the match exists and the user was found in the match
			if (match !== null && userToRemove !== null){
				//check to see if the host is droping out
				if (userToRemove.unique === match.host.unique){
					//delete the whole match
					self.removeMatch(match);
				} else {
					//remove them from this match
					match.removeUser(userToRemove);
				}
			}
			Dispatcher.sendUpdatedBoxToAll(self, stream.users);
		} else {
			console.log("Dropout failed");
		}
	})
	socket.on(self.unique + '-request-newmatch', function(msg){
		console.log('Request received');
		//check if the user is logged in
		var user = stream.users.checkIfUserExists(msg.unique);
		if (user) {
			//recreate user object to prevent maximum call stack size error
			//TODO: Find a more elegant solution
			var jsonUser = {
				unique: user.unique,
				id: user.id,
				displayName: user.displayName,
				realName: user.realName,
				isOp: user.isOp
			}
	        var game = msg.data.game;
	        var min = msg.data.min;
	        var max = msg.data.max;
			stream.requestManager.addRequest(jsonUser, 'wants to find players for ' + game, function(){
				self.addMatch(game, jsonUser, min, max);
				Dispatcher.sendUpdatedBoxToAll(self, stream.users);
				console.log('Request accepted');
			}, function() {
				//TODO: Notify user their request has been denied, maybe
			});
		} else {
			console.log('Add request failed');
		}
	})
}

MatchBox.prototype.addMatch = function(game, host, min, max){
	//javascript sucks
	min = parseInt(min);
	max = parseInt(max);

	//can't be negative
	var limitsInBounds = (min > 1 && max >=0);
	//max can't be less than the minimum
	var validLimit = (min <= max);
	//UNLESS the max is zero (which means there is no limit)
	if (max == 0) {
		validLimit = true;
	}

	if (limitsInBounds && validLimit){
		this.matches.push(new Match(game, host, min, max));
	} else {
		console.log('Failed to add match');
	}
}

MatchBox.prototype.removeMatch = function(match){
	var index = this.matches.indexOf(match);
	if (index > -1) {
    	this.matches.splice(index, 1);
	} else {
		console.log('Remove match failed');
	}
}

MatchBox.prototype.getMatchByUnique = function(matchUnique) {
	for (var i = this.matches.length - 1; i >= 0; i--) {
		if (this.matches[i].unique === matchUnique){
			return this.matches[i];
		}
	};
	return null;
}

MatchBox.addRequestListeners = function(socket, stream) {}



function Match(game, host, min, max){
	this.unique = crypto.randomBytes(20).toString('hex');

	this.game = game;
	this.host = host;
	this.min = parseInt(min);
	this.max = parseInt(max);
	this.users = [];

	//automatically add host to the list of users
	this.users.push(this.host);
}

Match.prototype.checkIfUserInMatch = function(userUnique) {
    for (var i = this.users.length - 1; i >= 0; i--) {
        if (this.users[i].unique === userUnique) {
            return this.users[i];
        }
    };
    return null;
}

Match.prototype.addUser = function(userToAdd){
	//if the user is already in the match, this will not be null
	var user = this.checkIfUserInMatch(userToAdd.unique);

	//check if the match is full (if there is a max)
	var notFull = true;
	if (this.max !== 0) {
		notFull = this.users.length < this.max;
	}

	if (user === null && notFull){
		this.users.push(userToAdd);
	}
}

Match.prototype.removeUser = function(userToRemove){
	//if the user is already in the match, this will not be null
	var user = this.checkIfUserInMatch(userToRemove.unique);

	//if the user exists in this match
	if (user !== null){
		//remove them
		var index = this.users.indexOf(userToRemove);
		if (index > -1) {
   			this.users.splice(index, 1);
		} else {
			console.log('Remove user failed');
		}
	} else {
		console.log('Remove user failed');
	}
}


module.exports = MatchBox;