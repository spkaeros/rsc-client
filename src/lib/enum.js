export default class Enum {
	constructor(name) {
		this.name = name;
		this.ordinal = Enum.id++;
	}
	
	toNumber() {
		return this.ordinal;
	}
	
	toString() {
		return this.name;
	}
}

Object.defineProperty(Enum, "id", {
	get: () => {
		return Enum._id;
	},
	set: (i) => {
		Enum._id = i;
	},
});
