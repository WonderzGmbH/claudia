let yarnPath;
const removeKeysWithPrefix = require('./remove-keys-with-prefix'),
	which = require('which'),
	spawnPromise = require('./spawn-promise'),
	findNpm = function () {
		'use strict';
		if (yarnPath) {
			return Promise.resolve(yarnPath);
		}
		return new Promise((resolve, reject) => {
			which('yarn', (err, path) => {
				if (err) {
					return reject(err);
				}
				yarnPath = path;
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
	return findNpm()
	.then(command => spawnPromise(command, args, {env: env, cwd: dir}, suppressOutput))
	.then(() => dir)
	.catch(() => {
		return Promise.reject(commandDesc + ' failed.');
	});
};
