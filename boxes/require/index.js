//
//  Lansite Box
//  By Tanner Krewson
//

var crypto = require('crypto');

function Box(templateID) {
	this.id = templateID;
	this.unique = crypto.randomBytes(20).toString('hex');
}

module.exports = Box;
