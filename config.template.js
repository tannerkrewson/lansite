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


module.exports = Config;
