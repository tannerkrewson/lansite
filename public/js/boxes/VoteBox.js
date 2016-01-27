//
//  Lansite Client VoteBox
//  By Tanner Krewson
//

BoxNames.push('VoteBox');

VoteBox.prototype = Object.create(Box.prototype);

function VoteBox(data) {
    Box.call(this, data.id, data.unique);
    this.updateData(data);
}

//@Override
VoteBox.prototype.updateData = function(data) {
    this.choices = data.choices;
}

//@Override
VoteBox.prototype.show = function() {
    //run the function that we're overriding
    Box.prototype.show.call(this);
    var self = this;
    var thisUnique = this.unique;

    var thisVoteBox = $('#' + thisUnique);
    //loop through each choice and add them
    for (var i = 0; i < this.choices.length; i++) {
        var choiceTemplate = Box.findTemplate('VoteBox-choice');
        var thisChoice = thisVoteBox.find('.choices').append(choiceTemplate).children(':last');

        var choiceUnique = this.choices[i].unique;

        //add an id to our choice
        thisChoice.attr('id', choiceUnique);

        var button = $('#' + choiceUnique).find('.choicevotebutton');
        // http://stackoverflow.com/questions/1451009/javascript-infamous-loop-issue
        (function(cu) {
            button.on('click', function(event) {
                self.sendVote(cu, 'up');
            });
        })(choiceUnique);
    }

    //add handlers to the add game box
    // http://stackoverflow.com/questions/6524288/jquery-event-for-user-pressing-enter-in-a-textbox
    var addChoiceInput = thisVoteBox.find('.voteadd');
    //when the enter key is press inside the input box
    addChoiceInput.bind("enterKey",function(e){
        //request to add the choice
        self.requestAddChoice(addChoiceInput.val());
        console.log(addChoiceInput.val());
    });
    addChoiceInput.keyup(function(e){
        if(e.keyCode == 13)
        {
            $(this).trigger("enterKey");
        }
    });
}

VoteBox.prototype.update = function() {
    var self = this;
    this.choices.forEach(function(choice) {
        self.updateChoiceName(choice);
        self.updateChoiceVotes(choice);
    });
}

VoteBox.addButtons = function(sidebar) {
    sidebar.addButton(new Button('VoteBox', 'Request Vote'));

    //add an event to the submit button of the popup
    var popup = $('#VoteBox-Popup');
    var button = $('#VoteBox-Popup-submit');
    var self = this;
    button.on('click', function(event) {
        socket.emit('RequestVote', {
            unique: Cookies.get('unique'),
            data: {
                choices: ["Game1","Game2","Game3"]
            }
        });
    });
}

VoteBox.prototype.sendVote = function(choiceUnique, typeOfVote) {
    //this check is to save the server the trouble of having to respond
    //    to phony votes, not strictly neccessary as the server will
    //    still check if the user has already voted
    //Also, this function used to be like one line, RIP.

    var indexOfChoice = this.getIndexOfChoiceByUnique(choiceUnique);

    var choice;
    //check to make sure choice exists just in case something crazy happens
    if (indexOfChoice !== -1) {
        choice = this.choices[indexOfChoice];
    } else {
        //something crazy happened, lets get outta here
        return;
    }

    var userUnique = Cookies.get('unique');
    //set to true just in case something crazy happens
    var userAlreadyVoted = true;
    if (typeOfVote === 'up') {
        userAlreadyVoted = (choice.votedUpBy.indexOf(userUnique) !== -1);
    } else if (typeOfVote === 'down') {
        userAlreadyVoted = (choice.votedDownBy.indexOf(userUnique) !== -1);
    } else {
        //something crazy happened, lets get outta here
        return;
    }

    //if the user has not already upvoted
    if (!userAlreadyVoted) {
        Box.emitEvent(this.unique, 'vote', {
            unique: choiceUnique,
            typeOfVote: typeOfVote
        });
    }
}

VoteBox.prototype.requestAddChoice = function(newChoiceName) {
    /*Box.emitEvent(this.unique, 'add', {
        name: newChoiceName
    });*/
}


VoteBox.prototype.updateChoiceName = function(choice) {
    $('#' + choice.unique).children('.choicename').attr('value', choice.name);
}

VoteBox.prototype.updateChoiceVotes = function(choice) {
    var result = '';
    //this will format the vote number, e.g. +1, -4, +0
    if (choice.votes >= 0) {
        result = '+' + choice.votes;
    } else {
        result = choice.votes;
    }
    $('#' + choice.unique).find('.choicevotes').html(result);
}

VoteBox.prototype.getIndexOfChoiceByUnique = function(unique) {
    for (var i = this.choices.length - 1; i >= 0; i--) {
        if (this.choices[i].unique === unique) {
            return i;
        }
    }
    return -1;
}
