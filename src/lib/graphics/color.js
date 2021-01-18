
function Color(r,g,b,a=0xFF) {
	return {
		r: r,
		g: g,
		b: b,
		a: a,
		get number() {
			return (r << 0x10) | (g << 0x8) | b;
		},	
		get string() {
			return `rgba(${r},${g},${b},${a})`;
		},
		toString() {
			return this.string;
		},
		toNumber() {
			return this.number;
		},
	};
};

function fromNumber(n) {
	return new Color(n >>> 0x10 & 0xFF, n >>> 0x8 & 0xFF, n & 0xFF, 0xFF);
}

function random() {
	return new Color(Math.random() * 0x100 >>> 0, Math.random() * 0x100 >>> 0, Math.random() * 0x100 >>> 0, 0xFF)
}

var colors = {
	'blue': 0xFF, 'green': 0xFF00, 'red': 0xFF0000, 'pink': 0xFFAFAF, 'light_gray': 0xC0C0C0,
	'silver': 0xC6C6C6, 'gray': 0x808080, 'shadow_gray': 0x848484, 'dark_gray': 0x404040,
	'cyan': 0x00FFFF, 'magenta': 0xFF00FF, 'yellow': 0xFFFF00, 'orange': 0xFFC800, 'black':0x0,
	'white': 0xFFFFFF, 'light_red': 0xFF9040, 'dark_red': 0xC00000, 'auburn': 0xFFB000,
	'dark_orange': 0xFF7000, 'darker_orange':0xFF8000, 'scarlet': 0xFF3000, 'yellow_green': 0xC0FF00,
	'lime_green': 0x80ff00,'chartreuse': 0x40ff00, 'golden_yellow': 0xFFE000, 'lime_green': 0xA0E000,
	'medium_green': 0x8000, 'bright_green': 0xE000, 'aqua_marine': 0x00A080, 'sky_blue': 0x0080FF,
	'ocean_blue': 0x0080FF, 'deep_blue': 0x0030F0, 'deep_magenta': 0xE000E0, 'shadow_black': 0x303030,
	'light_brown': 0x604000, 'dark_brown': 0x805000, 'tan': 0x906020, 'butter_rum': 0x997326,
	'marigold': 0xB38C40, 'flesh': 0xCCB366, 'pale_white': 0xECDED0, 'medium_blue': 0x0000C0,
	'panelbg_active': 0xDCDCDC, 'panelbg_inactive': 0xA0A0A0,
};
for (var colorName in colors) {
	Color[colorName] = Color[colorName.toUpperCase()] = fromNumber(colors[colorName]);
}

module.exports = Color;
module.exports.fromNumber = fromNumber;
module.exports.random = random;
