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
    this.voteTitle = data.voteTitle;
}

//@Override
VoteBox.prototype.show = function() {
    //run the function that we're overriding
    Box.prototype.show.call(this);
    var self = this;

    var thisVoteBox = $('#' + this.unique);

    //add the title to the html
    thisVoteBox.find('.votetitle').html(this.voteTitle);

    //add the choices to the html
    this.redrawChoices();

    //add handlers to the add game box
    //function to be ran when user submits a choice request
    var addChoiceInput = thisVoteBox.find('.voteadd');
    var reqChoice = function() {
        //check to make sure they typed something
        var choiceRequest = addChoiceInput.val().trim();
        if (choiceRequest !== ''){
            self.requestAddChoice(choiceRequest);
            addChoiceInput.val('');
        }
    };

    //when the enter key is pressed inside the input box
    addChoiceInput.bind('keypress', function(e) {
        if(e.keyCode==13){
            reqChoice();
        }
    });

    //do the same for when the little button is clicked
    var button = thisVoteBox.find('.voteaddbutton');
    button.on('click', reqChoice);
}

VoteBox.prototype.update = function() {
    this.redrawChoices();

    //TODO: Go back to this way of doing it
    var self = this;
    this.choices.forEach(function(choice) {
        self.updateChoiceName(choice);
        self.updateChoiceVotes(choice);
    });
}

VoteBox.addButtons = function(sidebar) {
    sidebar.addButton(new Button('VoteBox', 'Start a vote'));

    //add an event to the submit button of the popup
    var popup = $('#VoteBox-Popup');
    var button = $('#VoteBox-Popup-submit');
    var self = this;
    button.on('click', function(event) {
        //get the title from the input box
        var title = popup.find('.reqvotetitle').val();

        //do the same for the choices
        var choices = popup.find('.reqvotechoices').val();

        //clear the inputs
        popup.find('.reqvotetitle').val('');
        popup.find('.reqvotetitle').val('');

        SendToServer.request('vote', {
            voteTitle: title,
            choices: choices.split(';')
        });
    });
}

VoteBox.prototype.sendVote = function(choiceUnique) {
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

    SendToServer.eventFromIndBox(this.unique, 'vote', {
        unique: choiceUnique
    });
}

VoteBox.prototype.redrawChoices = function(){
    //remove previous choices so we can redisplay all
    this.removeAllChoicesHTML();

    var self = this;
    var thisVoteBox = $('#' + this.unique);
    var userId = Cookies.get('id');

    //loop through each choice and add them
    for (var i = 0; i < this.choices.length; i++) {
        var choiceTemplate = Box.findTemplate('VoteBox-choice');
        var thisChoice = thisVoteBox.find('.choices').append(choiceTemplate).children(':last');
        var choiceUnique = this.choices[i].unique;

        //add an id to our choice
        thisChoice.attr('id', choiceUnique);

        //add an id to the button for the user dropdown
        var voteCounter = $('#' + choiceUnique).find('.choicevotes');
        var voteCounterId = choiceUnique + "-choicevotes";
        voteCounter.attr("id", voteCounterId);

        var votersDropdown = $('#' + choiceUnique).find('.choicevoterslist');
        //link dropdown to the button
        votersDropdown.attr("id", choiceUnique + "-choicevoterslist");
        votersDropdown.attr("aria-labelledby", voteCounterId);

        var check = $('#' + choiceUnique).find('.choicevotebutton');

        //check the box if the user has already voted for it
        var hasAlreadyVoted = false;
        for (var j = this.choices[i].votedBy.length - 1; j >= 0; j--) {
            if (this.choices[i].votedBy[j].id === parseInt(userId)) {
                hasAlreadyVoted = true;
                break;
            }
        };
        if (hasAlreadyVoted) {
            check.prop("checked", true);
        }

        //send a vote if the user checks or unchecks the checkbox
        // http://stackoverflow.com/questions/1451009/javascript-infamous-loop-issue
        (function(cu) {
            check.change(function() {
                self.sendVote(cu);
            });
        })(choiceUnique);
    }
}

VoteBox.prototype.removeAllChoicesHTML = function() {
    $('#' + this.unique).find('.choices').empty();
}

VoteBox.prototype.requestAddChoice = function(newChoiceName) {
    SendToServer.requestFromIndBox(this.unique, 'voteaddchoice', {
        choiceName: newChoiceName
    });
}

VoteBox.prototype.updateChoiceName = function(choice) {
    $('#' + choice.unique).children('.choicename').attr('value', choice.name);
}

VoteBox.prototype.updateChoiceVotes = function(choice) {
    var thisChoice = $("#" + choice.unique + "-choicevotes");

    //append the number of votes
    var result = '';
    //this will format the vote number, e.g. +1, -4, +0
    if (choice.votes >= 0) {
        result = '+' + choice.votes;
    } else {
        result = choice.votes;
    }
    thisChoice.html(result);

    //update the voters dropdown
    var thisDropdown = $("#" + choice.unique + "-choicevoterslist");
    //remove all users currently on the list, if any
    thisDropdown.empty();
    //if no users have picked this choice
    if (choice.votedBy.length === 0) {
        thisDropdown.append(
            $('<li>').append(
                $('<a>').attr('href', '#').append(
                    $('<span>').attr('class', 'tab').append('No users')
                )));
    } else {
        //for each user in the votedBy array for this choice
        choice.votedBy.forEach(function(user) {
            //prepare the string
            var username = user.username;

            //append the string to the list
            thisDropdown.append(
                $('<li>').append(
                    $('<a>').attr('href', 'http://steamcommunity.com/profiles/' + user.steamInfo.id).append(
                        $('<span>').attr('class', 'tab').append(username)
                    )));
        });
    }
}

VoteBox.prototype.getIndexOfChoiceByUnique = function(unique) {
    for (var i = this.choices.length - 1; i >= 0; i--) {
        if (this.choices[i].unique === unique) {
            return i;
        }
    }
    return -1;
}
