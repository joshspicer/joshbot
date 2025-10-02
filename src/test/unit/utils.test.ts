/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { escapeMarkdown } from '../../utils';

suite('Utility Function Tests', () => {
	
	test('escapeMarkdown should escape special characters', () => {
		// Test escaping various markdown special characters
		const testCases = [
			{ input: 'hello*world', expected: 'hello\\*world' },
			{ input: 'test_value', expected: 'test\\_value' },
			{ input: 'code`block', expected: 'code\\`block' },
			{ input: '[link]', expected: '\\[link\\]' },
			{ input: '{object}', expected: '\\{object\\}' },
			{ input: 'plain text', expected: 'plain text' }
		];

		testCases.forEach(({ input, expected }) => {
			const result = escapeMarkdown(input);
			assert.strictEqual(result, expected, `Failed for input: ${input}`);
		});
	});

	test('Session ID generation should be unique', () => {
		const sessionIds = new Set<string>();
		const count = 10;
		
		for (let i = 1; i <= count; i++) {
			const sessionId = `session-${i}`;
			assert.ok(!sessionIds.has(sessionId), `Session ID ${sessionId} should be unique`);
			sessionIds.add(sessionId);
		}
		
		assert.strictEqual(sessionIds.size, count, 'All session IDs should be unique');
	});

	test('Chat session type constant', () => {
		const CHAT_SESSION_TYPE = 'josh-bot';
		assert.strictEqual(CHAT_SESSION_TYPE, 'josh-bot', 'Chat session type should be josh-bot');
	});
});
