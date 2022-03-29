module.exports = function expectedArchiveName(packageConfig, extension) {
	'use strict';
	const name = packageConfig.name.replace(/^@/, '').replace(/\//, '-') + '-' + packageConfig.version + (extension || '.tgz');
	console.log('expectedArchiveName()', name);
	return name;
};
