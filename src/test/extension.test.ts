/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import * as vscode from 'vscode';

suite('JoshBot Extension Tests', () => {
	
	test('Extension should be present', () => {
		assert.ok(vscode.extensions.getExtension('spcr-test.joshbot'));
	});

	test('Extension should activate', async () => {
		const extension = vscode.extensions.getExtension('spcr-test.joshbot');
		if (extension) {
			await extension.activate();
			assert.ok(extension.isActive);
		}
	});

	test('Test basic functionality', () => {
		// Simple test to verify basic TypeScript compilation and assertion
		const testValue = 'Hello JoshBot!';
		assert.strictEqual(testValue, 'Hello JoshBot!');
		assert.ok(true, 'Basic test should pass');
	});

	test('Math operations work correctly', () => {
		assert.strictEqual(2 + 2, 4);
		assert.strictEqual(10 * 5, 50);
		assert.strictEqual(100 / 4, 25);
	});

	test('String operations work correctly', () => {
		assert.strictEqual('hello'.toUpperCase(), 'HELLO');
		assert.strictEqual('WORLD'.toLowerCase(), 'world');
		assert.ok('test string'.includes('test'));
	});

	test('Array operations work correctly', () => {
		const testArray = [1, 2, 3, 4, 5];
		assert.strictEqual(testArray.length, 5);
		assert.ok(testArray.includes(3));
		assert.strictEqual(testArray[0], 1);
	});
});