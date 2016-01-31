//
//  Lansite Server VoteBox
//  By Tanner Krewson
//

var crypto = require('crypto');

var Box = require('./shared/Box');
var Dispatcher = require('./shared/Dispatcher');

VoteBox.prototype = Object.create(Box.prototype);

function VoteBox(data) {
	Box.call(this);
	this.id = VoteBox.id;
	
	this.choices = [];

	if (data.isConsole){
		this.addChoices(data.line.split(';'));
	} else {
		this.addChoices(data.choices);
	}
}

VoteBox.id = "VoteBox";


VoteBox.addRequestListeners = function(socket, stream) {
	socket.on('request-vote', function(msg){
		console.log('Request received');
		//check if the user is logged in
		var user = stream.users.checkIfUserExists(msg.unique);
		if (user) {
			stream.requestManager.addRequest(user, 'wants to start a vote', function(){
				var boxUnique = stream.addBoxById('VoteBox', msg.data);
				stream.sendBox(boxUnique);
				console.log('Request accepted');
			}, function() {
				//TODO: Notify user their request has been denied, maybe
			});
			//Dispatcher.sendUpdatedBoxToAll(self, stream.users);
		} else {
			console.log('Add request failed');
		}
	})
}

VoteBox.prototype.addResponseListeners = function(socket, stream) {
	var self = this;
	socket.on(self.unique + '-vote', function(msg) {
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
			var indexOfChoice = self.getIndexOfChoiceByUnique(msg.data.unique);
			//if the choice exists
			if (indexOfChoice !== -1) {
				self.choices[indexOfChoice].toggleVote(jsonUser);
				//sort the array for the client
				self.sortByVotes();
			}
			Dispatcher.sendUpdatedBoxToAll(self, stream.users);
		} else {
			console.log('Vote failed');
		}
	});
	socket.on(self.unique + '-request-voteaddchoice', function(msg){
		console.log('Request received');
		//check if the user is logged in
		var user = stream.users.checkIfUserExists(msg.unique);
		if (user) {
			var choiceName = msg.data.choiceName;
			stream.requestManager.addRequest(user, 'wants to add ' + choiceName + ' to the vote', function(){
				self.addChoice(msg.data.choiceName);
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

VoteBox.prototype.addChoices = function(choicesArray){
	for (var i = 0; i <= choicesArray.length - 1; i++) {
		this.addChoice(choicesArray[i]);
	};
}

VoteBox.prototype.addChoice = function(choiceName){
	this.choices.push(new VoteBoxChoice(choiceName));
}

VoteBox.prototype.getIndexOfChoiceByUnique = function(unique) {
	for (var i = this.choices.length - 1; i >= 0; i--) {
		if (this.choices[i].unique === unique) {
			return i;
		}
	}
	return -1;
}

VoteBox.prototype.sortByVotes = function() {
	//most to least
    this.choices.sort(function(a,b) {
        if (a.votes > b.votes){
        	return -1;
        } else if (a.votes < b.votes) {
        	return 1;
        } else {
        	return 0;
        }
    });
}



function VoteBoxChoice(choiceName) {
	this.unique = crypto.randomBytes(20).toString('hex');
	this.name = choiceName;
	this.votes = 0;
	this.votedBy = [];
}

VoteBoxChoice.prototype.toggleVote = function(user) {
	//if the user has not upvoted already
    var hasAlreadyVoted = false;
    for (var i = this.votedBy.length - 1; i >= 0; i--) {
        if (this.votedBy[i].unique === user.unique) {
            hasAlreadyVoted = true;
            break;
        }
    };
	if (!hasAlreadyVoted) {
		this.votes++;
		//add the user to the list of users who have upvoted
		this.votedBy.push(user);
	} else {
		this.votes--;
		//remove the user from the voted list
		var upVoteIndex = this.votedBy.indexOf(user);
		this.votedBy.splice(upVoteIndex, 1);
	}
}


module.exports = VoteBox;
