//
//  Lansite Client
//  By Tanner Krewson
//

//
//  INITIAL SETUP
//

var socket = io();



//
//  OBJECTS
//

function Stream() {
    this.array = [];
}

Stream.prototype.addBox = function(boxToAdd) {
    this.array.push(boxToAdd);
};

Stream.prototype.redrawAllBoxes = function() {

    this.clearScreen();

    //this is so that the elements are shown in decsending chonological order
    //slice makes the array copy by val instead of ref
    var tempArray = this.array.slice().reverse();
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
    this.array = [];
};



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

    // Example of template population for future use
    //t.querySelector('img').src = 'logo.png';

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

Box.prototype.update = function() {};



//
//  MAIN CODE
//

//main object creation
var mainStream = new Stream();

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