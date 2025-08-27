#!/usr/bin/env node

import * as Mocha from 'mocha';
import * as path from 'path';
import { glob } from 'glob';

// Simple test runner for unit tests that don't require VS Code
const mocha = new Mocha({
	ui: 'tdd',
	color: true,
	timeout: 5000
});

async function main() {
	try {
		// Find test files, excluding integration tests
		const testFiles = await glob('**/**.test.js', { 
			cwd: path.resolve(__dirname, './suite'),
			ignore: ['**/extension.test.js'] // Exclude VS Code integration tests
		});

		console.log(`Found ${testFiles.length} unit test file(s):`);
		
		// Add all test files
		testFiles.forEach(file => {
			const testFile = path.resolve(__dirname, './suite', file);
			console.log(`  - ${file}`);
			mocha.addFile(testFile);
		});
		
		console.log('\nRunning unit tests...');
		mocha.run((failures) => {
			if (failures > 0) {
				console.error(`${failures} test(s) failed.`);
				process.exit(1);
			} else {
				console.log('All tests passed!');
				process.exit(0);
			}
		});
	} catch (error) {
		console.error('Error running tests:', error);
		process.exit(1);
	}
}

main();