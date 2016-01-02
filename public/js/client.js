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

Deserializer.JSONtoBox = function(msg) {
    var tempBox;
    //window[msg.id] is unnecessary...
    if (msg.id === 'TextBox') {
        tempBox = new window[msg.id](msg.id, msg.unique, msg.text);
    } else if (msg.id === 'VoteBox') {
        tempBox = new window[msg.id](msg.id, msg.unique, msg.choices, msg.votes);
    } else {
        tempBox = new Box(msg.id, msg.unique);
    }
    return tempBox;
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



TextBox.prototype = Object.create(Box.prototype);

function TextBox(id, unique, text) {
    Box.call(this, id, unique);
    this.text = text;
}

TextBox.prototype.update = function() {
    //jquery to set the text
    $('#' + this.unique).find('h3').html(this.text);
}

TextBox.prototype.changeText = function(text) {
    this.text = text;
}



VoteBox.prototype = Object.create(Box.prototype);

function VoteBox(id, unique, arrayOfChoices, arrayOfVotes) {
    Box.call(this, id, unique);
    this.choices = arrayOfChoices;
    this.votes = arrayOfVotes;
    this.vbc = [];
}

//@Override
VoteBox.prototype.show = function() {
    //run the function that we're overriding
    Box.prototype.show.call(this);

    var thisVoteBox = $('#' + this.unique);
    //loop through each choice and add them
    for (var i = 0; i < this.choices.length; i++) {
        var choiceTemplate = PageCommunicator.findTemplate('VoteBox-choice');
        var thisChoice = thisVoteBox.find('.choices').append(choiceTemplate).children(':last');

        //add an id to our choice
        thisChoice.attr('id', this.unique + '-choice' + i);

        //assign a click event to each choice's vote button
        var tempVBC = new VoteBoxChoice(i, this.unique);

        tempVBC.addClickEvent();
        this.vbc.push(tempVBC);
    }
}

VoteBox.prototype.update = function() {

    for (var i = 0; i < this.choices.length; i++) {
        this.changeChoiceName(i);
        this.changeChoiceVotes(i);
    }
}

VoteBox.prototype.changeChoiceName = function(choiceIndex) {
    $('#' + this.unique + '-choice' + choiceIndex).children('.choicename').attr('value', this.choices[choiceIndex]);
}

VoteBox.prototype.changeChoiceVotes = function(choiceIndex) {

    //because otherwise they would be undefined
    if (this.votes[choiceIndex] === undefined) this.votes[choiceIndex] = 0;

    $('#' + this.unique + '-choice' + choiceIndex).find('.choicevotes').html('+' + this.votes[choiceIndex]);
}


function VoteBoxChoice(choiceIndex, voteBoxUnique) {
    this.i = choiceIndex;
    this.vbu = voteBoxUnique;
}

VoteBoxChoice.prototype.addClickEvent = function() {
    // http://stackoverflow.com/questions/20279484/how-to-access-the-correct-this-context-inside-a-callback
    var self = this;
    var button = $('#' + this.vbu + '-choice' + this.i).find('.choicevotebutton');

    button.on('click', function(event) {
        socket.emit(self.vbu + '-vote', {
            index: self.i,
            voteBoxUnique: self.vbu
        });
    });
}



//
//  MAIN CODE
//

//main object creation
var mainStream = new Stream();

//replaces the current stream with the received one
socket.on('newStream', function(msg) {
    mainStream.clearArray();
    msg.forEach(function(element) {
        var tempBox = Deserializer.JSONtoBox(element);
        mainStream.addBox(tempBox);
    });
    mainStream.redrawAllBoxes();
});

//adds a single box to the top of the current stream
socket.on('newBox', function(msg) {
    var tempBox = Deserializer.JSONtoBox(msg);
    mainStream.addBox(tempBox);
    mainStream.redrawAllBoxes();
});