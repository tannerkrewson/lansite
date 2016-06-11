//
//  Lansite Client
//  By Tanner Krewson
//

//
//  INITIAL SETUP
//

var socket = io();

var isThisUserOP = false;

//will contain all the loaded client boxes
var BoxNames = [];

//bootstrap hamburger button
$(document).ready(function() {
    $('[data-toggle=offcanvas]').click(function() {
        $('.row-offcanvas').toggleClass('active');
    });
});

//auto-updating clock
$(function(){
  setInterval(function(){
    var currentTime = $('.currenttime');
    //put time into the div
    currentTime.text(moment().format('h:mma'));     
  },1000);
});


//
//  OBJECTS
//

function Stream() {
    this.boxes = [];
}

Stream.prototype.addBox = function(boxToAdd) {
    this.boxes.push(boxToAdd);
};

Stream.prototype.updateBox = function(updatedBox) {
    var i;
    for (i = this.boxes.length - 1; i >= 0; i--) {
        if (this.boxes[i].unique === updatedBox.unique) {
            this.boxes[i].updateData(updatedBox);
            break;
        }
    };
    //update the html with the new data
    this.boxes[i].update();
};

Stream.prototype.redrawAllBoxes = function() {

    this.clearScreen();

    //this is so that the elements are shown in decsending chonological order
    //slice makes the array copy by val instead of ref
    var tempArray = this.boxes.slice().reverse();
    tempArray.forEach(function(element) {
        element.show();
        element.update();
    });

};

Stream.prototype.clearScreen = function() {
    var stream = $('#stream');

    //remove all event handlers
    stream.find('*').off();

    //delete all of the html
    stream.empty();
};

Stream.prototype.clearArray = function() {
    this.boxes = [];
};


function Sidebar() {
    this.users = [];
    this.buttons = [];
}

Sidebar.prototype.replaceUsers = function(listOfUsers) {
    this.users = listOfUsers;
};

Sidebar.prototype.updateUsers = function() {
    this.clearUsers();
    this.users.forEach(function(user) {
        //prepare the string
        var username = user.displayName;
        if (user.isOp) {
            username += ' [OP]';
        }

        //append the string to the list
        $('#sidebar ul').append(
            $('<li>').append(
                $('<a>').attr('href', 'http://steamcommunity.com/profiles/' + user.id).append(
                    $('<span>').attr('class', 'tab').append(username)
                )));
    });
};

Sidebar.prototype.clearUsers = function() {
    $('#sidebar ul').empty();
};

Sidebar.prototype.addButton = function(button) {
    //add button to the array
    this.buttons.push(button);

    //add button to the sidebar
    $('#sidebar-buttons').append(
        $('<button>').attr({
            type: "button",
            class: "btn btn-default",
            id: button.id + '-Button',
            'data-toggle': "modal"
        }).append(button.label)
    );

    //make tbis button open the modal
    $('#' + button.id + '-Button').attr('data-target', '#' + button.id + '-Popup');
}


function Button(id, label) {
    this.id = id;
    this.label = label;
}



function Box(id, unique) {
    this.id = id;
    this.unique = unique;
}

Box.prototype.show = function() {

    console.log('Displaying box with id ' + this.id + ' and unique ' + this.unique);

    //Append the template to the stream div,
    var clone = Box.findTemplate(this.id)
    var thisBox = $('#stream').append(clone).children(':last');

    //Change the id of the last div in stream (which is the one we just added)
    thisBox.attr('id', this.unique);

    //add the x button
    thisBox.prepend(
        $('<button>').attr({
            type: "button",
            class: "close closebox",
            id: this.unique + '-closebox',
        }).append('&times;')
    );
    var closeButton = thisBox.find('.closebox');
    closeButton.hide();

    //if this user is op
    if (isThisUserOP){
        //tell the server to delete the box id clicked
        var self = this;
        closeButton.click(function() {
            SendToServer.requestFromIndBox(self.unique, 'removebox', {});
        });

        //show the close button
        closeButton.show();
    }
};

Box.emitEvent = function(boxUnique, eventName, data) {
    SendToServer.eventFromIndBox(boxUnique, eventName, data);
}

Box.findTemplate = function(id) {
    //Find the template and grab its content
    var t = document.querySelector('#' + id).content;

    //Clone the template
    return document.importNode(t, true);
}

Box.JSONtoBox = function(json) {
    if (typeof window[json.id] === 'function') {
        return new window[json.id](json);
    } else {
        return new Box(json.id, json.unique);
    }
}

Box.prototype.update = function() {};


function SendToServer() {}

SendToServer.generic = function(event, data){
    socket.emit(event, {
        unique: Cookies.get('unique'),
        data: data
    });
}

SendToServer.eventFromIndBox = function(boxUnique, eventName, data){
    SendToServer.generic(boxUnique + '-' + eventName, data);
}

SendToServer.request = function(requestName, data){
    SendToServer.generic('request-' + requestName, data);
}

SendToServer.requestFromIndBox = function(boxUnique, requestName, data){
    SendToServer.generic(boxUnique + '-request-' + requestName, data);
}

SendToServer.areWeOP = function(){
    SendToServer.generic('areWeOP', {});
}



//
//  MAIN CODE
//

//main object creation
var mainStream = new Stream();
var mainSidebar = new Sidebar();

//add all buttons once the page has loaded
$(document).ready(function() {
    BoxNames.forEach(function(boxName) {
        var box = window[boxName];
        if (box.addButtons !== undefined) {
            box.addButtons(mainSidebar);
        }
    });
});

//attempt to login using the token from cookies, if it exists
if (window.location.href.endsWith('admin')) {
    SendToServer.generic('adminStreamLogin');
} else if (Cookies.get('unique') && Cookies.get('unique') !== '') {
    SendToServer.generic('login');
}

//replaces the current stream with the received one
socket.on('newStream', function(msg) {
    //see if we are op
    SendToServer.areWeOP();

    //deletes all boxes currently in the array
    mainStream.clearArray();

    //add each box in the received stream to our stream
    msg.forEach(function(element) {
        mainStream.addBox(Box.JSONtoBox(element));
    })

    mainStream.redrawAllBoxes();
});

//adds a single box to the top of the current stream
socket.on('newBox', function(msg) {
    mainStream.addBox(Box.JSONtoBox(msg));
    mainStream.redrawAllBoxes();
});

//updates the received box in the stream
socket.on('updateBox', function(msg) {
    mainStream.updateBox(msg);
});

//updates the user list in the sidebar
socket.on('updateUsers', function(msg) {
    mainSidebar.replaceUsers(msg);
    mainSidebar.updateUsers();
});

socket.on('areWeOP', function(msg) {
    opCheck = msg && true;
    //if we're not already OP

    if (!isThisUserOP && opCheck){
        isThisUserOP = true;

        mainSidebar.addButton(new Button('AdminLink', 'Admin Stream'));
        $('#AdminLink-Button').click(function(){
            window.open('admin', '_blank');
        })

        //redraw all boxes with the X
        mainStream.redrawAllBoxes();
    }
});
