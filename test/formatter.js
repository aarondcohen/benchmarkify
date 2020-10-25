'use strict';

const { expect } = require('chai');

const described_namespace = require('formatter');

describe("Formatter", function() {
	const number = 123.567;

	describe('.number', function() {
		const subject = described_namespace.number;

		it('ignores positive sign', function() {
			expect(subject(number)).to.equal("124");
		});

		it('serializes negative sign', function() {
			expect(subject(-number)).to.equal("-124");
		});

		it('truncates decimals by default', function() {
			expect(subject(number)).to.equal("124");
		});

		it('rounds to specified decimals', function() {
			expect(subject(number, 1)).to.equal("123.6");
		});
	});

	describe('.numberWithSign', function() {
		const subject = described_namespace.numberWithSign;

		it('serializes positive sign', function() {
			expect(subject(number)).to.equal("+124");
		});

		it('serializes negative sign', function() {
			expect(subject(-number)).to.equal("-124");
		});

		it('truncates decimals by default', function() {
			expect(subject(number)).to.equal("+124");
		});

		it('rounds to specified decimals', function() {
			expect(subject(number, 1)).to.equal("+123.6");
		});
	});
})

