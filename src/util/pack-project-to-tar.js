const path = require('path'),
	runYarn = require('../util/run-yarn'),
	readjson = require('../util/readjson'),
	fsPromise = require('../util/fs-promise'),
	expectedArchiveName = require('../util/expected-archive-name');
module.exports = function packProjectToTar(projectDir, workingDir,  npmOptions, logger) {
	'use strict';
	let zipName;
	const absolutePath = path.resolve(projectDir);
	const runWithConfig = function (packageConfig) {
			console.log('packProjectToTar.runWithConfig() xxx\n\n');		
			console.log(JSON.stringify(packageConfig, null, 2));
			return fsPromise.mkdtempAsync(path.join(workingDir, expectedArchiveName(packageConfig, '-')))
			.then(packDir => {
				console.log('packDir', packDir);
				zipName = path.join(packDir, expectedArchiveName(packageConfig));
				return packDir;
			})
			.then(packDir => runYarn(absolutePath, ['pack', '--filename', zipName].concat(npmOptions), logger, false))
			// .then(packDir => runNpm(packDir, ['pack', '-q', absolutePath].concat(npmOptions), logger, true))
			.then(packDir => path.join(packDir, expectedArchiveName(packageConfig)));
		};

	console.log('packProjectToTar()', JSON.stringify({ projectDir, workingDir, npmOptions, absolutePath }, null, 2));
	return readjson(path.join(projectDir, 'package.json'))
		.then(runWithConfig);

};
