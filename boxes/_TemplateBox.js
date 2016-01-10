//
//  Lansite Server Box Template
//  By Tanner Krewson
//

//Ctrl+H replace TemplateBox with what you will be calling your custom box,
//	and make sure to name your file the same name.

var Box = require('./require');


TemplateBox.prototype = Object.create(Box.prototype);

function TemplateBox(data) {
	Box.call(this);
	this.id = TemplateBox.id;

	//data is whatever is after the command in the console.
	//Example of command entered into console:
	//
	//	add templatebox foobarbaz zavraboof
	//                  ^----------------->
}

TemplateBox.id = "TemplateBox";

TemplateBox.prototype.addResponseListeners = function(socket, dispatcher) {
	//haven't tested if this self is necessary
	var self = this;
	socket.on(self.unique + '-test', function(msg) {

		//DO SOMETHING
		dispatcher.sendCurrentStreamToAll();
	});
}


module.exports = TemplateBox;