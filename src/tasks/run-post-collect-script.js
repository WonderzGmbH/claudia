const runNpm = require('../util/run-npm');
module.exports = function runPostCollectScript(packageDir, options, logger) {
	'use strict';
	const npmOptions = (options && options['npm-options']) ? options['npm-options'].split(' ') : [],
		runPostCollectScript = function () {
			const script = options['post-collect-script'];
			if (script) {
				return runNpm(packageDir, ['run', script].concat(npmOptions), logger, options && options.quiet);
			}
		};
	return Promise.resolve()
	.then(runPostCollectScript)
	.then(() => packageDir);
};
