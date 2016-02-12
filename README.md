# Lansite

Lansite is web app made for smaller LAN parties. It is designed to be a simple, central information hub for all attendees.

## About

* Programmed with JavaScript and Bootstrap on the front end and NodeJS with Express, Handlebars, and Passport on the back end.
* Fully modular plugin system that allows easy creation of custom plugins, called "Boxes".
* Uses Steam authentication for ease of access and security.

## Included Boxes
* VoteBox: Give your attendees a choice in what game to play next, what to eat, etc.
* TextBox: Give a quick notice to everyone.
* MatchBox: Allow your attendees to list games they want to play and find players.

## Install
1. Clone this repo however you prefer.
2. Open CMD and run: npm install
3. Make a copy of _template_config.json called config.json
4. Change the settings as you like, and remove the comments.
5. Finally, to open the server, run: node server.js
6. Visit localhost:port in your browser to test.

## Server Console Commands
###NOTE: Box names are case-sensitive.
* add TextBox [text/HTML to display here]
* add VoteBox [each choice separated by a semicolon here]
* add MatchBox
* stop

## Custom Box Creation Instructions
1. Pick a name. This will be case-sensitive across all files. For this example, we'll call ours "FooBox".
2. Copy "Lansite/templates/_TemplateBox.handlebars" and rename it to "FooBox.handlebars". This will the HTML for our box.
3. Make sure to replace all instances of TemplateBox with FooBox and add your code where it says "CUSTOM HTML HERE".
4. Copy "Lansite/public/js/boxes/_TemplateBox.js" and rename it to "FooBox.js". This will be our client-side script.
5. Follow the instructions inside the template to get it setup, and add your code.
6. Copy "Lansite/boxes/_TemplateBox.js" and rename it to "FooBox.js". This will be our server-side script.
7. Follow the instructions inside the template to get it setup, and add your code.
8. You can test your code by running the console command "add FooBox [your arguments here]" in the server console to add the box to all connected clients' streams.

