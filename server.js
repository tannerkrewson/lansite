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

var Config;

try {
    Config = require('./config.js');
} catch (e) {
    console.log('Failed to load config.js');
    console.log('Make sure you copied and rename config.template.js to config.js');
    process.exit(1);
}

var Box = require('./boxes/shared/Box');
var Dispatcher = require('./boxes/shared/Dispatcher');

if (!Config.offlineMode) {
  try {
      //checks to see if the user has changed their Steam API key
      if (Config.steamAPIKey.length !== 32 || Config.steamAPIKey !== Config.steamAPIKey.replace(/\W/g, '')) {
          throw err;
      }
  } catch (e) {
      console.log('Invalid Steam API key');
      console.log('Please add your Steam API key to config.js');
      console.log('or enable offline mode in config.js');
      process.exit(1);
  }
}


//loads boxes from the /boxes directory and preps for making console commands
var BoxObjects = {};
var BoxNames = [];

require("fs").readdirSync(require("path").join(__dirname, "boxes")).forEach(function(file) {
    var fileNameMinusTheDotJS = file.substr(0, file.length - 3);

    //prevent it from loading the template and makes sure the id and filename match (not strictly necessary...)
    if (!fileNameMinusTheDotJS.startsWith('_') && file !== 'shared') {
        var tempObject = require("./boxes/" + file);
        if (tempObject.id === fileNameMinusTheDotJS) {
            var boxName = fileNameMinusTheDotJS.toLowerCase();
            //place each script into the object literal
            BoxObjects[boxName] = require("./boxes/" + file);
            //place each object name in to BoxNames
            BoxNames.push(boxName);
        }
    }
});


//handlebars setup
var hbs = require('express-handlebars').create({
    defaultLayout: 'main'
});
app.engine('handlebars', hbs.engine);
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
app.get('/', exposeTemplates, function(req, res) {
  res.render('home', {
      layout: 'nonstream'
  });
});

app.get('/main', exposeTemplates, function(req, res) {
  res.render('main', {
      layout: 'stream'
  });
});

app.get('/admin', exposeTemplates, function(req, res) {
    res.render('admin', {
        layout: 'stream'
    });
});



//start server
var io = socketio.listen(app.listen(Config.port, function() {
    console.log('Lansite is now running on port ' + Config.port + '. Type "stop" to close.');
}));


// sends the box and popup templates to the page
// TODO: Figure out how to precompile these template, or whatever
function exposeTemplates(req, res, next) {
    hbs.getTemplates('templates/').then(function(templates) {

        // Creates an array of templates which are exposed via
        // `res.locals.templates`.
        var boxes = Object.keys(templates).map(function(name) {
            //if the file doesn't start with and is a box template
            if (!(name.indexOf('/_') > -1) && name.startsWith('boxes/')) {
                return {
                    template: templates[name]()
                };
            } else {
                return null;
            }
        });

        var popups = Object.keys(templates).map(function(name) {
            //if the file doesn't start with and is a popup template
            if (!(name.indexOf('/_') > -1) && name.startsWith('popups/')) {
                return {
                    template: templates[name]()
                };
            } else {
                return null;
            }
        });

        // Exposes the templates during view rendering.
        if (boxes.length) {
            res.locals.boxes = boxes;
        }

        if (popups.length) {
            res.locals.popups = popups;
        }

        setImmediate(next);
    }).catch(next);
}

//
//  OBJECTS
//

function Stream(isBasic) {
    this.boxes = [];
    this.users = new Users();

    //TODO: Maybe do this another way. Not sure.
    if (!isBasic){
        this.requestManager = new RequestManager();
    }
}

Stream.prototype.addBoxAndSend = function(boxToAdd) {
    var boxUnique = this.addBox(boxToAdd);
    this.sendBox(boxUnique);
    return boxUnique;
};

Stream.prototype.addBoxById = function(boxId, data) {
    var boxUnique = this.addBox(new BoxObjects[boxId.toLowerCase()](data));
    return boxUnique;
};

Stream.prototype.addBox = function(boxToAdd) {
    //adds the box to the server-side stream
    this.boxes.push(boxToAdd);
    return boxToAdd.unique;
};

