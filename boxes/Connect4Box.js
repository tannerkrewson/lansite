//
//  Lansite Server Connect4Box
//  By Tanner Krewson
//

var crypto = require('crypto');

var Box = require('./shared/Box');
var Dispatcher = require('./shared/Dispatcher');

var Config = require('../config.js');


Connect4Box.prototype = Object.create(Box.prototype);

function Connect4Box(data) {
	Box.call(this);
	this.id = Connect4Box.id;
	this.url = Config.connectFourUrl;

	this.matches = [];
}

Connect4Box.id = "Connect4Box";

Connect4Box.prototype.addResponseListeners = function(socket, stream) {
	//Runs the parent addResponseListeners function
	Box.prototype.addResponseListeners.call(this, socket, stream);

	var self = this;

	//sent when a client click the I'll play button of another player's match
	this.addEventListener('accept', socket, stream, function(user, data){
		var match = self.getMatchByUnique(data.matchUnique);

		//if the match exists
		if (match !== null){
			//remove the match, because connect4 is only 2 players
			self.removeMatch(match);
		}
		Dispatcher.sendUpdatedBoxToAll(self, stream.users);
	});

	//sent when the client who made a match clicks the cancel button
	this.addEventListener('cancel', socket, stream, function(user, data) {
		var match = self.getMatchByUnique(data.matchUnique);

		//if the match exists and the user is the host
		if (match !== null && parseInt(user.id) === match.host.id){
			//delete the whole match
			self.removeMatch(match);
			Dispatcher.sendUpdatedBoxToAll(self, stream.users);
		}
	});

	//sent when a client clicks the Start a new Game button
	this.addEventListener('newmatch', socket, stream, function(user, data) {
		var c4id = data.c4id;

		self.addMatch(c4id, user.toStrippedJson());
		Dispatcher.sendUpdatedBoxToAll(self, stream.users)
	});
}

Connect4Box.prototype.addMatch = function(c4id, host){
	//if the user is not already looking for an opponent
	if (!this.userHasMatchOpen(host)){
		this.matches.push(new Match(c4id, host));
	} else {
		//console.log('Failed to add C4 match, most likely a duplicate');
	}
}

Connect4Box.prototype.removeMatch = function(match){
	var index = this.matches.indexOf(match);
	if (index > -1) {
    	this.matches.splice(index, 1);
	} else {
		console.log('Remove C4 match failed');
	}
}

Connect4Box.prototype.getMatchByUnique = function(matchUnique) {
	for (var i = this.matches.length - 1; i >= 0; i--) {
		if (this.matches[i].unique === matchUnique){
			return this.matches[i];
		}
	};
	return null;
}

Connect4Box.prototype.userHasMatchOpen = function(user) {
	for (var i = this.matches.length - 1; i >= 0; i--) {
		if (this.matches[i].host.id === user.id){
			return true;
		}
	};
	return false;
}

Connect4Box.addRequestListeners = function(socket, stream) {}



function Match(c4id, host){
	this.unique = crypto.randomBytes(20).toString('hex');
	this.c4id = c4id;
	this.host = host;
}


module.exports = Connect4Box;
