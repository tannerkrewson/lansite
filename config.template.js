//
//  Lansite Config
//  By Tanner Krewson
//

var Config = {};

//Web Address: Specify the URL that the server will append to redirects
Config.url = 'http://localhost';

//Port: Specify the port in which the server will run off
Config.port = 3000;

//Offline Mode: For LANs that have no Internet
Config.offlineMode = false;

//Steam API Key: Grab one for yourself here: http://steamcommunity.com/dev/apikey
Config.steamAPIKey = 'YOUR API KEY HERE';

//Auto OP First User: Make the first user that logs into Lansite an admin
Config.autoOPFirstUser = true;

//Developer Mode: Enables features that are insecure to run in a production situation
Config.developerMode = false;

//Private Messaging: enable or disable private messaging between users
Config.privateMessaging = true;

//Connect 4 URL: If you would prefer to host it yourself, https://github.com/tannerkrewson/connect4lansite
Config.connectFourUrl = 'https://kevinshannon.dev/connect4/';

//Automatically accept all posts
Config.allowAllPosts = false;

module.exports = Config;
