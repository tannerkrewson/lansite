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


//default and custom box loader
var BoxObjects = {};

require("fs").readdirSync(require("path").join(__dirname, "boxes")).forEach(function(file) {
    var fileNameMinusTheDotJS = file.substr(0, file.length - 3);

    //this prevents it from loading the template
    if (!fileNameMinusTheDotJS.startsWith('_')) {
        BoxObjects[fileNameMinusTheDotJS] = require("./boxes/" + file);
    }
});

//console
var rl = readline.createInterface(process.stdin, process.stdout);
rl.setPrompt('lansite> ');
rl.prompt();
rl.on('line', function(line) {
    if (line === "stop") rl.close();
    if (line === "users") console.log(mainDispatcher.users.listAllUsers());
    if (line === "add initial") mainStream.addBoxAndSend(new BoxObjects['InitialBox'](), mainDispatcher);
    if (line.startsWith("add text")) mainStream.addBoxAndSend(new BoxObjects['TextBox'](line.substr(9, line.length)), mainDispatcher);
    if (line === "add vote") console.log('Add choices after command, seperated by spaces.');
    if (line.startsWith("add vote ")) mainStream.addBoxAndSend(new BoxObjects['VoteBox'](line.substr(9, line.length).split(' ')), mainDispatcher);
    if (line === "listAllBoxes") console.log(mainStream.listAllBoxes());
}).on('close', function() {
    process.exit(0);
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