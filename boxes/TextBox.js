//
//  Lansite Server TextBox
//  By Tanner Krewson
//

var Box = require('./shared/Box');
var Dispatcher = require('./shared/Dispatcher');


TextBox.prototype = Object.create(Box.prototype);

function TextBox(data) {
    Box.call(this);
    this.id = TextBox.id;
	if (data.isConsole){
		this.text = data.line;
	} else {
		this.text = data.text;
	}
}

TextBox.id = "TextBox";

TextBox.prototype.changeText = function(text) {
    this.text = text;
}
TextBox.prototype.addResponseListeners = function(socket, dispatcher) {
	//not much to do here... yet
}


module.exports = TextBox;
