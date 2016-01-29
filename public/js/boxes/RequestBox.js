//
//  Lansite Client Box Template
//  By Tanner Krewson
//

BoxNames.push('RequestBox');

RequestBox.prototype = Object.create(Box.prototype);

function RequestBox(data) {
    Box.call(this, data.id, data.unique);
    this.updateData(data);
}

//@Override
RequestBox.prototype.updateData = function(data) {
    this.text = data.text;
}

//@Override
RequestBox.prototype.show = function() {
    
    //Runs the parent show function
    Box.prototype.show.call(this);

    //Place any custom code here
    var thisBox = $('#' + this.unique);

    //change the text
    thisBox.find('.requesttext').text(this.text);

    var acceptButton = thisBox.find('.requestaccept');
    var denyButton = thisBox.find('.requestdeny');

    var self = this;
    //when the button is clicked
    acceptButton.on('click', function(event) {
        self.handleRequest(true);
    });
    denyButton.on('click', function(event) {
        self.handleRequest(false);
    });
}

RequestBox.prototype.handleRequest = function(wasAccepted) {
    SendToServer.eventFromIndBox(this.unique, 'handle', {
        'unique': this.unique,
        'wasAccepted': wasAccepted
    });
}

//@Override
RequestBox.prototype.update = function() {

    //Runs the parent update function
    Box.prototype.update.call(this);

    //Place any custom code here
    
}

RequestBox.addButtons = function(sidebar) {
    //sidebar.addButton(new Button('RequestBox', 'Do Something'));
}

/*  
	You may send information to the server using the SendToServer
    object, like so:

	SendToServer.eventFromIndBox(boxUnique, eventName, data);
	SendToServer.request(requestName, data);
*/