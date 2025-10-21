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
		
		// The extension should register a chat participant of type 'josh-bot'
		// This is a basic test to ensure activation completes without errors
		assert.ok(ext!.isActive);
	});
});
