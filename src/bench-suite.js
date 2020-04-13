const Formatter = require('./formatter');
const { BenchCase } = require('./bench-case');

const Promise = require("bluebird");
const chalk = require("chalk");
const humanize = require('tiny-human-time');

/**
 *
 *
 * @class BenchSuite
 */
class BenchSuite {
	/**
	 * Creates an instance of BenchSuite.
	 * @param {Benchmarkify} parent
	 * @param {String} name
	 * @param {Object} opts
	 *
	 * @memberOf BenchSuite
	 */
	constructor(parent, name, opts) {
		this.parent = parent;
		this.name = name;
		this.logger = this.parent.logger;
		this.onlyCase = null;
		this.done = false;
		this.running = false;

		this.benchCases = [];

		Object.assign(this, {
			time: 5000,
			minSamples: 0
		}, opts);

		if (!this.cycles)
			this.cycles = this.minSamples > 0 ? this.minSamples : 1000;
	}

	/**
	 *
	 *
	 * @param {any} name
	 * @param {any} fn
	 * @param {any} opts
	 * @returns
	 *
	 * @memberOf Suite
	 */
	appendCase(name, fn, opts) {
		const benchCase = new BenchCase(this, name, fn, opts);
		this.benchCases.push(benchCase);
		return benchCase;
	}

	/**
	 *
	 *
	 * @param {any} name
	 * @param {any} fn
	 * @param {any} [opts={}]
	 * @returns
	 *
	 * @memberOf Suite
	 */
	add(name, fn, opts = {}) {
		this.appendCase(name, fn, opts);
		return this;
	}

	/**
	 *
	 *
	 * @param {any} name
	 * @param {any} fn
	 * @param {any} [opts={}]
	 * @returns
	 *
	 * @memberOf Suite
	 */
	only(name, fn, opts = {}) {
		this.onlyCase = this.appendCase(name, fn, opts);
		return this;
	}

	/**
	 *
	 *
	 * @param {any} name
	 * @param {any} fn
	 * @param {any} [opts={}]
	 * @returns
	 *
	 * @memberOf Suite
	 */
	skip(name, fn, opts = {}) {
		const benchCase = this.appendCase(name, fn, opts);
		benchCase.skip = true;

		return this;
	}

	/**
	 *
	 *
	 * @param {any} name
	 * @param {any} fn
	 * @param {any} [opts={}]
	 * @returns
	 *
	 * @memberOf Suite
	 */
	ref(name, fn, opts = {}) {
		const benchCase = this.appendCase(name, fn, opts);
		benchCase.reference = true;

		return this;
	}

	/**
	 *
	 *
	 * @returns
	 *
	 * @memberOf Suite
	 */
	run() {
		const self = this;
		self.maxTitleLength = this.benchCases.reduce((max, benchCase) => Math.max(max, benchCase.name.length), 0) + 2;

		if (this.onlyCase) {
			this.benchCases.forEach(benchCase => benchCase.skip = benchCase !== this.onlyCase);
		}

		return new Promise(resolve => {
			self.running = true;
			self.logger.log(chalk.magenta.bold(`Suite: ${self.name}`));

			this.runCase(Array.from(this.benchCases), resolve);

		}).then(() => {
			if (self.parent.spinner)
				self.parent.spinner.stop();

			self.logger.log("");

			// Generate results
			return self.calculateResult();
		});
	}

	/**
	 *
	 *
	 * @param {any} list
	 * @param {any} resolve
	 * @returns
	 *
	 * @memberOf Suite
	 */
	runCase(list, resolve) {
		const self = this;
		const benchCase = list.shift();

		function printAndRun(type, msg, err) {
			if (self.parent.spinner)
				self.parent.spinner[type](msg);
			else
				self.logger.log("››", msg);

			if (err)
				self.logger.error(err);

			return list.length > 0 ? self.runCase(list, resolve) : resolve();
		}

		if (benchCase.skip) {
			// Skip benchCase
			return printAndRun("warn", chalk.yellow(`[SKIP] ${benchCase.name}`));
		}

		if (this.parent.spinner) {
			// Refresh spinner
			self.parent.spinner.text = `Running '${benchCase.name}'...`;
			self.parent.spinner.start();
		}

		// Run benchCase
		return benchCase.run().delay(200).then(() => {
			const flag = benchCase.async ? "*" : "";
			const msg = [
				`${benchCase.name}${flag}`.padEnd(self.maxTitleLength),
				`${Formatter.number(benchCase.stat.rps)} rps`.padStart(20),
			].join('')
			return printAndRun("succeed", msg);
		}).catch(err => {
			benchCase.error = err;
			return printAndRun("fail", chalk.red(`[ERR] ${benchCase.name}`), err);
		});
	}

	/**
	 *
	 *
	 * @returns
	 *
	 * @memberOf Suite
	 */
	calculateResult() {
		let maxRps = 0;
		let maxTitleLength = 0;
		let fastest = null;
		let reference = null;
		this.benchCases.forEach(benchCase => {
			if (benchCase.skip) return;

			if (benchCase.reference)
				reference = benchCase;

			if (benchCase.stat.rps > maxRps) {
				maxRps = benchCase.stat.rps;
				fastest = benchCase;
			}

			if (benchCase.name.length > maxTitleLength)
				maxTitleLength = benchCase.name.length;
		});

		//this.benchCases.sort((a, b) => b.stat.rps - a.stat.rps);

		this.benchCases.forEach(benchCase => {
			if (benchCase.skip) {
				this.logger.log(chalk.yellow(`  ${benchCase.name} (skipped)`));
				return;
			}
			if (benchCase.error) {
				this.logger.log(chalk.red(`  ${benchCase.name} (error: ${benchCase.error.message})`));
				return;
			}
			const baseRps = reference ? reference.stat.rps : fastest.stat.rps;
			const color = benchCase == fastest ? chalk.green : chalk.cyan;
			benchCase.stat.percent = ((benchCase.stat.rps / baseRps) * 100) - 100;
			const flag = (benchCase.async ? "*" : "") + (benchCase == reference ? " (#)" : "");

			let line = [
				"  ",
				`${benchCase.name}${flag}`.padEnd(maxTitleLength + 5),
				`${Formatter.numberWithSign(benchCase.stat.percent, 2)}%`.padStart(8),
				`  (${Formatter.number(benchCase.stat.rps)}rps)`.padStart(20),
				`  (avg: ${humanize.short(benchCase.stat.avg * 1000)})`,
			];
			this.logger.log(color.bold(...line));
		});
		this.logger.log(`${"-".repeat(72)}\n`);

		// Generate result to return
		return this.benchCases.map(benchCase => ({
			name: benchCase.name,
			error: benchCase.error ? benchCase.error.toString() : null,
			fastest: benchCase === fastest,
			reference: !!benchCase.reference,
			skipped: !!benchCase.skip,
			stat: benchCase.skip ? null : benchCase.stat,
		}));
	}
}

BenchSuite.prototype.appendTest = BenchSuite.prototype.appendCase
BenchSuite.prototype.runTest = BenchSuite.prototype.runCase

module.exports = { BenchSuite };
