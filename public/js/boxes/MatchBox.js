//
//  Lansite Client MatchBox
//  By Tanner Krewson
//

BoxNames.push('MatchBox');

MatchBox.prototype = Object.create(Box.prototype);

function MatchBox(data) {
    Box.call(this, data.id, data.unique);
    this.updateData(data);
}

//@Override
MatchBox.prototype.updateData = function(data) {
    //Add your constructor here
    this.matches = data.matches;
}


//@Override
MatchBox.prototype.show = function() {

    //Runs the parent show function
    Box.prototype.show.call(this);

    //Access to this box on the page
    var thisMatchBox = $('#' + this.unique);

    //add an event to the submit button of the popup
    var popup = $('#MatchBox-Popup');
    var button = $('#MatchBox-Popup-submit');
    var self = this;
    var userId = Cookies.get('id');

    //prevent multiple click events from being binded
    button.off('click');

    button.on('click', function(event) {
        console.log('click!');
        //get the title from the input box
        var game = popup.find('.matchpopupgame').val();
        var min = popup.find('.matchpopupmin').val();
        var max = popup.find('.matchpopupmax').val();

        //clear the inputs
        popup.find('.matchpopupgame').val('');
        popup.find('.matchpopupmin').val('');
        popup.find('.matchpopupmax').val('');

        SendToServer.requestFromIndBox(self.unique, 'newmatch', {
            'game': game,
            'min': min,
            'max': max
        });
    });
}

//@Override
MatchBox.prototype.update = function() {
    this.drawMatches();

    for (var i = this.matches.length - 1; i >= 0; i--) {
        this.updateMatchString(this.matches[i]);
        this.updateMatchCounter(this.matches[i]);
    };
}

MatchBox.prototype.drawMatches = function() {
    //clear current matches from page
    $('#' + this.unique).find('.matches').empty();

    var self = this;
    var thisMatchBox = $('#' + this.unique);
    var userId = Cookies.get('id');

    //If there are no matches
    if (this.matches.length === 0){
        //show the empty list text
        thisMatchBox.find('.matchboxempty').show();
    } else {
        //hide the text
        thisMatchBox.find('.matchboxempty').hide();
    }

    for (var i = 0; i < this.matches.length; i++) {
        var matchTemplate = Box.findTemplate('MatchBox-match');
        var thisMatch = thisMatchBox.find('.matches').append(matchTemplate).children(':last');
        var matchUnique = this.matches[i].unique;

        //add an id to our choice
        thisMatch.attr('id', matchUnique);

        //update the text for this match
        this.updateMatchString(this.matches[i]);

        //add an id to the button for the users dropdown
        var matchCounter = thisMatch.find('.matchcounter');
        var matchCounterId = matchUnique + "-matchcounter";
        matchCounter.attr("id", matchCounterId);

        var matchDropdown = thisMatch.find('.matchusers');
        //link dropdown to the button
        matchDropdown.attr("id", matchUnique + "-matchusers");
        matchDropdown.attr("aria-labelledby", matchCounterId);

        var acceptButton = thisMatch.find('.matchaccept');
        var cancelButton = thisMatch.find('.matchcancel');
        var fullButton = thisMatch.find('.matchfull');

        //precautionary
        acceptButton.hide();
        cancelButton.hide();
        fullButton.hide();

        //determine which button to show
        // if this user is in the match
        if (this.checkIfUserInMatch(userId, this.matches[i])) {
            //display the cancel button, hide the accept button
            acceptButton.hide();
            cancelButton.show();

            (function(mu) {
                cancelButton.click(function(){
                    SendToServer.eventFromIndBox(self.unique, 'cancel', {
                        'matchUnique': mu
                    });
                });
            })(matchUnique);
        } else {
            acceptButton.show();
            cancelButton.hide();

            (function(mu) {
                acceptButton.click(function(){
                    SendToServer.eventFromIndBox(self.unique, 'accept', {
                        'matchUnique': mu
                    });
                });
            })(matchUnique);

            //if the user is not in the match and if the match is full
            //  and if there is a player limit, show the full button
            if (this.matches[i].users.length >= this.matches[i].max && this.matches[i].max !== 0) {
                acceptButton.hide();
                cancelButton.hide();
                fullButton.show();
            }
        }
    };
}

MatchBox.prototype.updateMatchString = function(match) {
    var result = match.host.username + ' wants to play ' + match.game;
    $('#' + match.unique).children('.matchstring').html(result);
}

MatchBox.prototype.updateMatchCounter = function(match) {
    //do the fraction
    var result;
    //if max is zero, then there is no limit to the players that can join
    if (match.max == 0) {
        result = match.users.length;
    } else {
        result = match.users.length + '/' + match.max;
    }
    $('#' + match.unique).find('.matchcounter').html(result);

    //update the users dropdown
    var thisDropdown = $("#" + match.unique + "-matchusers");
    //remove all users currently on the list, if any
    thisDropdown.empty();
    //if no users have picked this choice
    if (match.users.length === 0) {
        thisDropdown.append(
            $('<li>').append(
                $('<a>').attr('href', '#').append(
                    $('<span>').attr('class', 'tab').append('No users')
                )));
    } else {
        //for each user in the users array for this match
        match.users.forEach(function(user) {
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

MatchBox.prototype.checkIfUserInMatch = function(userId, match) {
    for (var i = match.users.length - 1; i >= 0; i--) {
        if (match.users[i].id === parseInt(userId)) {
            return true;
        }
    };
    return false;
}

MatchBox.addButtons = function(sidebar) {}

/*
	You may send information to the server using the SendToServer
    object, like so:

	SendToServer.eventFromIndBox(boxUnique, eventName, data);
	SendToServer.request(requestName, data);
*/
