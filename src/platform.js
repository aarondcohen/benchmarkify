"use strict";

const os = require("os");

module.exports = logger => {
	const indent = ' '.repeat(3);

	logger.info("Platform info:");
	logger.info("==============");
	logger.info(`${indent}${os.type()} ${os.release()} ${os.arch()}`);
	logger.info(`${indent}Node.JS: ${process.versions.node}`);
	logger.info(`${indent}V8: ${process.versions.v8}`);

	const cpuModelToCount = os.cpus()
		.map((cpu) => cpu.model)
		.reduce((o, model) => (o[model] = (o[model] || 0) + 1, o), {});

	Object.entries(cpuModelToCount)
		.forEach(([model, count]) => logger.info(`${indent}${model} \u00d7 ${count}`))
};
