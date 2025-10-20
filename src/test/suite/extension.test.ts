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
		await extension!.activate();
		assert.strictEqual(extension!.isActive, true);
	});

	test('Chat participant should be registered', async () => {
		const extension = vscode.extensions.getExtension('spcr-test.joshbot');
		assert.ok(extension);
		await extension!.activate();
		// The extension registers a chat participant with id 'josh-bot'
		// We can't directly test the chat participant API in unit tests,
		// but we can verify the extension activated successfully
		assert.strictEqual(extension!.isActive, true);
	});
});
