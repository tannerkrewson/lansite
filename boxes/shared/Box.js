//
//  Lansite Server Box
//  By Tanner Krewson
//

var crypto = require('crypto');

function Box() {
	this.unique = crypto.randomBytes(20).toString('hex');
}

Box.id = "EmptyBox";

module.exports = Box;