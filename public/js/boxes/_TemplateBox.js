//
//  Lansite Client Box Template
//  By Tanner Krewson
//

//Ctrl+H replace TemplateBox with what you will be calling your custom box,
//	and make sure to name your file the same name.

BoxNames.push('TemplateBox');

TemplateBox.prototype = Object.create(Box.prototype);

function TemplateBox(data) {
    Box.call(this, data.id, data.unique);
    this.updateData(data);
}

//@Override
VoteBox.prototype.updateData = function(data) {
    //Add your constructor here
    this.foo = data.bar;
}


//@Override
TemplateBox.prototype.show = function() {
    
    //Runs the parent show function
    Box.prototype.show.call(this);

    //Place any custom code here

}

//@Override
TemplateBox.prototype.update = function() {

    //Runs the parent update function
    Box.prototype.update.call(this);

    //Place any custom code here
    
}

TemplateBox.addButtons = function(sidebar) {
    sidebar.addButton(new Button('TemplateBox', 'Do Something'));
}

/*  
	You may send information to the server using the SendToServer
    object, like so:

	SendToServer.eventFromIndBox(boxUnique, eventName, data);
	SendToServer.request(requestName, data);
*/