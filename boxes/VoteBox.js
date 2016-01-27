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
		console.log(msg);
		//check if the user is logged in
		var user = stream.users.checkIfUserExists(msg.unique);
		if (user) {
			stream.requestManager.addRequest(user, function(){
				var boxUnique = stream.addBoxById('VoteBox', msg.data);
				stream.sendBox(boxUnique);
				console.log('Request accepted');
			}, function() {
				//TODO: Notify user their request has been denied, maybe
			});
			//Dispatcher.sendUpdatedBoxToAll(self, users);
		} else {
			console.log('Add request failed');
		}
	})
}

VoteBox.prototype.addResponseListeners = function(socket, users) {
	var self = this;
	socket.on(self.unique + '-vote', function(msg) {
		//check if the user is logged in
		if (users.checkIfUserExists(msg.unique)) {
			var indexOfChoice = self.getIndexOfChoiceByUnique(msg.data.unique);
			//if the choice exists
			if (indexOfChoice !== -1) {
				//check for type of vote
				if (msg.data.typeOfVote === 'up') {
					//upvote
					self.choices[indexOfChoice].voteUp(msg.unique);
				} else if (msg.data.typeOfVote === 'down') {
					//downvote
					self.choices[indexOfChoice].voteDown(msg.unique);
				}
			}
			Dispatcher.sendUpdatedBoxToAll(self, users);
		} else {
			console.log('Vote failed');
		}
	});
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



function VoteBoxChoice(choiceName) {
	this.unique = crypto.randomBytes(20).toString('hex');
	this.name = choiceName;
	this.votes = 0;
	this.votedUpBy = [];
	this.votedDownBy = [];
}

//opposite of voteDown function
VoteBoxChoice.prototype.voteUp = function(userUnique) {
	//if the user has not upvoted already
	if (this.votedUpBy.indexOf(userUnique) === -1) {
		//if the user has downvoted
		var downVoteIndex = this.votedDownBy.indexOf(userUnique);
		if (downVoteIndex !== -1) {
			//upvote twice to remove their downvote
			this.votes += 2;
			//remove the user from the downvote list
			this.votedDownBy.splice(downVoteIndex, 1);
		} else {
			//upvote
			this.votes++;
		}
		//add the user to the list of users who have upvoted
		this.votedUpBy.push(userUnique);
	}
}

//opposite of voteUp function
VoteBoxChoice.prototype.voteDown = function(userUnique) {
	//if the user has not downvoted already
	if (this.votedDownBy.indexOf(userUnique) === -1) {
		//if the user has upvoted
		var upVoteIndex = this.votedUpBy.indexOf(userUnique);
		if (upVoteIndex !== -1) {
			//downvote twice to remove their upvote
			this.votes -= 2;
			//remove the user from the upvote list
			this.votedUpBy.splice(upVoteIndex, 1);
		} else {
			//downvote
			this.votes--;
		}
		//add the user to the list of users who have downvoted
		this.votedDownBy.push(userUnique);
	}
}

module.exports = VoteBox;