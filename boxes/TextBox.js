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
		var consoleArr = data.line.split(';');
		this.title = consoleArr[0];
		//remove the first element from the array
		consoleArr.shift();

		//put the string back together
		//	this is only necessary if the user put
		//	semicolons in their console command,
		//	but whatever. prevents weird errors.
		this.text = '';
		for (var i = 0; i < consoleArr.length; i++) {
			this.text += consoleArr[i];
		}

	} else {
		this.text = data.text;
		this.title = data.title;
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
		var user = stream.users.checkCredentials(msg.id, msg.secret);
		if (user) {
			stream.requestManager.addRequest(user, 'wants to post: ' + msg.data.message, function(){
				//The code within this block will be ran if the
				//    request is accepted.

				//post the message
				var tempData = {
					isConsole: false,
					text: msg.data.message,
					title: user.username + ' says: '
				}
				var boxUnique = stream.addBoxById('TextBox', tempData);
				stream.sendBox(boxUnique);
			}, function(){
				//The code within this block will be ran if the
				//    request is denied.
			});
		} else {
			console.log('Add request failed');
		}
	})
}


module.exports = TextBox;
