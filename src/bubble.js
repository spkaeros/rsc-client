import Timer from './timer';

class Bubble extends Timer {
	constructor(id = 0) {
		super(200);
		this.id = id;
	}

	get x() {
		return this._x;
	}

	set x(i) {
		this._x = i
	}

	get y() {
		return this._y;
	}

	set y(i) {
		this._y = i
	}
	
	set scale(s) {
		this._scale = s;
	}

	get scale() {
		return this._scale;
	}
}
export { Bubble as default };
