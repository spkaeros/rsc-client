global.id = 0;

function generator(name = 'aEnum') {
	return {
		number: global.id++,
		name: name,
		toString() {
			return name;
		}
	};
}

module.exports = generator;

// class Enum {
	// constructor(name) {
		// this.name = name;
		// this.ordinal = Enum.id++;
	// }
	// 
	// get number() {
		// return this.ordinal;
	// }
	// 
	// toString() {
		// return this.name;
	// }
// }
// 
// Object.defineProperty(Enum, "id", {
	// get: () => {
		// return Enum._id;
	// },
	// set: (i) => {
		// Enum._id = i;
	// },
// });
// 
// module.exports = Enum;
