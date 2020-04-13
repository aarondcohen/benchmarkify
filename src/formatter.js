'use strict';

class Formatter {
	/**
	 * Format number with fixed precision
	 * @param {any} value Number value
	 * @param {number} [decimals=0] Count of decimals
	 * @returns {string}
	 */
	number(value, decimals = 0) {
		return Number(value.toFixed(decimals)).toLocaleString();
	}

	/**
	 * Format number with fixed precision, always show the sign
	 * @param {any} value Number value
	 * @param {number} [decimals=0] Count of decimals
	 * @returns {string}
	 */
	numberWithSign(value) {
		return (value > 0 ? "+" : "") + this.number(...arguments)
	}
}

module.exports = new Formatter;
