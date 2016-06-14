//
//  Lansite Server RequestBox
//  By Tanner Krewson
//

var Box = require('./shared/Box');
var Dispatcher = require('./shared/Dispatcher');


RequestBox.prototype = Object.create(Box.prototype);

function RequestBox(data) {
	Box.call(this);
	this.id = RequestBox.id;
	this.adminStreamOnly = true;

	if (data.isConsole){
		//this.something = data.line.split(';');
		//data.line will be whatever is after the command in the console.
		//Example of command entered into console:
		//
		//	add RequestBox foobarbaz zavraboof
		//                  ^----------------->
	} else {
		//This is if the box was not added via console, for example
		//    if it was added from a request acceptance.
		this.text = data.text;
	}
}

RequestBox.id = "RequestBox";

RequestBox.prototype.addAdminResponseListeners = function(socket, reqMan) {
	var self = this;
	var adminStream = reqMan.adminStream;

	socket.on(self.unique + '-handle', function(msg) {
		//if the user exists in the admin stream
		if (adminStream.users.checkCredentials(msg.id, msg.secret)) {
			//grab the corresponding request that is stored
			var reqUnique = msg.data.unique;
			var reqIndex = reqMan.getIndexByUnique(reqUnique);

			//if the request exists
			if (reqIndex !== -1) {
				//check if admin accepted or denied request
				var wasAccepted = msg.data.wasAccepted;

				//send it on over
				reqMan.handleRequest(reqUnique, wasAccepted);
			};
		}
	});
}

RequestBox.addRequestListeners = function(socket, stream) {}


module.exports = RequestBox;
