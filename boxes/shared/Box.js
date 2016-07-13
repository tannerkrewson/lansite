//
//  Lansite Server Box
//  By Tanner Krewson
//

var crypto = require('crypto');

var Dispatcher = require('./Dispatcher');

function Box() {
	this.unique = crypto.randomBytes(20).toString('hex');
}

Box.id = "EmptyBox";

Box.prototype.addResponseListeners = function(socket, stream) {
	var self = this;
	this.addRequestListener('removebox', socket, stream, function(user, data) {
		stream.requestManager.addRequest(user, 'wants to close ' + self.id, function(){
			stream.removeBox(self.unique);
			Dispatcher.sendStreamToAll(stream.boxes, stream.users);
		}, function() {});
	});
}

Box.prototype.addEventListener = function(eventName, socket, stream, functionToRun) {
	socket.on(this.unique + '-' + eventName, function(msg) {
		validateUser(msg, stream, functionToRun);
	});
}

Box.prototype.addRequestListener = function(eventName, socket, stream, functionToRun) {
	socket.on(this.unique + '-request-' + eventName, function(msg){
		validateUser(msg, stream, functionToRun);
	});
}

Box.addStaticEventListener = function(eventName, socket, stream, functionToRun) {
	socket.on(eventName, function(msg) {
		validateUser(msg, stream, functionToRun);
	})
}

Box.addStaticRequestListener = function(eventName, socket, stream, functionToRun) {
	socket.on('request-' + eventName, function(msg) {
		validateUser(msg, stream, functionToRun);
	})
}

function validateUser(msg, stream, next) {
	//check if the user is logged in
	var user = stream.users.checkCredentials(msg.id, msg.secret);
	if (user) {
		next(user, msg.data);
		return true;
	} else {
		return false;
	}
}

module.exports = Box;
