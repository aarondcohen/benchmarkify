const Promise = require("bluebird");

/**
 * Test case class
 *
 * @class BenchCase
 */
class BenchCase {
	/**
	 * Creates an instance of BenchCase.
	 *
	 * @param {Suite} suite
	 * @param {String} name
	 * @param {Function} fn
	 * @param {Object} opts
	 *
	 * @memberOf BenchCase
	 */
	constructor(suite, name, fn, opts) {
		this.suite = suite;
		this.name = name;
		this.fn = fn;
		this.async = fn.length > 0;
		this.opts = opts || {};
		this.skip = false;
		this.done = false;
		this.running = false;
		this.time = Math.max(this.opts.time || this.suite.time || 5000, 0);
		this.cycles = Math.max(this.opts.cycles || this.suite.cycles || 1000, 0);
		this.minSamples = Math.max(this.opts.minSamples || this.suite.minSamples || 5, 0);

		this.cycleTimes = [];
		this.timer = null;
		this.startTime = null;

		this.stat = {
			duration: null,
			cycle: 0,
			count: 0,
			avg: null,
			rps: null
		};
	}

	/**
	 *
	 *
	 * @returns
	 *
	 * @memberOf BenchCase
	 */
	run() {
		const self = this;
		return new Promise((resolve, reject) => {
			// Start test
			self.start();

			// Run
			if (self.async) {
				self.cyclingAsyncCb(resolve, reject);
			} else {
				self.cycling(resolve);
			}
		});
	}

	/**
	 *
	 *
	 *
	 * @memberOf BenchCase
	 */
	start() {
		this.running = true;
		this.stat.count = 0;
		this.startTime = Date.now();
	}

	/**
	 *
	 *
	 *
	 * @memberOf BenchCase
	 */
	finish() {
		const count = this.stat.count;
		const duration = 0
			+ this.cycleTimes.reduce((sum, [seconds]) => (sum + seconds), 0)
			+ this.cycleTimes.reduce((sum, [, nanoseconds]) => (sum + nanoseconds), 0) / 1e9;

		Object.assign(this.stat, {
			duration,
			avg: duration / count,
			rps: count / duration
		});

		this.done = true;
		this.running = false;
	}

	/**
	 *
	 *
	 * @param {any} resolve
	 *
	 * @memberOf BenchCase
	 */
	cycling(resolve) {
		if (
			this.stat.count < this.minSamples
			|| Date.now() - this.startTime < this.time
		) {
			const startCycle = process.hrtime();

			for (let i = this.cycles; i > 0; --i) {
				this.fn();
			}

			this.cycleTimes.push(process.hrtime(startCycle))
			this.stat.count += this.cycles;
			this.stat.cycle++;
			setImmediate(() => this.cycling(resolve));

		} else {
			this.finish();
			resolve(this);
		}
	}

	/**
	 *
	 *
	 * @param {any} resolve
	 *
	 * @memberOf BenchCase
	 */
	cyclingAsyncCb(resolve) {
		const self = this;
		const fn = self.fn;

		// Start
		let counter = self.cycles;
		let startCycle = process.hrtime();
		return onCycleComplete();

		function onCycleComplete() {
			if (counter-- > 0) {
				return fn(onCycleComplete);
			}

			self.stat.count += self.cycles;
			self.cycleTimes.push(process.hrtime(startCycle));

			if (
				self.stat.count < self.minSamples
				|| Date.now() - self.startTime < self.time
			) {
				// Wait for new cycle
				setImmediate(() => {
					counter = self.cycles;
					startCycle = process.hrtime();
					fn(onCycleComplete);
				});

			} else {
				// Finished
				self.finish();
				resolve(self);
			}
		}
	}
}

module.exports = { BenchCase };
