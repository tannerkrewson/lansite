//
//  Lansite Client VoteBox
//  By Tanner Krewson
//

VoteBox.prototype = Object.create(Box.prototype);

function VoteBox(data) {
    Box.call(this, data.id, data.unique);
    this.choices = data.choices;
    this.votes = data.votes;
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
            userID: Cookies.get('userid'),
            index: self.i,
            voteBoxUnique: self.vbu
        });
    });
}