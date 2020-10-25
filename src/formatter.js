'use strict';

/**
 * Format number with fixed precision
 * @param {any} value Number value
 * @param {number} [decimals=0] Count of decimals
 * @returns {string}
 */
function number(value, decimals = 0) {
	return Number(value.toFixed(decimals)).toLocaleString();
}

/**
 * Format number with fixed precision, always show the sign
 * @param {any} value Number value
 * @param {number} [decimals=0] Count of decimals
 * @returns {string}
 */
function numberWithSign(value) {
	return (value > 0 ? "+" : "") + number(...arguments)
}

module.exports = { number, numberWithSign };
