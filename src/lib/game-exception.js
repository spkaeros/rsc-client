class GameException extends Error {
	constructor(err = Error("Problem occurred:N/A"), fatal = false) {
		super();
		console.error(err.message, err.stack);
		if (fatal) {
			// console.debug("Fatal Error encountered; attempting to kill client...")
			console.error("Fatal error encountered!");
			// mudclient.destroy();
			// throw this;
		}
	}
};

if (Object.setPrototypeOf)
	Object.setPrototypeOf(GameException.prototype, Error);
else
	GameException.__prototype = Error.prototype;

export { GameException as default };
