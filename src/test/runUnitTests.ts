import * as Mocha from 'mocha';
import * as path from 'path';
import { glob } from 'glob';

async function runUnitTests() {
	// Create the mocha test runner
	const mocha = new Mocha({
		ui: 'tdd',
		color: true,
		timeout: 10000
	});

	const testsRoot = path.resolve(__dirname, '..');

	try {
		// Find test files
		const files = await glob('**/unit.test.js', { cwd: testsRoot });
		
		if (files.length === 0) {
			console.log('No unit test files found');
			process.exit(1);
		}

		// Add files to the test suite
		files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

		console.log(`Running ${files.length} test file(s)...`);

		// Run the tests
		const failures = await new Promise<number>((resolve) => {
			mocha.run((failures) => {
				resolve(failures);
			});
		});

		if (failures > 0) {
			console.error(`${failures} test(s) failed.`);
			process.exit(1);
		} else {
			console.log('All tests passed!');
			process.exit(0);
		}
	} catch (err) {
		console.error('Failed to run tests:', err);
		process.exit(1);
	}
}

runUnitTests();