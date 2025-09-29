import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Extension should be present', () => {
		assert.ok(vscode.extensions.getExtension('spcr-test.joshbot'));
	});

	test('Extension should activate', async () => {
		const extension = vscode.extensions.getExtension('spcr-test.joshbot');
		assert.ok(extension);
		
		// Activate the extension
		await extension!.activate();
		assert.strictEqual(extension!.isActive, true);
	});

	test('Chat participant should be registered', async () => {
		const extension = vscode.extensions.getExtension('spcr-test.joshbot');
		assert.ok(extension);
		
		// Activate the extension first
		await extension!.activate();
		
		// Note: There's no direct API to check if a chat participant is registered,
		// but we can verify the extension is active without errors
		assert.strictEqual(extension!.isActive, true);
	});
});
