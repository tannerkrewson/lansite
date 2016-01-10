//
//  Lansite Server InitialBox
//  By Tanner Krewson
//

var Box = require('./require');


InitialBox.prototype = Object.create(Box.prototype);

function InitialBox(data) {
    Box.call(this);
    this.id = InitialBox.id;
}

InitialBox.id = "InitialBox";

InitialBox.prototype.addResponseListeners = function(socket, dispatcher) {
	//not much to do here... yet
}


module.exports = InitialBox;
