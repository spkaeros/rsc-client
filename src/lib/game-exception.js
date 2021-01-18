class GameException extends Error {
	constructor(err = Error("Problem occurred:N/A"), fatal = false) {
		super();
		console.error(err.message, err.stack);
	}
};

if (Object.setPrototypeOf)
	Object.setPrototypeOf(GameException.prototype, Error);
else
	GameException.__prototype = Error.prototype;

module.exports = GameException;
