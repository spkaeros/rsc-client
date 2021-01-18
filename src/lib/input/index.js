module.exports.Keyboard = require("./keyboard");
module.exports.Mouse = require("./mouse");
module.exports.Ignore = (e => {
	e.preventDefault();
});
