//
//  Lansite Client TextBox
//  By Tanner Krewson
//

BoxNames.push('TextBox');

TextBox.prototype = Object.create(Box.prototype);

function TextBox(data) {
    Box.call(this, data.id, data.unique);
    this.text = data.text;
}

//@Override
TextBox.prototype.update = function() {
    //jquery to set the text
    $('#' + this.unique).find('.message').html(this.text);
}

TextBox.prototype.changeText = function(text) {
    this.text = text;
}
