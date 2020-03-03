const {Enum} = require('../enum');

class FontStyle extends Enum {  }

FontStyle.NORMAL = new FontStyle('normal');
FontStyle.BOLD = new FontStyle('bold');
FontStyle.ITALIC = new FontStyle('italic');

module.exports = {FontStyle}
