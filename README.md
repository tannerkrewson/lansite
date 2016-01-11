# Lansite

Lansite is web app made for smaller LAN parties. It is designed to be a simple, central information hub for all attendees.

## About:

* Programmed with JavaScript and Bootstrap on the front end and NodeJS with Express and Handlebars on the back end.
* Fully modular plugin system that allows easy creation of custom plugins, called "Boxes".

## Included Boxes: 
* VoteBox: Give your attendees a choice in what game to play next, what to eat, etc.
* TextBox: Give a quick notice to everyone.

## Install:
1. Clone this repo however you prefer.
2. Open CMD and run: npm install
3. Finally, to open the server, run: node server.js
4. Visit localhost:3000 in your browser to test.

## Server Console Commands:
###NOTE: Box names are case-sensitive.
* add TextBox [text to display here]
* add VoteBox [each choice separated by a space here]
* stop

## Custom Box Creation Instructions:
1. Pick a name. This will be case-sensitive across all files. For this example, we'll call ours "FooBox".
2. Open "Lansite/views/partials/CustomBoxTemplates.handlebars".
3. Copy the HTML inside of the comment and paste it below the comment. This will be our box's HTML interface.
4. Make sure to replace all instances of TemplateBox with FooBox and add your code where it says "CUSTOM HTML HERE".
5. Copy "Lansite/public/js/boxes/_TemplateBox.js" and rename it to "FooBox.js". This will be our client-side script.
6. Follow the instructions inside the template to get it setup, and add your code.
7. Copy "Lansite/boxes/_TemplateBox.js" and rename it to "FooBox.js". This will be our server-side script.
8. Follow the instructions inside the template to get it setup, and add your code.
9. You can test your code by running the console command "add FooBox [your arguments here]" in the server console to add the box to all connected clients' streams.

