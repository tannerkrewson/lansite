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


//loads boxes from the /boxes directory and preps for making console commands
var BoxObjects = {};

require("fs").readdirSync(require("path").join(__dirname, "boxes")).forEach(function(file) {
    var fileNameMinusTheDotJS = file.substr(0, file.length - 3);

    //prevent it from loading the template and makes sure the id and filename match (not strictly necessary...)
    if (!fileNameMinusTheDotJS.startsWith('_')) {
        var tempObject = require("./boxes/" + file);
        if (tempObject.id === fileNameMinusTheDotJS) {
            //place each script into the object literal
            BoxObjects[fileNameMinusTheDotJS.toLowerCase()] = require("./boxes/" + file);
        };
    }
});


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
            mainStream.addBoxAndSend(new BoxObjects[lineArr[1].toLowerCase()](data), mainDispatcher);
        }
    }

    //static commands
    if (line === "stop")
        process.exit();
    if (line === "users")
        console.log(mainDispatcher.users.listAllUsers());
    if (line === "listAllBoxes")
        console.log(mainStream.listAllBoxes());
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
}

Stream.prototype.addBoxAndSend = function(boxToAdd, dispatcher) {

    //add the socket listeners to each user's socket
    dispatcher.attachListenersToAllUsers(boxToAdd);

    //adds the box to the server-side stream
    this.boxes.push(boxToAdd);

    //sends the box to everyone
    dispatcher.sendNewBoxToAll(boxToAdd);
};

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



function Dispatcher() {
    this.users = new Users();
}

Dispatcher.prototype.sendCurrentStream = function(userToReceiveStream) {
    userToReceiveStream.socket.emit('newStream', mainStream.boxes);
    console.log('Sent stream to ' + userToReceiveStream.unique);
}

Dispatcher.prototype.sendCurrentStreamToAll = function() {
    var self = this;
    this.users.list.forEach(function(tempUser) {
        self.sendCurrentStream(tempUser);
    });
}

Dispatcher.prototype.sendNewBoxToAll = function(box) {
    //loop through all users
    mainDispatcher.users.list.forEach(function(element) {
        element.socket.emit('newBox', box);
    });
}

Dispatcher.prototype.attachListenersToAllUsers = function(box) {
    var self = this;
    this.users.list.forEach(function(user) {
        box.addResponseListeners(user.socket, self);
    });
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

//main object creation
var mainDispatcher = new Dispatcher();
var mainStream = new Stream();

//handles users coming and going
io.on('connection', function(socket) {
    console.log('User connected');
    var user = mainDispatcher.users.addNewUser(socket);

    mainDispatcher.sendCurrentStream(user);

    //add the socket listeners to the user for all of the current boxes
    mainStream.boxes.forEach(function(box) {
        box.addResponseListeners(socket, mainDispatcher);
    });

    socket.on('disconnect', function() {
        console.log('User disconnected');
        mainDispatcher.users.removeUser(user);
    });
});