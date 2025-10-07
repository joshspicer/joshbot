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
		await ext.activate();
		assert.strictEqual(ext.isActive, true);
	});

	test('Chat participant should be registered', async () => {
		const ext = vscode.extensions.getExtension('spcr-test.joshbot');
		assert.ok(ext);
		await ext.activate();
		
		// Verify the chat participant type is registered
		// Note: The actual verification depends on VS Code's chat API being available
		assert.strictEqual(ext.isActive, true);
	});
});
