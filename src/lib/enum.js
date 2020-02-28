let count = 0;

class Enum {
	constructor(name) {
		this.name = name;
		this.ordinal = count++;
	}
	
	toNumber() {
		return this.ordinal;
	}
	
	toString() {
		return this.name;
	}
}

module.exports = {Enum};
