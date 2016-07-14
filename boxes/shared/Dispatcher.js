//
//  Lansite Dispatcher
//  By Tanner Krewson
//

var Config = require('../../config.js');

function Dispatcher() {}

Dispatcher.sendStream = function(boxes, userToReceiveStream) {
	Dispatcher.sendStreamToSocket(boxes, userToReceiveStream.socket);
}

Dispatcher.sendStreamToSocket = function(boxes, socket) {
	Dispatcher.sendToUser(socket, 'newStream', boxes);
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
	Dispatcher.sendToAllUsers(users.list, 'newBox', box, 'Sent new ' + box.id + ' to all');
}

Dispatcher.sendUpdatedBoxToAll = function(box, users) {
	Dispatcher.sendToAllUsers(users.list, 'updateBox', box, 'Sent updated ' + box.id + ' to all')
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
			tempList.push(element.toStrippedJson());
		}
	});

	Dispatcher.sendToAllUsers(users.list, 'updateUsers', tempList, 'Sent user list to all');
}

Dispatcher.sendToAllUsers = function(userList, event, data, devLogMessage) {
	userList.forEach(function(user) {
		if (user.socket !== null) {
			Dispatcher.sendToUser(user.socket, event, data);
		}
	});

	if (devLogMessage && Config.developerMode) {
		console.log(devLogMessage);
	}
}

Dispatcher.sendToUser = function(socket, event, data) {
	socket.emit(event, data);
}

module.exports = Dispatcher;
