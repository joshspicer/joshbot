import * as assert from 'assert';
import * as vscode from 'vscode';

const EXTENSION_ID = 'spcr-test.joshbot';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Extension should be present', () => {
		assert.ok(vscode.extensions.getExtension(EXTENSION_ID));
	});

	test('Extension should activate', async () => {
		const extension = vscode.extensions.getExtension(EXTENSION_ID);
		assert.ok(extension);
		await extension!.activate();
		assert.strictEqual(extension!.isActive, true);
	});
});
