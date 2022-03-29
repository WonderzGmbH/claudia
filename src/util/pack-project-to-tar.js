const path = require('path'),
	runYarn = require('../util/run-yarn'),
	readjson = require('../util/readjson'),
	fsPromise = require('../util/fs-promise'),
	expectedArchiveName = require('../util/expected-archive-name');
module.exports = function packProjectToTar(projectDir, workingDir,  npmOptions, logger) {
	'use strict';
	const absolutePath = path.resolve(projectDir),
		runWithConfig = function (packageConfig) {
			return fsPromise.mkdtempAsync(path.join(workingDir, expectedArchiveName(packageConfig, '-')))
			.then(packDir => runYarn(packDir, ['pack', absolutePath].concat(npmOptions), logger, true))
			// .then(packDir => runNpm(packDir, ['pack', '-q', absolutePath].concat(npmOptions), logger, true))
			.then(packDir => path.join(packDir, expectedArchiveName(packageConfig)));
		};
	return readjson(path.join(projectDir, 'package.json'))
		.then(runWithConfig);

};
