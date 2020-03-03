const {FontStyle} = require('./fontStyle');

class Font {
    constructor(name, type = FontStyle.NORMAL, size = 15) {
        this.name = name;
        this.type = type;
        this.size = size;
    }

    getType() {
        return String(this.type);
    }

    withStyle(s) {
        return new Font(this.name, s,  this.size)
    }

    withSize(s) {
        return new Font(this.name, s,  this.size)
    }

    withConfig(style, size = this.size) {
        return new Font(this.name, style,  size)
    }

    toString() {
        return `${this.getType()} ${this.size}px ${this.name}`;
    }
}

Font.HELVETICA = new Font('Helvetica')
Font.TIMES_ROMAN = new Font('TimesRoman')

module.exports = Font;
