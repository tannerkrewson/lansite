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

	if (data.isConsole){
		//data.line will be whatever is after the command in the console.
		//Example of command entered into console:
		//
		//	add MatchBox foobarbaz zavraboof
		//                  ^----------------->
	} else {
		//This is if the box was not added via console, for example
		//    if it was added from a request acceptance.
	}
}

MatchBox.id = "MatchBox";

MatchBox.prototype.addResponseListeners = function(socket, stream) {
	var self = this;
	socket.on(self.unique + '-test', function(msg) {

		//DO SOMETHING
		Dispatcher.sendUpdatedBoxToAll(self, stream.users);
	});
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
	this.matches.push(new Match(game, host, min, max));
}

MatchBox.addRequestListeners = function(socket, stream) {}



function Match(game, host, min, max){
	this.unique = crypto.randomBytes(20).toString('hex');

	this.game = game;
	this.host = host;
	this.min = min;
	this.max = max;
	this.users = [];
}


module.exports = MatchBox;