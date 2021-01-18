let StyleList = {
	NORMAL: 'normal',
	BOLD: 'bold',
	ITALIC: 'italic',
};

let Font = (function(name = 'Times', style = StyleList.NORMAL, size = 15) {
	return {
		clone(props) {
			let st = props.style || style;
			if (!StyleList[st.toUpperCase()])
				st = StyleList.NORMAL;
			let sz = props.size || size;
			return new Font(name, st, sz);
		},
		withStyle(s) {
			return this.clone({style});
		},
		withSize(s) {
			// return new Font(name, style, size);
			return this.clone({size});
		},
		withConfig(st, sz) {
			// return new Font(name, st || style, sz || size);
			return this.clone({style: st || style, size: sz || size});
		},
		bold(sz) {
			return this.clone({style: StyleList.BOLD, size: sz || size});
		},
		italic(sz) {
			return this.clone({style: StyleList.ITALIC, size: sz || size});
		},
		regular(sz) {
			return this.clone({style: StyleList.NORMAL, size: sz || size});
		},
		toString() {
			return `${style} ${size}px ${name}`;
		},
		get string() {
			return this.toString();
		},
		name,
		style,
		size,
	};
});
const FontList = {
	SANS: new Font("Sans"),
	SERIF: new Font("Serif"),
	SANSERIF: new Font("Sans-Serif"),
	HELVETICA: new Font("Helvetica"),
	ARIAL: new Font("Arial"),
	TIMES: new Font("Times"),
	TIMES_ROMAN: new Font("TimesRoman"),
};

for (let k of Object.keys(StyleList))
	Font[`STYLE_${k}`] = StyleList[k];

for (let k of Object.keys(FontList))
	Font[k] = FontList[k];

module.exports = Font;
