//
//  Lansite Dispatcher
//  By Tanner Krewson
//

var Config = require('../../config.js');

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
	if (Config.developerMode)
		console.log('Sent stream to all')
}

Dispatcher.sendNewBoxToAll = function(box, users) {
	//loop through all users
	users.list.forEach(function(element) {
		if (element.socket !== null) {
			element.socket.emit('newBox', box);
		}
	});
	if (Config.developerMode)
		console.log('Sent new ' + box.id + ' to all');
}

Dispatcher.sendUpdatedBoxToAll = function(box, users) {

	//TODO: Make sure the box passed is NOT a new box
	users.list.forEach(function(element) {
		if (element.socket !== null) {
			element.socket.emit('updateBox', box);
		}
	});
	if (Config.developerMode)
		console.log('Sent updated ' + box.id + ' to all');
}

Dispatcher.attachListenersToUser = function(user, box, stream) {
	if (user.socket !== null) {
		box.addResponseListeners(user.socket, stream);
	}
}

Dispatcher.attachAdminListenersToUser = function(user, box, reqMan) {
	if (user.socket !== null && box.adminStreamOnly) {
		box.addAdminResponseListeners(user.socket, reqMan);
	}
}

Dispatcher.attachListenersToAllUsers = function(box, stream) {
	stream.users.list.forEach(function(user) {
		Dispatcher.attachListenersToUser(user, box, stream);
	});
}

Dispatcher.attachAdminListenersToAllUsers = function(box, reqMan) {
	reqMan.adminStream.users.list.forEach(function(user) {
		Dispatcher.attachAdminListenersToUser(user, box, reqMan);
	});
}

Dispatcher.sendUserListToAll = function(users) {

	//make a new list of the users that doesnt contain the socket
	//    because that breaks it
	//		and that doesn't contain the users' secrets, because
	//		that would be a security hazard
	var tempList = [];
	users.list.forEach(function(element) {
		//if the user is online
		if (element.socket !== null) {
			tempList.push({
				id: element.id,
				steamId: element.steamId,
				username: element.username,
				isOp: element.isOp
			})
		}
	});
	users.list.forEach(function(element) {
		if (element.socket !== null) {
			element.socket.emit('updateUsers', tempList);
		}
	});
	if (Config.developerMode)
		console.log('Sent user list to all');
}

module.exports = Dispatcher;
