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

TextBox.prototype.addResponseListeners = function(socket, stream) {
	//Runs the parent addResponseListeners function
	Box.prototype.addResponseListeners.call(this, socket, stream);

	//not much to do here... yet
}

TextBox.addRequestListeners = function(socket, stream) {
	socket.on('request-postMessage', function(msg){
		console.log('Request received');
		//check if the user is logged in
		var user = stream.users.checkIfUserExists(msg.unique);
		if (user) {
			stream.requestManager.addRequest(user, 'wants to post: ' + msg.data.message, function(){
				//The code within this block will be ran if the
				//    request is accepted.
				console.log('Request accepted');

				//post the message
				var tempData = {
					isConsole: false,
					text: msg.data.message
				}
				var boxUnique = stream.addBoxById('TextBox', tempData);
				stream.sendBox(boxUnique);
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


module.exports = TextBox;
