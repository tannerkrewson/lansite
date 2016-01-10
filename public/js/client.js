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

Deserializer.JSONtoBox = function(msg, functionToRun) {

    if (window[msg.id] && typeof window[msg.id] != 'undefined') {

        //this mumbo jumbo checks if the file exists
        $.ajax({
            url: 'js/boxes/' + msg.id + '.js',
            error: function() {
                functionToRun(false);
            },
            success: function() {
                $.getScript('js/boxes/' + msg.id + '.js', function() {
                    functionToRun(true);
                });
            }
        });

    } else {
        functionToRun();
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
    mainStream.clearArray();
    msg.forEach(function(element) {
        Deserializer.JSONtoBox(element, function(hasCustomBoxScript) {
            if (hasCustomBoxScript) {
                mainStream.addBox(new window[element.id](element));
            } else {
                mainStream.addBox(new Box(element.id, element.unique));
            }

            //TODO: this is very inefficient to have here
            mainStream.redrawAllBoxes();
        });
    });
});

//adds a single box to the top of the current stream
socket.on('newBox', function(msg) {
    Deserializer.JSONtoBox(msg, function(hasCustomBoxScript) {
        if (hasCustomBoxScript) {
            mainStream.addBox(new window[msg.id](msg));
        } else {
            mainStream.addBox(new Box(msg.id, msg.unique));
        }
        mainStream.redrawAllBoxes();
    });
});