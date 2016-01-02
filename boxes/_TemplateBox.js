//
//  Lansite TemplateBox
//  By Tanner Krewson
//

//Ctrl+H replace TemplateBox with what you will be calling your custom box,
//	and make sure to name your file the same name.

var Box = require('./require');


TemplateBox.prototype = Object.create(Box.prototype);

function TemplateBox() {
	Box.call(this, 'TemplateBox');
}

TemplateBox.prototype.addResponseListeners = function(socket, dispatcher) {
	//haven't tested if this self is necessary
	var self = this;
	socket.on(self.unique + '-test', function(msg) {

		//DO SOMETHING
		dispatcher.sendCurrentStreamToAll();
	});
}


module.exports = TemplateBox;