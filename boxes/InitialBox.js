//
//  Lansite InitialBox
//  By Tanner Krewson
//

var Box = require('./require');


InitialBox.prototype = Object.create(Box.prototype);

function InitialBox() {
    Box.call(this, 'InitialBox');
}

InitialBox.prototype.addResponseListeners = function(socket, dispatcher) {
	//not much to do here... yet
}


module.exports = InitialBox;
