// Timer is a helper class designed to provide a standard way to execute tasks at specific intervals.
// Each time the game engine updates the client state, we call tick() on every instance of a Timer that we know about, and this will increment
// the Timers tick counter, then check if it's yet hit the activation threshold.  If it has, it will then execute the Timers action method,
// which should perform the task we want done at the specified interval, and subsequently reset the counter to do it all over again.
// Ticks are to be considered as 20ms long increments of time.  Every second is 50 ticks, so 1 minute is 3000 ticks.
class Timer {
	constructor(tickThreshold) {
		this.tickCount = 0;
		if (!tickThreshold)
			tickThreshold = 50*20;
		else
			this.tickThreshold = tickThreshold;
	}

	async tick(callback) {
		if (++this.tickCount >= this.tickThreshold) {
			try {
				await callback();
			} catch(exception) {
				throw exception;
			}
			this.tickCount = 0;
		}
	}
}

module.exports = Timer;
