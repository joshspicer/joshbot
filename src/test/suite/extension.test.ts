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
		
		if (!extension.isActive) {
			await extension.activate();
		}
		
		assert.ok(extension.isActive);
	});

	test('Commands should be registered', async () => {
		const extension = vscode.extensions.getExtension('spcr-test.joshbot');
		assert.ok(extension);
		
		if (!extension.isActive) {
			await extension.activate();
		}

		const commands = await vscode.commands.getCommands(true);
		
		const expectedCommands = [
			'joshbot.hello',
			'joshbot.snake',
			'joshbot.squirrel',
			'joshbot.translateToGerman',
			'joshbot.cloudButton'
		];

		for (const command of expectedCommands) {
			assert.ok(commands.includes(command), `Command ${command} should be registered`);
		}
	});

	test('Translation function should work', () => {
		const { translateToGerman } = require('../../extension');
		
		// Test exact matches
		assert.strictEqual(translateToGerman('hello'), 'hallo');
		assert.strictEqual(translateToGerman('goodbye'), 'auf wiedersehen');
		assert.strictEqual(translateToGerman('thank you'), 'danke');
		
		// Test case insensitive
		assert.strictEqual(translateToGerman('HELLO'), 'hallo');
		assert.strictEqual(translateToGerman('Hello'), 'hallo');
		
		// Test partial word replacement
		assert.strictEqual(translateToGerman('hello world'), 'hallo world');
		
		// Test unknown words
		assert.ok(translateToGerman('unknownword').includes('(Übersetzung nicht verfügbar)'));
	});

	test('Commands should execute without errors', async () => {
		const extension = vscode.extensions.getExtension('spcr-test.joshbot');
		assert.ok(extension);
		
		if (!extension.isActive) {
			await extension.activate();
		}

		// Test that commands can be executed (they will show dialogs, but shouldn't throw)
		await vscode.commands.executeCommand('joshbot.hello');
		await vscode.commands.executeCommand('joshbot.snake');
		await vscode.commands.executeCommand('joshbot.squirrel');
		
		// These tests pass if no exception is thrown
		assert.ok(true, 'Commands executed successfully');
	});
});