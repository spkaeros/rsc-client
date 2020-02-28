const {Enum} = require('../enum');

class FontStyle extends Enum {}

FontStyle.NORMAL = new FontStyle('normal')
FontStyle.BOLD = new FontStyle('bold')
FontStyle.ITALIC = new FontStyle('italic')

class Font {
    constructor(name, type = FontStyle.NORMAL, size) {
        this.name = name;
        this.type = type;
        this.size = size;
    }
    
    getType() {
        return String(this.type);
    }
    
    toString() {
        return `${this.getType()} ${this.size}px ${this.name}`;
    }
}

module.exports = Font;
