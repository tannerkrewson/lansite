//
//  Lansite Server Box Template
//  By Tanner Krewson
//

//Ctrl+H replace TemplateBox with what you will be calling your custom box,
//	and make sure to name your file the same name.

var Box = require('./shared/Box');
var Dispatcher = require('./shared/Dispatcher');


TemplateBox.prototype = Object.create(Box.prototype);

function TemplateBox(data) {
	Box.call(this);
	this.id = TemplateBox.id;

	if (data.isConsole){
		this.something = data.line.split(';');
		//data.line will be whatever is after the command in the console.
		//Example of command entered into console:
		//
		//	add templatebox foobarbaz zavraboof
		//                  ^----------------->
	} else {
		//This is if the box was not added via console, for example
		//    if it was added from a request acceptance.
	}
}

TemplateBox.id = "TemplateBox";

TemplateBox.prototype.addResponseListeners = function(socket, stream) {
	//Runs the parent addResponseListeners function
	Box.prototype.addResponseListeners.call(this, socket, stream);

	var self = this;
	socket.on(self.unique + '-test', function(msg) {

		//DO SOMETHING
		Dispatcher.sendUpdatedBoxToAll(self, stream.users);
	});
}

TemplateBox.addRequestListeners = function(socket, stream) {
	socket.on('RequestVote', function(msg){
		console.log('Request received');
		console.log(msg);
		//check if the user is logged in
		var user = stream.users.checkIfUserExists(msg.unique);
		if (user) {
			stream.requestManager.addRequest(user, 'has sent a request.', function(){
				//The code within this block will be ran if the
				//    request is accepted.
				console.log('Request accepted');
			}, function(){
				//The code within this block will be ran if the
				//    request is denied.
				console.log('Request denied');
			});
		} else {
			console.log('Add request failed');
		}
	})
}


module.exports = TemplateBox;