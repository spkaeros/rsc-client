let GameException = require('./lib/game-exception');

// Timer is a helper class designed to provide a standard way to execute tasks at specific intervals.
// Each time the game engine updates the client state, we call tick() on every instance of a Timer that we know about, and this will increment
// the Timers tick counter, then check if it's yet hit the activation threshold.  If it has, it will then execute the Timers action method,
// which should perform the task we want done at the specified interval, and subsequently reset the counter to do it all over again.
// Ticks are to be considered as 20ms long increments of time.  Every second is 50 ticks, so 1 minute is 3000 ticks.
class Timer {
	constructor(tickThreshold = 50, cb) {
		this.tickCount = 0;
		this.tickThreshold = tickThreshold;
		this.cb = cb;
		this.index = Timer.current = Timer.current + 1;
	}

	tick(callback = this.cb) {
		if (!this.enabled)
			return;

		if (++this.tickCount >= this.tickThreshold) {
			this.tickCount = 0;
			try {
				return callback();
			} catch(exception) {
				throw exception;
				return;
			}
		}
		return;
	}

	disable() {
		this.tickThreshold = -1;
	}

	get enabled() {
		return this.tickThreshold !== -1;
	}
}

Timer['fromSeconds'] = s => {
	return new Timer(s*50);
};

module.exports = Timer;
