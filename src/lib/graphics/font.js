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

Font.TIMES = new Font('Times')
Font.TIMES_ROMAN = new Font('TimesRoman')
Font.SANS = new Font('Sans')
Font.SERIF = new Font('Serif')
Font.SANSERIF = new Font('Sans-Serif')
Font.ARIAL = new Font('Arial')
Font.HELVETICA = new Font('Helvetica')

module.exports = Font;
