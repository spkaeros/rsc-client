class GameException extends Error {
	constructor(message, isFatal = false) {
		super(message);
		console.error(message);
	}
}

module.exports.GameException = GameException
