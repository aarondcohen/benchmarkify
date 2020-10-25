const { BenchSuite } = require('./bench-suite');

const Promise = require("bluebird");
const chalk = require("chalk");
const ora = require('ora');

/**
 *
 *
 * @class Benchmarkify
 */
class Benchmarkify {
	/**
	 * Creates an instance of Benchmarkify.
	 * @param {any} name
	 * @param {any} logger
	 *
	 * @memberOf Benchmarkify
	 */
	constructor(name, opts = {}) {
		this.name = name;
		this.logger = opts.logger || console;
		if (opts.spinner !== false) {
			this.spinner = ora({
				text: "Running benchmark...",
				spinner: {
					interval: 400,
					"frames": [
						".  ",
						".. ",
						"...",
						" ..",
						"  .",
						"   "
					]
				}
			});
		}

		this.Promise = Promise;

		this.suites = [];
	}

	/**
	 *
	 *
	 *
	 * @memberOf Benchmarkify
	 */
	printPlatformInfo() {
		require("./platform")(this.logger);
		this.logger.log("");
	}

	/**
	 *
	 *
	 * @param {boolean} [platformInfo=true]
	 *
	 * @memberOf Benchmarkify
	 */
	printHeader(platformInfo = true) {
		const title = `  ${this.name}  `;
		const lines = "=".repeat(title.length);

		this.logger.log(chalk.yellow.bold(lines));
		this.logger.log(chalk.yellow.bold(title));
		this.logger.log(chalk.yellow.bold(lines));
		this.logger.log("");

		if (platformInfo)
			this.printPlatformInfo();

		return this;
	}

	/**
	 *
	 *
	 * @param {String} name
	 * @param {any} opts
	 * @returns
	 *
	 * @memberOf Benchmarkify
	 */
	createSuite(name, opts) {
		const suite = new BenchSuite(this, name, opts);
		this.suites.push(suite);
		return suite;
	}

	/**
	 *
	 *
	 * @param {any} suites
	 * @returns
	 *
	 * @memberOf Benchmarkify
	 */
	run(suites) {
		const self = this;
		const list = Array.from(suites || this.suites);
		const results = [];
		const start = new Date();

		/**
		 *
		 *
		 * @param {any} suite
		 * @returns
		 */
		function run(suite) {
			return suite.run().then(res => {
				results.push({
					name: suite.name,
					tests: res
				});

				if (list.length > 0) {
					return run(list.shift());
				} else {
					const now = new Date();
					return {
						name: self.name,
						suites: results,
						timestamp: +now,
						generated: now.toString(),
						elapsedMs: now - start
					};
				}
			});
		}

		return run(list.shift());
	}
}

module.exports = { Benchmarkify };
