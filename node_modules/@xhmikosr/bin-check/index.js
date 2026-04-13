import {execa, execaSync} from 'execa';
import {isexe, sync as isexeSync} from 'isexe';

const binCheck = (bin, args) => {
	if (!Array.isArray(args)) {
		args = ['--help'];
	}

	return isexe(bin)
		.then(works => {
			if (!works) {
				throw new Error(`Couldn't execute the "${bin}" binary. Make sure it has the right permissions.`);
			}

			return execa(bin, args);
		})
		.then(result => result.exitCode === 0);
};

binCheck.sync = (bin, args) => {
	if (!Array.isArray(args)) {
		args = ['--help'];
	}

	if (!isexeSync(bin)) {
		throw new Error(`Couldn't execute the "${bin}" binary. Make sure it has the right permissions.`);
	}

	return execaSync(bin, args).exitCode === 0;
};

export default binCheck;
