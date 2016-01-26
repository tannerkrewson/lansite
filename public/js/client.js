//
//  Lansite Client
//  By Tanner Krewson
//

//
//  INITIAL SETUP
//

var socket = io();

$(document).ready(function() {
    $('[data-toggle=offcanvas]').click(function() {
        $('.row-offcanvas').toggleClass('active');
    });
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
        if (user.isOp){
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

Sidebar.prototype.addButton = function(button){
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


function Deserializer() {}

Deserializer.JSONtoBox = function(json) {
    if (typeof window[json.id] === 'function') {
        return new window[json.id](json);
    } else {
        return new Box(json.id, json.unique);
    }
}



function PageCommunicator() {}

PageCommunicator.findTemplate = function(id) {
    //Find the template and grab its content
    var t = document.querySelector('#' + id).content;

    //Clone the template
    return document.importNode(t, true);
}



function Box(id, unique) {
    this.id = id;
    this.unique = unique;
}

Box.prototype.show = function() {

    console.log('Displaying box with id ' + this.id + ' and unique ' + this.unique);

    //Append the template to the stream div,
    //  then change the id of the last div in stream (which is the one we just added)
    var clone = PageCommunicator.findTemplate(this.id)
    $('#stream').append(clone).children(':last').attr('id', this.unique);

};

Box.emitEvent = function(boxUnique, eventName, data) {
    socket.emit(boxUnique + '-' + eventName, {
        unique: Cookies.get('unique'),
        data: data
    });
}

Box.prototype.update = function() {};



//
//  MAIN CODE
//

(function() {
    //main object creation
    var mainStream = new Stream();
    var mainSidebar = new Sidebar();

    mainSidebar.addButton(new Button('VoteBox', 'Request Vote'));


    //attempt to login using the token from cookies, if it exists
    if (Cookies.get('unique') && Cookies.get('unique') !== '') {
        socket.emit('login', {
            unique: Cookies.get('unique')
        });
    }

    //replaces the current stream with the received one
    socket.on('newStream', function(msg) {
        //deletes all boxes currently in the array
        mainStream.clearArray();

        //add each box in the received stream to our stream
        msg.forEach(function(element) {
            mainStream.addBox(Deserializer.JSONtoBox(element));
        })

        mainStream.redrawAllBoxes();
    });

    //adds a single box to the top of the current stream
    socket.on('newBox', function(msg) {
        mainStream.addBox(Deserializer.JSONtoBox(msg));
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


})();

function testEvent() {
    socket.emit('RequestVote', {
        unique: Cookies.get('unique')
    });
}