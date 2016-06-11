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

####For programmers:
* Programmed with JavaScript and Bootstrap on the front end and NodeJS with Express, Socket.io, Handlebars, and Passport on the back end
* Fully modular plugin system that allows easy creation of custom plugins, called "Boxes"

## Install
1. Clone this repo however you prefer.
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
  * Non-Steam accounts for testing: Go to url:port/devlogin?id=IDHERE&displayName=DNAMEHERE to login to a test account
  * More console messages
* Steam API Key (string): Required. Grab one for yourself here: http://steamcommunity.com/dev/apikey
* Auto OP First User (boolean): Make the first user that logs into Lansite the admin

## Server Console Commands
* add TextBox [title];[text/HTML to display here]
* add VoteBox question;choice1;choice2;choice3...
* add MatchBox
* stop

####NOTE: Box names are case-sensitive.

## Included Boxes
* VoteBox: Give your attendees a choice in what game to play next, what to eat, etc.
* TextBox: Give a quick notice to everyone.
* MatchBox: Allow your attendees to list games they want to play and find players.

## Custom Box Creation Instructions
1. Pick a name. This will be case-sensitive across all files. For this example, we'll call ours "FooBox".
2. Copy "Lansite/templates/_TemplateBox.handlebars" and rename it to "FooBox.handlebars". This will the HTML for our box.
3. Make sure to replace all instances of TemplateBox with FooBox and add your code where it says "CUSTOM HTML HERE".
4. Copy "Lansite/public/js/boxes/_TemplateBox.js" and rename it to "FooBox.js". This will be our client-side script.
5. Follow the instructions inside the template to get it setup, and add your code.
6. Copy "Lansite/boxes/_TemplateBox.js" and rename it to "FooBox.js". This will be our server-side script.
7. Follow the instructions inside the template to get it setup, and add your code.
8. You can test your code by running the console command "add FooBox [your arguments here]" in the server console to add the box to all connected clients' streams.
