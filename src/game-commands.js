function GameCommands() {
	var GameCommand = (function(pattern, action) {
		return {
			'handles': (function(s) {
				return pattern.test(s);
			}),
			'execute': (function(s) {
				action.bind(this)();
			}),
		};
	});

	var LIST = [];

	function handle(cmd) {
		for (var handler of LIST) {
			if (handler.handles(cmd)) {
				handler.execute()
				return true;
			}
		}
		return false;
	}

	function add(pattern, callback) {
		for (var property of LIST) {
			if (property.toString() === pattern.toString()) {
				console.warn('Can\'t handle the same pattern twice; ignoring latest handler.')
				return;
			}
		}
		LIST.push(new GameCommand(pattern, callback));
	}

	return {
		LIST: LIST,
		add: add,
		find: function (cmd) {
			for (var handler of LIST) {
				if (handler.handles(cmd)) {
					handler.execute()
					return handler;
				}
			}
			return void 0;
		}
		// 'handle': handle,
	};
}


module.exports = GameCommands;
