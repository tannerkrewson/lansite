//
//  Lansite Server RequestBox
//  By Tanner Krewson
//

var Box = require('./shared/Box');
var Dispatcher = require('./shared/Dispatcher');


RequestBox.prototype = Object.create(Box.prototype);
RequestBox.excludeFromConsole = true;

function RequestBox(data) {
	Box.call(this);
	this.id = RequestBox.id;
	this.adminStreamOnly = true;

	this.text = data.text
}

RequestBox.id = "RequestBox";

RequestBox.prototype.addAdminResponseListeners = function(socket, reqMan) {
	var self = this;
	var adminStream = reqMan.adminStream;

	this.addEventListener('handle', socket, adminStream, function(user, data) {
		//grab the corresponding request that is stored
		var reqUnique = data.unique;
		var reqIndex = reqMan.getIndexByUnique(reqUnique);

		//if the request exists
		if (reqIndex !== -1) {
			//check if admin accepted or denied request
			var wasAccepted = data.wasAccepted;

			//send it on over
			reqMan.handleRequest(reqUnique, wasAccepted);
		};
	});
}

RequestBox.addRequestListeners = function(socket, stream) {}


module.exports = RequestBox;
