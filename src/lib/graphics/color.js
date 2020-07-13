class Color {
	static fromLong(color = 0xFF<<24) {
		return new Color((color >> 16) & 0xFF, (color >> 8) & 0xFF, color & 0xFF, 0xFF);
	}

	/* end of static type members */

	constructor (r,g,b,a=0xFF) {
		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
	}

	toCanvasStyle() {
		return `rgba(${this.r},${this.g}, ${this.b}, ${this.a})`;
	}

	toString() {
		return this.toCanvasStyle();
	}

	// Drops alpha, returns RBG
	toRGB() {
		return (this.r << 16) | (this.g << 8) | (this.b & 0xFF);
	}

	// Returns RGBA
	toRGBA() {
		return this.toRGB() << 8 | (this.a & 0xFF);
	}

	toABGR() {
		return (this.a << 24) | this.toBGR();
	}

	toBGR() {
		return (this.b << 16) | (this.g << 8) | (this.r & 0xFF);
	}
}

Object.defineProperty(Color, 'blue', {
	get:() => {
		return Color.fromLong(0x0000FF);
	},
	set:undefined,
});

Object.defineProperty(Color, 'BLUE', {
	get:() => {
		return Color.fromLong(0x0000FF);
	},
	set:undefined,
});

Object.defineProperty(Color, 'green', {
	get:() => {
		return Color.fromLong(0x00FF00);
	},
	set:undefined,
});

Object.defineProperty(Color, 'GREEN', {
	get:() => {
		return Color.fromLong(0x00FF00);
	},
	set:undefined,
});

Object.defineProperty(Color, 'red', {
	get:() => {
		return Color.fromLong(0xFF0000);
	},
	set:undefined,
});

Object.defineProperty(Color, 'RED', {
	get:() => {
		return Color.fromLong(0xFF0000);
	},
	set:undefined,
});

Object.defineProperty(Color, 'pink', {
	get:() => {
		return Color.fromLong(0xFFAFAF);
	},
	set:undefined,
});

Object.defineProperty(Color, 'PINK', {
	get:() => {
		return Color.fromLong(0xFFAFAF);
	},
	set:undefined,
});
Object.defineProperty(Color, 'LIGHT_GRAY', {
	get:() => {
		return Color.fromLong(0xC0C0C0);
	},
	set:undefined,
});

Object.defineProperty(Color, 'lightGray', {
	get:() => {
		return Color.fromLong(0xC0C0C0);
	},
	set:undefined,
});

Object.defineProperty(Color, 'SILVER', {
	get:() => {
		return Color.fromLong(0xC6C6C6);
	},
	set:undefined,
});

Object.defineProperty(Color, 'silver', {
	get:() => {
		return Color.fromLong(0xC6C6C6);
	},
	set:undefined,
});

Object.defineProperty(Color, 'SHADOW_GRAY', {
	get:() => {
		return Color.fromLong(0x848484);
	},
	set:undefined,
});

Object.defineProperty(Color, 'shadowGray', {
	get:() => {
		return Color.fromLong(0x848484);
	},
	set:undefined,
});


Object.defineProperty(Color, 'GRAY', {
	get:() => {
		return Color.fromLong(0x808080);
	},
	set:undefined,
});

Object.defineProperty(Color, 'gray', {
	get:() => {
		return Color.fromLong(0x808080);
	},
	set:undefined,
});

Object.defineProperty(Color, 'DARK_GRAY', {
	get:() => {
		return Color.fromLong(0x404040);
	},
	set:undefined,
});

Object.defineProperty(Color, 'darkGray', {
	get:() => {
		return Color.fromLong(0x404040);
	},
	set:undefined,
});

Object.defineProperty(Color, 'CYAN', {
	get:() => {
		return Color.fromLong(0x00FFFF);
	},
	set:undefined,
});

Object.defineProperty(Color, 'cyan', {
	get:() => {
		return Color.fromLong(0x00FFFF);
	},
	set:undefined,
});

Object.defineProperty(Color, 'magenta', {
	get:() => {
		return Color.fromLong(0xFF00FF);
	},
	set:undefined,
});

Object.defineProperty(Color, 'MAGENTA', {
	get:() => {
		return Color.fromLong(0xFF00FF);
	},
	set:undefined,
});

Object.defineProperty(Color, 'YELLOW', {
	get:() => {
		return Color.fromLong(0xFFFF00);
	},
	set:undefined,
});

Object.defineProperty(Color, 'yellow', {
	get:() => {
		return Color.fromLong(0xFFFF00);
	},
	set:undefined,
});

Object.defineProperty(Color, 'orange', {
	get:() => {
		return Color.fromLong(0xFFC800);
	},
	set:undefined,
});

Object.defineProperty(Color, 'ORANGE', {
	get:() => {
		return Color.fromLong(0xFFC800);
	},
	set:undefined,
});

Object.defineProperty(Color, 'black', {
	get:() => {
		return Color.fromLong(0x0);
	},
	set:undefined,
});

Object.defineProperty(Color, 'BLACK', {
	get:() => {
		return Color.fromLong(0x0);
	},
	set:undefined,
});

Object.defineProperty(Color, 'white', {
	get:() => {
		return Color.fromLong(0xFFFFFF);
	},
	set:undefined,
});

Object.defineProperty(Color, 'WHITE', {
	get:() => {
		return Color.fromLong(0xFFFFFF);
	},
	set:undefined,
});

export { Color as default };
