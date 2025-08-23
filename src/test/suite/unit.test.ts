import * as assert from 'assert';

// Unit tests that don't require VS Code environment
suite('JoshBot Unit Tests', () => {

	test('Translation function should work correctly', () => {
		// Import the function from the translator module
		const { translateToGerman } = require('../../translator');
		
		// Test exact matches
		assert.strictEqual(translateToGerman('hello'), 'hallo');
		assert.strictEqual(translateToGerman('goodbye'), 'auf wiedersehen');
		assert.strictEqual(translateToGerman('thank you'), 'danke');
		assert.strictEqual(translateToGerman('thanks'), 'danke');
		assert.strictEqual(translateToGerman('please'), 'bitte');
		assert.strictEqual(translateToGerman('yes'), 'ja');
		assert.strictEqual(translateToGerman('no'), 'nein');
		
		// Test case insensitive
		assert.strictEqual(translateToGerman('HELLO'), 'hallo');
		assert.strictEqual(translateToGerman('Hello'), 'hallo');
		assert.strictEqual(translateToGerman('HeLLo'), 'hallo');
		
		// Test partial word replacement
		assert.strictEqual(translateToGerman('hello world'), 'hallo world');
		assert.strictEqual(translateToGerman('I say hello to you'), 'i say hallo to you');
		
		// Test multiple word replacement
		assert.strictEqual(translateToGerman('hello please thank you'), 'hallo bitte danke');
		
		// Test phrases
		assert.strictEqual(translateToGerman('good morning'), 'guten morgen');
		assert.strictEqual(translateToGerman('good evening'), 'guten abend');
		assert.strictEqual(translateToGerman('how are you'), 'wie geht es dir');
		
		// Test unknown words get fallback message
		const unknownResult = translateToGerman('unknownword');
		assert.ok(unknownResult.includes('(Übersetzung nicht verfügbar)'));
		assert.ok(unknownResult.includes('unknownword'));
		
		// Test empty and whitespace
		assert.strictEqual(translateToGerman('').trim(), '(Übersetzung nicht verfügbar)');
		assert.strictEqual(translateToGerman('   ').trim(), '(Übersetzung nicht verfügbar)');
	});

	test('Translation function handles edge cases', () => {
		const { translateToGerman } = require('../../translator');
		
		// Test word boundaries - should not replace parts of words
		assert.strictEqual(translateToGerman('helicopter'), 'helicopter (Übersetzung nicht verfügbar)');
		
		// Test that it doesn't replace 'hello' in 'hellos'
		assert.strictEqual(translateToGerman('hellos'), 'hellos (Übersetzung nicht verfügbar)');
		
		// Test punctuation
		assert.strictEqual(translateToGerman('hello!'), 'hallo!');
		assert.strictEqual(translateToGerman('hello, how are you?'), 'hallo, wie geht es dir?');
	});

	test('Translation module exports function correctly', () => {
		const translator = require('../../translator');
		
		// Check that the function is exported
		assert.ok(typeof translator.translateToGerman === 'function');
		
		// Test that it works as expected
		assert.strictEqual(translator.translateToGerman('hello'), 'hallo');
	});
});