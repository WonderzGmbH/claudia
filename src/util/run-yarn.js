let yarnPath;
const removeKeysWithPrefix = require('./remove-keys-with-prefix'),
	which = require('which'),
	spawnPromise = require('./spawn-promise'),
	findYarn = function () {
		'use strict';
		if (yarnPath) {
			return Promise.resolve(yarnPath);
		}
		return new Promise((resolve, reject) => {
			which('yarn', (err, path) => {
				if (err) {
					console.error('yarn not found');
					return reject(err);
				}
				console.log('yarn found', path);
				yarnPath = path;
				// resolve('/Users/phil/n/bin/yarn');
				resolve(path);
			});
		});

	},
	toArgs = function (opts) {
		'use strict';
		if (!opts) {
			return [];
		}
		if (Array.isArray(opts)) {
			return opts;
		}
		if (typeof opts === 'string') {
			return opts.split(' ');
		}
		throw new Error('cannot convert to options', opts);
	};
module.exports = function runYarn(dir, options, logger, suppressOutput) {
	'use strict';
	const env = removeKeysWithPrefix(process.env, 'npm_'),
		args = toArgs(options),
		commandDesc = 'yarn ' + args.join(' ');
	logger.logApiCall(commandDesc);
	return findYarn()
	.then(command => {
		console.log('command', { command, args, dir });	
		return spawnPromise(command, args, {env: env, cwd: dir}, suppressOutput);
	})
	.then(() => {
		console.log('dir', dir);
		const x = args[2].split('/')
		x.pop();
		return x.join('/');
	})
	.catch((err) => {
		console.error(err);
		return Promise.reject(commandDesc + ' failed.');
	});
};
