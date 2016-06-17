# Lansite

Lansite is web app made for smaller LAN parties. It is designed to be a simple, central information hub for all attendees.

![](https://cdn.pbrd.co/images/1BO4o3dm.png)![](https://cdn.pbrd.co/images/1BO5ubtv.png)

## Features

####For the Attendees:
* Uses Steam accounts to login, so no registration required
* Attendees can read messages, vote in polls, and find people to play games with
* Find the Steam profiles of other attendees using the sidebar
* Request to post messages or votes using the buttons in the sidebar

####For the Admins:
* Easy to install, configure and launch
* Requests from the attendees can be approved or denied from the Admin Stream to prevent spam
* Add messages or votes easily using the buttons in the sidebar
* If someone doesn't have a Steam account, or your LAN does not have internet, you can create one-time use login codes to give to each attendee

####For programmers:
* Programmed with JavaScript and Bootstrap on the front end and NodeJS with Express, Socket.io, Handlebars, and Passport on the back end
* Fully modular plugin system that allows easy creation of custom plugins, called "Boxes"

## Install
1. Clone this repo however you prefer. If you prefer more stability, clone from the [latest release](https://github.com/tannerkrewson/Lansite/releases).
2. Make sure you have [Node.js](https://nodejs.org/) installed on your system.
2. Open CMD and run: `npm install`
3. Make a copy of _template_config.json called config.json
4. Change the settings as you like, and remove the comments.
5. Finally, to open the server, run: `npm start`
6. Visit localhost:port in your browser to test.

## Config
* Web Address (string): url server will append to redirects.
* Port (int): Port in which the server will run off.
* Developer Mode (boolean): Enables features that may be insecure to run in a production situation.
  Features:
  * Non-Steam accounts for testing: When dev mode is enabled, just enter a username with no code on the login page.
  * More console messages
* Steam API Key (string): Required. Grab one for yourself [here](http://steamcommunity.com/dev/apikey).
* Auto OP First User (boolean): Make the first user that logs into Lansite the admin

## Server Console Commands
* `help`: View a list of commands
* `stop`: Exit the server. Please note that all data is deleted once the server is closed. Users will have to relogin once restarted.
* `add matchbox`
* `add textbox [title];[text/HTML to display here]`
* `add votebox [question];[choice1];[choice2];[choice3]...`
* `generatelogincode`: Generates a code that can be used by users to login. This maybe helpful if, for example, someone does not have a Steam account, or your LAN does not have internet.
* `view boxes`: View all of the boxes in the stream.
* `view codes`: View all of the active login codes generated using the `generatelogincode` command. Codes are one-time use, and will be removed from this list after usage.
* `view requests`: View all of open requests. These are also displayed in the admin stream.
* `view users`: View all users.

## Included Boxes
* VoteBox: Give your attendees a choice in what game to play next, what to eat, etc.
* TextBox: Give a quick notice to everyone.
* MatchBox: Allow your attendees to list games they want to play and find players.

## Custom Box Creation Instructions
1. Pick a name. This will be case-sensitive across all files. For this example, we'll call ours `FooBox`.
2. Copy `Lansite/templates/_TemplateBox.handlebars` and rename it to `FooBox.handlebars`. This will the HTML for our box.
3. Make sure to replace all instances of TemplateBox with FooBox and add your code where it says `CUSTOM HTML HERE`.
4. Copy `Lansite/public/js/boxes/_TemplateBox.js` and rename it to `FooBox.js`. This will be our client-side script.
5. Follow the instructions inside the template to get it setup, and add your code.
6. Copy `Lansite/boxes/_TemplateBox.js` and rename it to `FooBox.js`. This will be our server-side script.
7. Follow the instructions inside the template to get it setup, and add your code.
8. You can test your code by running the console command `add FooBox [your arguments here]` in the server console to add the box to all connected clients' streams.
