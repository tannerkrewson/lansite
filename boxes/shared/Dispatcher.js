//
//  Lansite Dispatcher
//  By Tanner Krewson
//

function Dispatcher() {}

Dispatcher.sendStream = function(boxes, userToReceiveStream) {
	userToReceiveStream.socket.emit('newStream', boxes);
}

Dispatcher.sendStreamToSocket = function(boxes, socket) {
	socket.emit('newStream', boxes);
}

Dispatcher.sendStreamToAll = function(boxes, users) {
	users.list.forEach(function(tempUser) {
		if (tempUser.socket !== null) {
			Dispatcher.sendStream(boxes, tempUser);
		}
	});
	console.log('Sent stream to all')
}

Dispatcher.sendNewBoxToAll = function(box, users) {
	//loop through all users
	users.list.forEach(function(element) {
		if (element.socket !== null) {
			element.socket.emit('newBox', box);
		}
	});
	console.log('Sent new box to all');
}

Dispatcher.sendUpdatedBoxToAll = function(box, users) {

	//TODO: Make sure the box passed is NOT a new box   
	users.list.forEach(function(element) {
		if (element.socket !== null) {
			element.socket.emit('updateBox', box);
		}
	});
	console.log('Sent updated box to all');
}

Dispatcher.attachListenersToAllUsers = function(box, stream) {
	stream.users.list.forEach(function(user) {
		if (user.socket !== null) {
			box.addResponseListeners(user.socket, stream);
		}
	});
}

Dispatcher.attachListenersToAllUsersAdmin = function(box, reqMan) {
	reqMan.adminStream.users.list.forEach(function(user) {
		//TODO: Unhardcode/
		if (user.socket !== null && box.id === 'RequestBox') {
			box.addResponseListenersAdmin(user.socket, reqMan);
		}
	});
}

Dispatcher.sendUserListToAll = function(users) {

	//make a new list of the users that doesnt contain the socket
	//    because that breaks it
	var tempList = [];
	users.list.forEach(function(element) {
		//if the user is online
		if (element.socket !== null) {
			tempList.push({
				id: element.id,
				unique: element.unique,
				displayName: element.displayName,
				realName: element.realName,
				isOp: element.isOp
			})
		}
	});
	users.list.forEach(function(element) {
		if (element.socket !== null) {
			element.socket.emit('updateUsers', tempList);
		}
	});
	console.log('Sent user list to all');
}

module.exports = Dispatcher;