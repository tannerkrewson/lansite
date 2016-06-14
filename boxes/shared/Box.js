//
//  Lansite Server Box
//  By Tanner Krewson
//

var crypto = require('crypto');

//var Dispatcher = require('./shared/Dispatcher');

function Box() {
	this.unique = crypto.randomBytes(20).toString('hex');
}

Box.id = "EmptyBox";

Box.prototype.addResponseListeners = function(socket, stream) {
	var self = this;
	socket.on(self.unique + '-request-removebox', function(msg){
		console.log('Request received');
		//check if the user is logged in
		var user = stream.users.findUser(msg.id);
		if (user) {
			stream.requestManager.addRequest(user, 'wants to close ' + self.id, function(){
				stream.removeBox(self.unique);
				//Dispatcher.sendStreamToAll(stream.boxes, stream.users);
				//TODO: Make dispatcher work
				stream.users.list.forEach(function(tempUser) {
					if (tempUser.socket !== null) {
						tempUser.socket.emit('newStream', stream.boxes);
					}
				});
				console.log('Request accepted');
			}, function() {
				//TODO: Notify user their request has been denied, maybe
			});
		} else {
			console.log('Add request failed');
		}
	})
}

module.exports = Box;
