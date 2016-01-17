//
//  Lansite Server VoteBox
//  By Tanner Krewson
//

var Box = require('./shared/Box');
var Dispatcher = require('./shared/Dispatcher');

VoteBox.prototype = Object.create(Box.prototype);

function VoteBox(data) {
	Box.call(this);
	this.id = VoteBox.id;

	this.choices = data.split(' ');
	this.votes = [];
}

VoteBox.id = "VoteBox";


VoteBox.prototype.addResponseListeners = function(socket, users) {
	var self = this;

	socket.on(self.unique + '-vote', function(msg) {
		//check if the user is logged in
		if (users.checkIfUserExists(msg.unique)) {
			//cast the vote based on the index of the choice
			self.vote(msg.data.index);
			Dispatcher.sendUpdatedBoxToAll(self, users);
		} else {
			console.log('Vote failed');
		}
	});
}


VoteBox.prototype.vote = function(indexOfChoice) {
	//make sure the spot in the array has integer
	if (this.votes[indexOfChoice] === undefined) this.votes[indexOfChoice] = 0;

	//add 1 to the vote at the specific index
	this.votes[indexOfChoice]++;

	console.log('There are now ' + this.votes[indexOfChoice] + ' votes for ' + this.choices[indexOfChoice]);
}

VoteBox.prototype.getNumberOfVotes = function(indexOfChoice) {
	return this.votes[indexOfChoice];
}


module.exports = VoteBox;