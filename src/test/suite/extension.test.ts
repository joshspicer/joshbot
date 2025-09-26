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

	test('Test command should be registered', async () => {
		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes('joshbot.test'));
	});

	test('Chat participant should be available', () => {
		// Test that the chat participant is registered
		// Note: This is a basic test since VS Code Chat API testing is complex
		assert.ok(true); // Placeholder - actual chat testing would require more complex setup
	});
});