Stream.prototype.sendBox = function(uniqueOfBoxToSend, reqMan) {
    var index = this.getBoxIndexByUnique(uniqueOfBoxToSend);

    //if the boxes exists in this stream
    if (index !== -1){
        var boxToSend = this.boxes[index];
        //add the socket listeners to each user's socket
        if (boxToSend.adminStreamOnly){
            Dispatcher.attachAdminListenersToAllUsers(boxToSend, reqMan);
        } else {
            Dispatcher.attachListenersToAllUsers(boxToSend, this);
        }

        //sends the box to everyone
        Dispatcher.sendNewBoxToAll(boxToSend, this.users);
    } else {
        console.log('Send box failed: Box does not exist in this stream');
    }
};

Stream.prototype.removeBox = function(boxUnique) {
    var index = this.getBoxIndexByUnique(boxUnique);
    if (index > -1) {
        this.boxes.splice(index, 1);
        return true;
    }
    return false;
}

Stream.prototype.clearAll = function() {
    $('#stream').empty();
};

Stream.prototype.listAllBoxes = function() {
    var result = '';
    this.boxes.forEach(function(box) {
        result += box.unique + "\n";
    });
    return result;
};

Stream.prototype.getBoxIndexByUnique = function(boxUnique) {
    for (var i = this.boxes.length - 1; i >= 0; i--) {
        if (this.boxes[i].unique === boxUnique) {
            return i;
        }
    };
    return -1;
}

Stream.prototype.prepNewUser = function(id) {
    var user = this.users.findUser(id)

    //if the user exists in this stream
    if (user !== -1) {
        //send the boxes of the actual stream
        Dispatcher.sendStream(this.boxes, user);

        //add static request listeners for each type of box
        for (var i = BoxNames.length - 1; i >= 0; i--) {
            var box = BoxObjects[BoxNames[i]];
            if (box.addRequestListeners !== undefined){
                box.addRequestListeners(user.socket, this);
            }
        };

        //send the updated user list to all users
        Dispatcher.sendUserListToAll(this.users);
    }
}

