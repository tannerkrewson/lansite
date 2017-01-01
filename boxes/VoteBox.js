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

	this.voteTitle
	this.choices = [];

	if (data.isConsole){
		var consoleArr = data.line.split(';');
		this.voteTitle = consoleArr[0];
		//remove the first element from the array
		consoleArr.shift();
		this.addChoices(consoleArr);
	} else {
		this.voteTitle = data.voteTitle;
		this.addChoices(data.choices);
	}
}

VoteBox.id = "VoteBox";


VoteBox.addRequestListeners = function(socket, stream) {

	//sent when the client uses the 'Start a Vote' button on the sidebar
	Box.addStaticRequestListener('vote', socket, stream, function(user, data) {
		var requestMessage = 'wants to start a vote. Title: "' + data.voteTitle + '" Choices: ' + data.choices;
		stream.requestManager.addRequest(user, requestMessage, function() {
			var boxUnique = stream.addBoxById('VoteBox', data);
			stream.sendBox(boxUnique);
		}, function() {});
	});

}

VoteBox.prototype.addResponseListeners = function(socket, stream) {
	//Runs the parent addResponseListeners function
	Box.prototype.addResponseListeners.call(this, socket, stream);

	var self = this;

	//sent when a client checks or unchecks a choice in this vote box
	this.addEventListener('vote', socket, stream, function(user, data){
		var indexOfChoice = self.getIndexOfChoiceByUnique(data.unique);
		//if the choice exists
		if (indexOfChoice !== -1) {
			self.choices[indexOfChoice].toggleVote(user.toStrippedJson());
			//sort the array for the client
			self.sortByVotes();
		}
		Dispatcher.sendUpdatedBoxToAll(self, stream.users);
	});

	//sent when client adds a custom choice in the bottom box in this vote box
	this.addRequestListener('voteaddchoice', socket, stream, function(user, data) {
		var choiceName = data.choiceName;
		stream.requestManager.addRequest(user, 'wants to add ' + choiceName + ' to the vote', function() {
			self.addChoice(data.choiceName);
			Dispatcher.sendUpdatedBoxToAll(self, stream.users);
		}, function() {});
	});
}

VoteBox.prototype.addChoices = function(choicesArray){
	for (var i = 0; i <= choicesArray.length - 1; i++) {
		this.addChoice(choicesArray[i]);
	};
}

VoteBox.prototype.addChoice = function(choiceName){
	this.choices.push(new VoteBoxChoice(choiceName.trim()));
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
        if (this.votedBy[i].id === user.id) {
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
