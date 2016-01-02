//
//  Lansite VoteBox
//  By Tanner Krewson
//

var Box = require('./require');

VoteBox.prototype = Object.create(Box.prototype);

function VoteBox(data) {
	Box.call(this);
	this.id = VoteBox.id;

	this.choices = data.split(' ');
	this.votes = [];
}

VoteBox.id = "VoteBox";

VoteBox.prototype.addResponseListeners = function(socket, dispatcher) {
	//haven't tested if this self is necessary
	var self = this;
	socket.on(self.unique + '-vote', function(msg) {
		//cast the vote based on the index of the choice
		self.vote(msg.index);

		dispatcher.sendCurrentStreamToAll();
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