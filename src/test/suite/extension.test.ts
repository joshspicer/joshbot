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

	test('Commands should be registered', async () => {
		const commands = await vscode.commands.getCommands(true);
		assert.ok(commands.includes('joshbot.hello'));
		assert.ok(commands.includes('joshbot.cloudButton'));
		assert.ok(commands.includes('joshbot.snake'));
		assert.ok(commands.includes('joshbot.squirrel'));
	});
});
