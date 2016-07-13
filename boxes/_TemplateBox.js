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

	//isConsole will be true if this box is being created from
	//	the 'add templatebox' console command
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

	//ran when the client sends the event 'test' to this individual box
	this.addEventListener('test', socket, stream, function(user, data){

		// Write code here to do something with user and data.
		// Note that the user object has already been authenticated and approved.

		//if you have added code that makes changes to what the box displays,
		//	run the following to send the updates to all clients:
		Dispatcher.sendUpdatedBoxToAll(self, stream.users);
	});

	//ran when the client sends the request 'requestTest' to this individual box
	this.addRequestListener('requestTest', socket, stream, function(user, data){

		// Write code here to do something with user and data.
		// Note that the user object has already been authenticated and approved.

		stream.requestManager.addRequest(user, 'has sent a request.', function(){
			//The code within this block will be ran if the
			//    request is accepted.
		}, function(){
			//The code within this block will be ran if the
			//    request is denied.
		});

		//if you have added code that makes changes to what the box displays,
		//	run the following to send the updates to all clients:
		Dispatcher.sendUpdatedBoxToAll(self, stream.users);
	});
}

TemplateBox.addRequestListeners = function(socket, stream) {
	//ran when the client sends the request 'addTemplateBox', usually froma sidebar button
	Box.addStaticRequestListener('addTemplateBox', socket, stream, function(user, data){

		//Write code here to do something with user who sent the data and
		//	the data itself.
		//Note that the user object has already been authenticated and approved.

		stream.requestManager.addRequest(user, 'wants to create a TemplateBox', function(){
			//The code within this block will be ran if the
			//    request is accepted.

			//Below is an example of code that creates a new instance of a TemplateBox
			//	in the stream, and sends it to everyone
			var boxUnique = stream.addBoxById('TemplateBox', data);
			stream.sendBox(boxUnique);
		}, function(){
			//The code within this block will be ran if the
			//    request is denied.
		});
	});
}


module.exports = TemplateBox;
