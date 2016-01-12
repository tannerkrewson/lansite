//
//  Lansite Server
//  By Tanner Krewson
//

//
//  INITIAL SETUP
//

//requires
var crypto = require('crypto');
var readline = require('readline');
var express = require('express');
var socketio = require('socket.io');
var app = express();

var Box = require('./boxes/shared/Box');
var Dispatcher = require('./boxes/shared/Dispatcher');


//loads boxes from the /boxes directory and preps for making console commands
var BoxObjects = {};

require("fs").readdirSync(require("path").join(__dirname, "boxes")).forEach(function(file) {
    var fileNameMinusTheDotJS = file.substr(0, file.length - 3);

    //prevent it from loading the template and makes sure the id and filename match (not strictly necessary...)
    if (!fileNameMinusTheDotJS.startsWith('_') && file !== 'shared') {
        var tempObject = require("./boxes/" + file);
        if (tempObject.id === fileNameMinusTheDotJS) {
            //place each script into the object literal
            BoxObjects[fileNameMinusTheDotJS.toLowerCase()] = require("./boxes/" + file);
        };
    }
});


//handlebars setup
var handlebars = require('express-handlebars').create({
    defaultLayout: 'main'
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');


//express stuff
app.use(express.static(__dirname + '/public'));


//url mapping
app.get('/', function(req, res) {
    res.render('home');
});


//start server
var io = socketio.listen(app.listen(3000, function() {
    console.log('Lansite is now runnning. Type "stop" to close.');
}));



//
//  OBJECTS
//

function Stream() {
    this.boxes = [];
    this.users = new Users();
}

Stream.prototype.addBoxAndSend = function(boxToAdd) {
    this.addBox(boxToAdd);
    this.sendBox(boxToAdd);
};

Stream.prototype.addBox = function(boxToAdd) {
    //adds the box to the server-side stream
    this.boxes.push(boxToAdd);
}

Stream.prototype.sendBox = function(boxToSend) {
    //TODO: Make sure this.boxes contains boxToSend

    //add the socket listeners to each user's socket
    Dispatcher.attachListenersToAllUsers(boxToSend, this.users);

    //sends the box to everyone
    Dispatcher.sendNewBoxToAll(boxToSend, this.users);
}

Stream.prototype.showAll = function() {
    //clear all from screen
    this.clearAll();

    //this is so that the elements are shown in decsending chonological order
    //slice makes the array copy by val instead of ref
    var tempArray = this.boxes.slice().reverse();
    tempArray.forEach(function(element) {
        element.show();
    });

};

Stream.prototype.clearAll = function() {
    $('#stream').empty();
};

Stream.prototype.listAllBoxes = function() {
    var result = '';
    this.boxes.forEach(function(box) {
        result += box.unique + "\n";
    });
    return result;
}



function Users() {
    this.list = [];
}

Users.prototype.addNewUser = function(socket) {
    var tempUser = new User(socket);
    this.list.push(tempUser);
    return tempUser;
}

Users.prototype.removeUser = function(userToRemove) {
    var indexToRemove = this.list.indexOf(userToRemove);
    if (indexToRemove > -1) {
        this.list.splice(indexToRemove, 1);
    }
}

Users.prototype.listAllUsers = function() {
    var result = '';
    this.list.forEach(function(element) {
        result += element.unique + "\n";
    });
    return result;
}



function User(socket) {
    this.unique = crypto.randomBytes(20).toString('hex');
    this.socket = socket;
}



//
//  MAIN CODE
//

(function() {
    //main object creation
    var mainStream = new Stream();

    var initialStream = new Stream();
    initialStream.addBox(new BoxObjects['initialbox']());
    initialStream.addBox(new BoxObjects['textbox']('Thanks for coming!'));

    //console input
    var stdin = process.openStdin();
    stdin.addListener("data", function(d) {
        //string of what was entered into the console
        var line = d.toString().trim();

        //automatic add commands
        if (line.startsWith('add ')) {
            var lineArr = line.split(' ');
            if (lineArr[1].toLowerCase() in BoxObjects) {
                var lengthBeforeData = lineArr[0].length + lineArr[1].length + 2;
                var data = line.substr(lengthBeforeData, line.length);
                console.log(data);
                mainStream.addBoxAndSend(new BoxObjects[lineArr[1].toLowerCase()](data));
            }
        }

        //static commands
        if (line === "stop")
            process.exit();
        if (line === "users")
            console.log(Dispatcher.users.listAllUsers());
        if (line === "listAllBoxes")
            console.log(Dispatcher.streams.mainStream.listAllBoxes());
    });

    //handles users coming and going
    io.on('connection', function(socket) {
        console.log('User connected');

        var user = mainStream.users.addNewUser(socket);

        Dispatcher.sendStream(mainStream.boxes, user);

        //add the socket listeners to the user for all of the current boxes
        mainStream.boxes.forEach(function(box) {
            box.addResponseListeners(socket, mainStream.users);
        });

        socket.on('disconnect', function() {
            console.log('User disconnected');
            mainStream.users.removeUser(user);
        });
    });
})();