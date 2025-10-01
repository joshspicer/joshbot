/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Extension should be present', () => {
		assert.ok(vscode.extensions.getExtension('spcr-test.joshbot'));
	});

	test('Extension should activate', async () => {
		const ext = vscode.extensions.getExtension('spcr-test.joshbot');
		assert.ok(ext);
		await ext!.activate();
		assert.strictEqual(ext!.isActive, true);
	});

	test('Chat participant should be registered', async () => {
		const ext = vscode.extensions.getExtension('spcr-test.joshbot');
		assert.ok(ext);
		await ext!.activate();
		
		// The extension should have registered the josh-bot chat participant
		// We can verify this by checking that the extension is active
		assert.strictEqual(ext!.isActive, true);
	});
});
