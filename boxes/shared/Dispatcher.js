//
//  Lansite Dispatcher
//  By Tanner Krewson
//

function Dispatcher() {}

Dispatcher.sendStream = function(boxes, userToReceiveStream) {
	userToReceiveStream.socket.emit('newStream', boxes);
}

Dispatcher.sendStreamToAll = function(boxes, users) {
	users.list.forEach(function(tempUser) {
		self.sendStream(boxes, tempUser);
	});
	console.log('Sent stream to all')
}

Dispatcher.sendNewBoxToAll = function(box, users) {
	//loop through all users
	users.list.forEach(function(element) {
		element.socket.emit('newBox', box);
	});
	console.log('Sent new box to all');
}

Dispatcher.sendUpdatedBoxToAll = function(box, users) {

	//TODO: Make sure the box passed is NOT a new box   
	users.list.forEach(function(element) {
		element.socket.emit('updateBox', box);
	});
	console.log('Sent updated box to all');
}

Dispatcher.attachListenersToAllUsers = function(box, users) {
	users.list.forEach(function(user) {
		box.addResponseListeners(user.socket, users);
	});
}

module.exports = Dispatcher;