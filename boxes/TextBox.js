//
//  Lansite TextBox
//  By Tanner Krewson
//

var Box = require('./require');


TextBox.prototype = Object.create(Box.prototype);

function TextBox(text) {
    Box.call(this, 'TextBox');
    this.text = text;
}

TextBox.prototype.changeText = function(text) {
    this.text = text;
}
TextBox.prototype.addResponseListeners = function(socket, dispatcher) {
	//not much to do here... yet
}


module.exports = TextBox;
