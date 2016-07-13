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
  //sent when the client uses the 'Post a Message' button on the sidebar
	Box.addStaticRequestListener('postMessage', socket, stream, function(user, data) {
    stream.requestManager.addRequest(user, 'wants to post: ' + data.message, function(){
      //post the message
      var tempData = {
        isConsole: false,
        text: data.message,
        title: user.username + ' says: '
      }
      var boxUnique = stream.addBoxById('TextBox', tempData);
      stream.sendBox(boxUnique);
    }, function(){});
	});
}


module.exports = TextBox;
