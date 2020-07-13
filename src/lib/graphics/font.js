import Enum from '../enum';

class FontStyle extends Enum {
	constructor(s) {
		super(s);
	}
}

Object.defineProperty(FontStyle, 'NORMAL', {
	get:() => {
		return new FontStyle('normal');
	},
	set:void 0,
});

Object.defineProperty(FontStyle, 'BOLD', {
	get:() => {
		return new FontStyle('bold');
	},
	set:void 0,
});

Object.defineProperty(FontStyle, 'ITALIC', {
	get:() => {
		return new FontStyle('italic');
	},
	set:void 0,
});

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

	bold(size = this.size) {
		return new Font(this.name, FontStyle.BOLD, size);
	}

	italic(size = this.size) {
		return new Font(this.name, FontStyle.ITALIC, size);
	}

	regular(size = this.size) {
		return new Font(this.name, FontStyle.NORMAL, size);
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

Object.defineProperty(Font, 'TIMES', {
	get:() => {
		return new Font('Times');
	},
	set:void 0,
});

Object.defineProperty(Font, 'TIMES_ROMAN', {
	get:() => {
		return new Font('TimesRoman');
	},
	set:void 0,
});

Object.defineProperty(Font, 'HELVETICA', {
	get:() => {
		return new Font('Helvetica');
	},
	set:void 0,
});

Object.defineProperty(Font, 'ARIAL', {
	get:() => {
		return new Font('Arial');
	},
	set:void 0,
});

Object.defineProperty(Font, 'SANS', {
	get:() => {
		return new Font('Sans');
	},
	set:void 0,
});

Object.defineProperty(Font, 'SERIF', {
	get:() => {
		return new Font('Serif');
	},
	set:void 0,
});
Object.defineProperty(Font, 'SANSERIF', {
	get:() => {
		return new Font('Sans-Serif');
	},
	set:void 0,
});

export { Font as default };
