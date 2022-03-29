const runYarn = require('claudia/src/util/run-yarn');
const path = require('path'),
	fsUtil = require('../util/fs-util'),
	fsPromise = require('../util/fs-promise');
	// runNpm = require('../util/run-npm');
module.exports = function cleanUpPackage(packageDir, options, logger) {
	'use strict';
	const npmOptions = (options && options['npm-options']) ? options['npm-options'].split(' ') : [],
		// dedupe = function () {
		// 	return options['optional-dependencies'] === false
		// 		? runNpm(packageDir, ['dedupe', '-q', '--no-package-lock', '--production', '--no-optional'].concat(npmOptions), logger, true)
		// 		: runNpm(packageDir, ['dedupe', '-q', '--no-package-lock'].concat(npmOptions), logger, true);
		// },
		runPostPackageScript = function () {
			const script = options['post-package-script'];
			if (script) {
				return runYarn(packageDir, [script].concat(npmOptions), logger, options && options.quiet);
			}
		},
		fixEntryPermissions = function (path) {
			return fsPromise.statAsync(path)
			.then(stats => {
				const requiredMode = stats.isDirectory() ? 0o755 : 0o644;
				return (stats.mode & 0o777) | requiredMode;
			})
			.then(mode => fsPromise.chmodAsync(path, mode));
		},
		fixFilePermissions = function () {
			console.log('fixFilePermissions()', packageDir);
			console.log('xxx');
			return Promise.all(
				fsUtil.recursiveList(packageDir).map(component => {
					console.log(component);	
					return fixEntryPermissions(path.join(packageDir, component));
				})
			);
		},
		cleanUpDependencies = function () {
			if (options['optional-dependencies'] === false) {
				logger.logApiCall('removing optional dependencies');
				fsUtil.rmDir(path.join(packageDir, 'node_modules'));
				return runYarn(packageDir, ['install', '-q', '--no-lockfile', '--production', '--ignore-optional'].concat(npmOptions), logger, options && options.quiet);
			}
		};
	return Promise.resolve()
	// .then(() => fsUtil.silentRemove(path.join(packageDir, 'yarn.lock')))
	.then(cleanUpDependencies)
	// .then(dedupe)
	.then(runPostPackageScript)
	.then(() => fsUtil.silentRemove(path.join(packageDir, '.npmrc')))
	.then(fixFilePermissions)
	.then(() => packageDir);
};
