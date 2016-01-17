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

var passport = require('passport');
var SteamStrategy = require('passport-steam').Strategy;

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

//passport setup
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

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

Users.prototype.addUserOrUpdateUnique = function(unique, id, displayName, realName) {
    for (element of this.list) {
        //if this user already exists
        if (element.id === id) {
            //update their info (i don't update realName)
            element.unique = unique;
            element.displayName = displayName;

            //should already be null, just precautionary
            element.socket = null;
            return element;
        }
    }

    //ran if the user does not already exist
    var tempUser = new User(unique, id, displayName, realName);
    this.list.push(tempUser);
    return tempUser;
}

Users.prototype.admitUserIfExists = function(unique, socket) {
    if (this.checkIfUserExists(unique)) {
        //user found! update their info
        element.socket = socket;
        return element;
    }

    //user not found
    return null;
}

Users.prototype.checkIfUserExists = function(unique) {
    for (element of this.list) {
        if (element.unique === unique) {
            return true;
        }
    }
    return false;
}

Users.prototype.removeUser = function(userToRemove) {
    var indexToRemove = this.list.indexOf(userToRemove);
    if (indexToRemove > -1) {
        this.list.splice(indexToRemove, 1);
    }
}

Users.prototype.listAllUsers = function() {
    /*var result = '';
    this.list.forEach(function(element) {
        result += element.unique + "\n";
    });
    return result;*/
    return this.list;
}



function User(unique, id, displayName, realName) {
    this.unique = unique;
    this.socket = null;

    this.id = id;
    this.displayName = displayName;
    this.realName = realName;
}



function LoginSuccessHandler(req, res, mainStream) {
    //this is ran when the user successfully logs into steam

    //generate the user's unique identifier that will be used
    //    to identify them once they are redirected to the
    //    main stream.
    var tempUnique = crypto.randomBytes(20).toString('hex');

    //add the user to the stream and await their return
    mainStream.users.addUserOrUpdateUnique(tempUnique, req.user.id, req.user.displayName, req.user._json.realname);

    //set a cookie that will act as the user's login token
    res.cookie('unique', tempUnique, {
        maxAge: 604800000 // Expires in one week
    });

    //redirect home
    res.redirect('/');
}



//
//  MAIN CODE
//

(function() {
    //main object creation
    var mainStream = new Stream();

    var initialStream = new Stream();
    initialStream.addBox(new BoxObjects['initialbox']());

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
            console.log(mainStream.users.listAllUsers());
        if (line === "listAllBoxes")
            console.log(mainStream.listAllBoxes());
    });

    passport.use(new SteamStrategy({
            returnURL: 'http://localhost:3000/auth/steam/return',
            realm: 'http://localhost:3000/',
            apiKey: 'API KEY HERE'
        },
        function(identifier, profile, done) {
            //i don't know what any of this does
            profile.identifier = identifier;
            return done(null, profile);
        }
    ));

    app.get('/auth/steam',
        passport.authenticate('steam'),
        function(req, res) {});

    app.get('/auth/steam/return',
        passport.authenticate('steam', {
            failureRedirect: '/'
        }),
        function(req, res) {
            LoginSuccessHandler(req, res, mainStream);
        });


    //fake steam login for development purposes
    if (true) { //TODO: Check a config file for this
        app.get('/devlogin', function(req, res) {
            // http://localhost:3000/devlogin?id=IDHERE&displayName=DNAMEHERE&realname=RNAMEHERE
            req.user = {
                id: req.query.id,
                displayName: req.query.displayName,
                _json: {
                    realname: req.query.realname
                }
            }
            LoginSuccessHandler(req, res, mainStream);
        });
    }

    //pretty sure this is useless
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });


    //handles users coming and going
    io.on('connection', function(socket) {
        //console.log('Unauthenticated user connected');

        Dispatcher.sendStreamToSocket(initialStream.boxes, socket);

        //sent by client if it detects it has a valid token in it's cookies
        socket.on('login', function(msg) {
            var user = mainStream.users.admitUserIfExists(msg.unique, socket);

            //user will be null if it failed to find the user
            if (user !== null) {
                console.log('User successfully validated');
                //send the boxes of the actual stream
                Dispatcher.sendStream(mainStream.boxes, user);

                //add the socket listeners to the user for all of the current boxes
                mainStream.boxes.forEach(function(box) {
                    box.addResponseListeners(socket, mainStream.users);
                });

                socket.on('disconnect', function() {
                    console.log(user.displayName + ' disconnected');
                    user.socket = null;
                    //mainStream.users.removeUser(user);
                });

            } else {
                console.log('User validation unsuccessful');
            }
        });

        socket.on('disconnect', function() {
            //console.log('Unauthenticated user disconnected');
            //mainStream.users.removeUser(user);
        });
    });

})();