Stream.prototype.initializeSteamLogin = function() {

    var self = this;
    var LoginSuccessHandler = function(req, res, stream) {
        //this is ran when the user successfully logs into steam
        var user = req.user;

        var id;
        var secret;
        var username = req.user.displayName;
        var steamId = req.user.id;

        //if the user already exists
        var userAlreadyExists;
        var foundUser = stream.users.findUserBySteamId(steamId);
        if (foundUser) {
            userAlreadyExists = stream.users.checkCredentials(foundUser.id, foundUser.secret);
        } else {
            userAlreadyExists = false;
        }

        if (userAlreadyExists){
            //reuse the old info
            id = foundUser.id;
            secret = foundUser.secret;
            steamId = foundUser.steamId;
        } else {
            //generate the user's id and secret
            id = stream.users.getNextUserId();
            secret = crypto.randomBytes(20).toString('hex');
        }

        //add the user to the stream and await their return
        stream.users.addOrUpdateUserInfo(secret, id, username, steamId);

        //set a cookie that allows the user to know its own id
        res.cookie('id', id, {
            maxAge: 604800000 // Expires in one week
        });

        //set a cookie that will act as the user's login token
        res.cookie('secret', secret, {
            maxAge: 604800000 // Expires in one week
        });

        //redirect to the main stream
        res.redirect('/main');
    };

    passport.use(new SteamStrategy({
            returnURL: Config.url + ":" + Config.port + '/auth/steam/return',
            realm: Config.url  + ":" + Config.port + '/',
            apiKey: Config.steamAPIKey
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
            LoginSuccessHandler(req, res, self);
        });


    //fake steam login for development purposes
    //if developer mode is enabled
    if (Config.developerMode) {
        app.get('/devlogin', function(req, res) {
            // url:port/devlogin?username=NAMEHERE
            req.user = {
                displayName: req.query.username
            };
            LoginSuccessHandler(req, res, self);
        });
    }

    //bypass steam login in case someone can't login to steam
    app.get('/login', function(req, res) {
        // http://localhost:port/login?code=CODEHERE&username=NAMEHERE

        //check to see if the login code is valid
        if (self.users.loginUsingCode(req.query.code)){
            //login successful
            req.user = {
                displayName: req.query.username
            };
            LoginSuccessHandler(req, res, self);
        } else {
            res.send('Login failed');
        }
    });

    //pretty sure this is useless
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

};



function Users() {
    this.list = [];
    this.loginCodes = [];

    //rough user count, used for ids
    this.userCount = 0;
}

Users.prototype.addOrUpdateUserInfo = function(secret, id, username, steamId) {
    //if this user already exists
    var element = this.checkCredentials(id, secret);
    if (element) {
        //update their info
        element.username = username;
        element.steamId = steamId;

        //should already be null, just precautionary
        element.socket = null;
        return element;
    }

    //ran if the user does not already exist
    var tempUser = new User(id, secret, username, steamId);
    this.list.push(tempUser);
    return tempUser;
}

Users.prototype.connectUser = function(id, secret, socket) {
    var user = this.checkCredentials(id, secret);
    if (user) {
        //user found and verified, update their info.
        user.socket = socket;
        return user;
    }

    //user not found
    return false;
}

Users.prototype.findUser = function(id) {
  for (element of this.list) {
      if (element.id === parseInt(id)) {
          return element;
      }
  }
  return false;
}

Users.prototype.findUserBySteamId = function(steamId) {
  for (element of this.list) {
      if (element.steamId === steamId) {
          return element;
      }
  }
  return false;
}

Users.prototype.checkCredentials = function(id, secret) {
  var user = this.findUser(id);
  //if the user exists and the secret is correct
  if (user && element.secret === secret) {
    return user;
  }

  //otherwise
  return false;
}

Users.prototype.checkIfUserIsOP = function(id) {
    var user = this.findUser(id);
    if (user){
      return user.isOp;
    }
    return false;
}

Users.prototype.removeUser = function(userToRemove) {
    var indexToRemove = this.list.indexOf(userToRemove);
    if (indexToRemove > -1) {
        this.list.splice(indexToRemove, 1);
    }
}

Users.prototype.getAllUsers = function() {
  return this.list;
}

Users.prototype.getOnlineUsers = function() {
    var result = [];
    this.list.forEach(function(user) {
        if (user.isOnline()) {
            result.push(user);
        }
    });
    return result;
}

Users.prototype.getOnlineOppedUsers = function() {
    var result = [];
    this.list.forEach(function(user) {
        if (user.isOnline() && user.isOP) {
            result.push(user);
        }
    });
    return result;
}

Users.prototype.generateLoginCode = function() {

    //length of the login code
    const codeLength = 5;

    function makeid()
    {
        var text = "";
        var possible = "abcdefghijklmnopqrstuvwxyz";

        for( var i=0; i < codeLength; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    var code;
    do {
        code = makeid();
    }
    while (this.loginCodeIndex(code) !== -1);

    this.loginCodes.push(code);
    return code;
}

Users.prototype.loginUsingCode = function(code) {
    var index = this.loginCodeIndex(code);
    if (index !== -1) {
        //remove the code from the array
        //  so it cannot be used twice
        this.loginCodes.splice(index, 1);

        //login validated
        return true;
    }
    //code doesn't match
    return false;
}

Users.prototype.loginCodeIndex = function(code) {
    for (var i = this.loginCodes.length - 1; i >= 0; i--) {
        if (this.loginCodes[i] === code) {
            return i;
        }
    };
    return -1;
}

Users.prototype.getNextUserId = function() {
  this.userCount++;
  return this.userCount;
}



function User(id, secret, username, steamId) {
    this.socket = null;
    this.isOp = false;

    this.id = id;
    this.secret = secret;
    this.username = username;
    this.steamId = steamId; //should be null if not a steam account
}

User.prototype.isOnline = function() {
    return this.socket !== null;
}

User.prototype.op = function() {
    this.isOp = true;
}

User.prototype.deop = function() {
    this.isOp = false;
}



function Console() {}

Console.addListeners = function(stream) {
    var stdin = process.openStdin();
    stdin.addListener("data", function(d) {
        //string of what was entered into the console
        var line = d.toString().trim();

        //automatic add commands
        if (line.toLowerCase().startsWith('add ')) {
            var lineArr = line.split(' ');
            var boxName = lineArr[1].toLowerCase();
            if (boxName in BoxObjects && !BoxObjects[boxName].excludeFromConsole) {
                var lengthBeforeData = lineArr[0].length + lineArr[1].length + 2;
                var data = {
                    isConsole: true,
                    line: line.substr(lengthBeforeData, line.length)
                }
                stream.addBoxAndSend(new BoxObjects[boxName](data));
            }
        }
        //static commands
        else if (line.toLowerCase() === "help") {
          console.log('');
          console.log('Lansite Command List:');
          console.log('');

          var commandList = [];

          //add commands
          BoxNames.forEach(function(boxName) {
            if (!BoxObjects[boxName].excludeFromConsole) {
              commandList.push('add ' + boxName);
            }
          });

          commandList.push('help');
          commandList.push('view codes');
          commandList.push('view users');
          commandList.push('view boxes');
          commandList.push('view requests');
          commandList.push('stop');
          commandList.push('generatelogincode');

          commandList.sort();

          commandList.forEach(function(cmd) {
            console.log(cmd);
          });
          console.log('');
          console.log('Check the readme for more information on the function of each command.');
          console.log('');

        }
        else if (line.toLowerCase().startsWith("view ")) {
          var cmd = line.substring(5).toLowerCase();
          if (cmd === "codes") {
              console.log(stream.users.loginCodes);
          } else if (cmd === "users") {
              console.log(stream.users.getAllUsers());
          } else if (cmd === "boxes") {
              console.log(stream.listAllBoxes());
          } else if (cmd === "requests") {
              console.log(stream.requestManager.getRequests());
          } else {
            console.log('Invalid view command. Type "help" for a list of commands.');
          }
        }
        else if (line.toLowerCase() === "stop") {
            process.exit();
        }
        else if (line.toLowerCase() === "generatelogincode") {
            console.log('');
            console.log('One-time use code:')
            var loginCode = stream.users.generateLoginCode();
            console.log(loginCode);
            console.log('');
            console.log('Example usage:');
            console.log('http://localhost:port/login?code=' + loginCode + '&username=NAMEHERE');
            console.log('');
        }
        else {
          console.log('');
          console.log('Invalid command. Type "help" for a list of commands.');
          console.log('');
        }
    });
}



function RequestManager() {
    this.requestList = [];
    this.adminStream = new Stream(true);
    this.adminStream.addBox(new BoxObjects['textbox']({
        text: 'User requests will appear on this page, and you will be able to accept or deny them. Please note,'
        + ' users can only have one request open at once, and if they make a new request, their old request will be replaced.',
        title: 'Welcome to the Admin Stream'
    }));
}

RequestManager.prototype.addRequest = function(userThatMadeRequest, requestString, acceptFunction, denyFunction){
    //if the user is op, accept the request, no questions asked
    if (userThatMadeRequest.isOp) {
        //I bypass adding the request and using the handler here
        //  the true tells the function to supress the usual popup
        //  that users receive when their popup is accepted
        acceptFunction(true);
        return;
    }

    //since users can only have one request open at a time
    //check to see if they have a request open already
    var prevReq = this.userHasOpenRequest(userThatMadeRequest.id);
    if (prevReq) {
        //deny their open request
        this.handleRequest(prevReq, false);
    }

    //create a request box on the admin stream
    var boxsUnique = this.adminStream.addBox(new BoxObjects['requestbox']({
        text: userThatMadeRequest.username + ' ' + requestString,
    }));
    this.adminStream.sendBox(boxsUnique, this);

    //then we create the request in this manager
    this.requestList.push(new Request(userThatMadeRequest, requestString, boxsUnique, acceptFunction, denyFunction));
}

RequestManager.prototype.getRequests = function(){
    return this.requestList;
}

RequestManager.prototype.handleRequest = function(requestUnique, wasAccepted){
    var request = this.getRequestIfExists(requestUnique);
    if (request !== null) {
        if (wasAccepted){
            request.acceptRequest();
        } else {
            request.denyRequest();
        }
    this.removeRequest(requestUnique);
    };
}

RequestManager.prototype.removeRequest = function(requestUnique){
    var requestIndex = this.getIndexByUnique(requestUnique);
    //if request exists
    if (requestIndex !== -1) {
        //remove the request from the array
        this.requestList.splice(requestIndex, 1);
        //remove this box since we're done with it
        this.adminStream.removeBox(requestUnique);
        //send the new adminStream with removed box
        Dispatcher.sendStreamToAll(this.adminStream.boxes, this.adminStream.users);
        return true;
    } else {
        return false;
    };
}

RequestManager.prototype.getRequestIfExists = function(requestUnique) {
    var requestIndex = this.getIndexByUnique(requestUnique);

    //if request exists
    if (requestIndex !== -1) {
        return this.requestList[requestIndex];
    } else {
        return null;
    };

}

RequestManager.prototype.getIndexByUnique = function(requestUnique) {
    for (var i = this.requestList.length - 1; i >= 0; i--) {
        if (this.requestList[i].unique === requestUnique) {
            return i;
        };
    };
    return -1;
}

RequestManager.prototype.userHasOpenRequest = function(id) {
    for (var i = this.requestList.length - 1; i >= 0; i--) {
        if (this.requestList[i].user.id === id) {
            return this.requestList[i].unique;
        };
    };
    return false;
}



function Request(userThatMadeRequest, requestString, boxsUnique, acceptFunction, denyFunction) {
    this.unique = boxsUnique;

    this.requestText = requestString.trim();
    this.user = userThatMadeRequest;
    this.acceptFunction = acceptFunction;
    this.denyFunction = denyFunction;

    this.boxsUnique = boxsUnique;
}

Request.prototype.acceptRequest = function(supressPopup){
    this.acceptFunction(this.user);

    //notify the user that their request was accepted if this
    //  is not an admin's automatically accepted request
    if (!supressPopup) {
        this.user.socket.emit('requestAccepted', this.user.username + ' ' + this.requestText);
    }
}

Request.prototype.denyRequest = function(){
    this.denyFunction(this.user);

    //notify the user that their request was denied
    this.user.socket.emit('requestDenied', this.user.username + ' ' + this.requestText);
}



//
//  MAIN CODE
//

var mainStream = new Stream(false);
mainStream.addBox(new BoxObjects['matchbox']());
Console.addListeners(mainStream);
mainStream.initializeSteamLogin();

//handles users coming and going
io.on('connection', function(socket) {

    //sent by client if it detects it has a valid token in it's cookies
    socket.on('login', function(msg) {
        var user = mainStream.users.connectUser(msg.id, msg.secret, socket);

        if (user) {
            console.log('User successfully validated');

            //check to see if we should set the user to OP
            if (Config.autoOPFirstUser && mainStream.users.list.length === 1) {
                user.op();
            }

            mainStream.prepNewUser(user.id);

            //add the socket listeners to the user for all of the current boxes
            for (var i = mainStream.boxes.length - 1; i >= 0; i--) {
                Dispatcher.attachListenersToUser(user, mainStream.boxes[i], mainStream);
            };

            socket.on('disconnect', function() {
                console.log(user.username + ' disconnected');
                user.socket = null;
                //mainStream.users.removeUser(user);

                //send the updated user list to all users
                Dispatcher.sendUserListToAll(mainStream.users);
            });

        } else {
            console.log('User validation unsuccessful');

            //send them back to the homepage to try again
            socket.emit('failed');
        }
    });

    socket.on('adminStreamLogin', function(msg) {
        //check to see if the user exists in the main stream and is admin
        var user = mainStream.users.checkCredentials(msg.id, msg.secret);
        if (user.isOp){
            console.log(user.username + ' has logged in as admin');
            var adminStream = mainStream.requestManager.adminStream;

            var adminUser = adminStream.users.addOrUpdateUserInfo(user.secret, user.id, user.displayName, user.steamId);
            adminUser = adminStream.users.connectUser(adminUser.id, adminUser.secret, socket);
            adminStream.prepNewUser(adminUser.id);

            //add the socket listeners to the user for all of the current boxes
            for (var i = adminStream.boxes.length - 1; i >= 0; i--) {
                Dispatcher.attachAdminListenersToUser(adminUser, adminStream.boxes[i], mainStream.requestManager);
            };

        } else {
            console.log(user.username + ' failed to log in as admin');
        }


    });

    socket.on('areWeOP', function(msg) {
        if (mainStream.users.checkIfUserIsOP(msg.id)){
            socket.emit('areWeOP', true);
        } else {
            socket.emit('areWeOP', false);
        }
    });

    socket.on('disconnect', function() {
        //console.log('Unauthenticated user disconnected');
        //mainStream.users.removeUser(user);
    });
});
