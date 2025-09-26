/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

const CHAT_SESSION_TYPE = 'josh-bot';

// Dynamically created sessions
const _sessionItems: vscode.ChatSessionItem[] = [];
const _chatSessions: Map<string, vscode.ChatSession> = new Map();

let onDidCommitChatSessionItemEmitter: vscode.EventEmitter<{ original: vscode.ChatSessionItem; modified: vscode.ChatSessionItem; }>;

/**
 * Detects if a string contains a repeating pattern (like repeated 'A' characters)
 * @param text The text to analyze
 * @returns true if a repeating pattern is detected
 */
function isRepeatingPattern(text: string): boolean {
	if (text.length < 10) return false;
	
	// Check for simple single character repetition (like 'AAAAA...')
	const firstChar = text.charAt(0);
	let consecutiveCount = 0;
	for (let i = 0; i < Math.min(text.length, 1000); i++) {
		if (text.charAt(i) === firstChar) {
			consecutiveCount++;
		} else {
			break;
		}
	}
	
	// If more than 50% of the first 1000 chars are the same character, it's likely a repeating pattern
	if (consecutiveCount > 500) {
		return true;
	}
	
	// Check for short repeating patterns (2-10 characters)
	for (let patternLength = 2; patternLength <= 10; patternLength++) {
		const pattern = text.substring(0, patternLength);
		let matches = 0;
		
		for (let i = 0; i < Math.min(text.length - patternLength, 1000); i += patternLength) {
			if (text.substring(i, i + patternLength) === pattern) {
				matches++;
			} else {
				break;
			}
		}
		
		// If the pattern repeats more than 20 times, consider it a repeating pattern
		if (matches > 20) {
			return true;
		}
	}
	
	return false;
}

export function activate(context: vscode.ExtensionContext) {
	console.log('JoshBot extension is now active!');
	onDidCommitChatSessionItemEmitter = new vscode.EventEmitter<{ original: vscode.ChatSessionItem; modified: vscode.ChatSessionItem; }>();
	const chatParticipant = vscode.chat.createChatParticipant(CHAT_SESSION_TYPE, async (request, context, stream, token) => {
		// Handle confirmation responses first
		if (request.acceptedConfirmationData || request.rejectedConfirmationData) {
			return handleConfirmationData(request, context, stream, token);
		}

		// Check for extremely long input messages and handle appropriately
		const prompt = (request as any).prompt || '';
		if (prompt && typeof prompt === 'string') {
			const MAX_MESSAGE_LENGTH = 10000; // 10KB limit for chat messages
			const MEMORY_SAFETY_LIMIT = 100000; // 100KB absolute limit for safety
			
			// Absolute safety check to prevent memory issues
			if (prompt.length > MEMORY_SAFETY_LIMIT) {
				stream.warning(`🚫 Critical Error: Message exceeds safety limits (${prompt.length.toLocaleString()} characters). Cannot process.\n\n`);
				stream.markdown(`For your safety and system stability, messages longer than ${MEMORY_SAFETY_LIMIT.toLocaleString()} characters cannot be processed.\n\n`);
				return;
			}
			
			if (prompt.length > MAX_MESSAGE_LENGTH) {
				stream.warning(`⚠️ Message too long! Your message has ${prompt.length.toLocaleString()} characters, but the maximum allowed is ${MAX_MESSAGE_LENGTH.toLocaleString()} characters.\n\n`);
				
				// Safely truncate for display (prevent memory issues)
				const truncatedPrompt = prompt.substring(0, 100);
				const hasRepeatingPattern = isRepeatingPattern(prompt);
				
				if (hasRepeatingPattern) {
					stream.markdown(`I noticed your message contains a repeating pattern: \`${truncatedPrompt}...\`\n\n`);
					stream.markdown(`**For very long messages with repeating patterns, please consider:**\n`);
					stream.markdown(`- Summarizing the content instead\n`);
					stream.markdown(`- Using a file upload for large data\n`);
					stream.markdown(`- Breaking the request into smaller parts\n\n`);
					
					// Provide helpful context about the detected pattern
					const endSnippet = prompt.length > 200 ? prompt.substring(prompt.length - 50) : '';
					if (endSnippet && endSnippet !== truncatedPrompt.substring(0, 50)) {
						stream.markdown(`Your message ends with: \`...${endSnippet}\`\n\n`);
					}
				} else {
					stream.markdown(`Your message starts with: \`${truncatedPrompt}...\`\n\n`);
					stream.markdown(`Please shorten your message and try again.\n\n`);
				}
				return;
			}
			
			// For moderately long messages, acknowledge the content
			if (prompt.length > 500) {
				stream.markdown(`📝 I received your message (${prompt.length} characters). Let me help you with that.\n\n`);
			}
		}

		if (context.chatSessionContext) {
			const { isUntitled, chatSessionItem: original } = context.chatSessionContext;
			// stream.markdown(`Good day! This is chat session '${original.id}'\n\n`);
			if (isUntitled) {
				/* Initial Untitled response */
				stream.confirmation('New Chat Session', `Would you like to begin?\n\n`, { step: 'create' }, ['yes', 'no']);
				return;

			} else {
				/* follow up */
				stream.markdown(`Welcome back!`)
			}
		} else {
			/*general query*/
			stream.markdown(`Howdy! I am joshbot, your friendly chat companion.`);
			stream.confirmation('Ping', 'Would you like to ping me?', { step: 'ping' }, ['yes', 'no']);
		}
	});
	context.subscriptions.push(chatParticipant);

	// Create session provider
	const sessionProvider = new class implements vscode.ChatSessionItemProvider, vscode.ChatSessionContentProvider {
		onDidChangeChatSessionItems = new vscode.EventEmitter<void>().event;
		onDidCommitChatSessionItem: vscode.Event<{ original: vscode.ChatSessionItem; modified: vscode.ChatSessionItem; }> = onDidCommitChatSessionItemEmitter.event;
		async provideChatSessionItems(token: vscode.CancellationToken): Promise<vscode.ChatSessionItem[]> {
			return [
				{
					id: 'demo-session-01',
					label: 'JoshBot Demo Session 01',
					status: vscode.ChatSessionStatus.Completed
				},
				{
					id: 'demo-session-02',
					label: 'JoshBot Demo Session 02',
					status: vscode.ChatSessionStatus.Completed
				},
				{
					id: 'demo-session-03',
					label: 'JoshBot Demo Session 03',
					status: vscode.ChatSessionStatus.InProgress
				},
				..._sessionItems,
			];
		}
		async provideChatSessionContent(sessionId: string, token: vscode.CancellationToken): Promise<vscode.ChatSession> {
			switch (sessionId) {
				case 'demo-session-01':
				case 'demo-session-02':
					return completedChatSessionContent(sessionId);
				case 'demo-session-03':
					return inProgressChatSessionContent(sessionId);
				default:
					const existing = _chatSessions.get(sessionId);
					if (existing) {
						return existing;
					}
					// Guess this is an untitled session. Play along.
					return untitledChatSessionContent(sessionId);
			}
		}

		// provideNewChatSessionItem(options: { readonly request: vscode.ChatRequest; metadata?: any; }, token: vscode.CancellationToken): vscode.ProviderResult<vscode.ChatSessionItem> {
		// 	throw new Error('Method not implemented.');
		// }
	};
	context.subscriptions.push(
		vscode.chat.registerChatSessionItemProvider(CHAT_SESSION_TYPE, sessionProvider)
	);
	context.subscriptions.push(
		vscode.chat.registerChatSessionContentProvider(CHAT_SESSION_TYPE, sessionProvider, chatParticipant)
	);
}

async function handleConfirmationData(request: vscode.ChatRequest, context: vscode.ChatContext, stream: vscode.ChatResponseStream, token: vscode.CancellationToken): Promise<void> {
	const results: Array<{ step: string; accepted: boolean }> = [];
	results.push(...(request.acceptedConfirmationData?.map(data => ({ step: data.step, accepted: true })) ?? []));
	results.push(...((request.rejectedConfirmationData ?? []).filter(data => !results.some(r => r.step === data.step)).map(data => ({ step: data.step, accepted: false }))));
	for (const data of results) {
		switch (data.step) {
			case 'create':
				await handleCreation(data.accepted, request, context, stream);
				break;
			case 'ping':
				if (data.accepted) {
					stream.markdown('pong!\n\n');
				}
				break;
			default:
				stream.markdown(`Unknown confirmation step: ${data.step}\n\n`);
				break;
		}
	}
}

async function handleCreation(accepted: boolean, request: vscode.ChatRequest, context: vscode.ChatContext, stream: vscode.ChatResponseStream): Promise<void> {
	if (!accepted) {
		stream.warning(`New session was not created.\n\n`);
		return;
	}

	const original = context.chatSessionContext?.chatSessionItem;
	if (!original || !context.chatSessionContext?.isUntitled) {
		stream.warning(`Cannot create new session - this is not an untitled session!.\n\n`);
		return;
	}

	stream.progress(`Creating new session...\n\n`);
	await new Promise(resolve => setTimeout(resolve, 3000));

	/* Exchange this untitled session for a 'real' session */
	const count = _sessionItems.length + 1;
	const newSessionId = `session-${count}`;
	const newSessionItem: vscode.ChatSessionItem = {
		id: newSessionId,
		label: `JoshBot Session ${count}`,
		status: vscode.ChatSessionStatus.Completed
	};
	_sessionItems.push(newSessionItem);
	_chatSessions.set(newSessionId, {
		requestHandler: undefined,
		history: [
			new vscode.ChatRequestTurn2('Create a new session', undefined, [], CHAT_SESSION_TYPE, [], []),
			new vscode.ChatResponseTurn2([new vscode.ChatResponseMarkdownPart(`This is the start of session ${count}\n\n`)], {}, CHAT_SESSION_TYPE) as vscode.ChatResponseTurn
		]
	});
	/* Tell VS Code that we have created a new session and can replace this 'untitled' one with it */
	onDidCommitChatSessionItemEmitter.fire({ original, modified: newSessionItem });
}


function completedChatSessionContent(sessionId: string): vscode.ChatSession {
	const currentResponseParts: Array<vscode.ChatResponseMarkdownPart | vscode.ChatToolInvocationPart> = [];
	currentResponseParts.push(new vscode.ChatResponseMarkdownPart(`Session: ${sessionId}\n`));
	const response2 = new vscode.ChatResponseTurn2(currentResponseParts, {}, CHAT_SESSION_TYPE);
	return {
		history: [
			new vscode.ChatRequestTurn2('hello', undefined, [], CHAT_SESSION_TYPE, [], []),
			response2 as vscode.ChatResponseTurn
		],
		requestHandler: undefined,
		// requestHandler: async (request, context, stream, token) => {
		// 	stream.markdown(`\n\nHello from ${sessionId}`);
		// 	return {};
		// }
	};
}

function inProgressChatSessionContent(sessionId: string): vscode.ChatSession {
	const currentResponseParts: Array<vscode.ChatResponseMarkdownPart | vscode.ChatToolInvocationPart> = [];
	currentResponseParts.push(new vscode.ChatResponseMarkdownPart(`Session: ${sessionId}\n`));
	const response2 = new vscode.ChatResponseTurn2(currentResponseParts, {}, CHAT_SESSION_TYPE);
	return {
		history: [
			new vscode.ChatRequestTurn2('hello', undefined, [], CHAT_SESSION_TYPE, [], []),
			response2 as vscode.ChatResponseTurn
		],
		activeResponseCallback: async (stream, token) => {
			stream.progress(`\n\Still working\n`);
			await new Promise(resolve => setTimeout(resolve, 3000));
			stream.markdown(`2+2=...\n`);
			await new Promise(resolve => setTimeout(resolve, 3000));
			stream.markdown(`4!\n`);
		},
		requestHandler: undefined,
		// requestHandler: async (request, context, stream, token) => {
		// 	stream.markdown(`Hello from ${sessionId}`);
		// 	return {};
		// }
	};
}

function untitledChatSessionContent(sessionId: string): vscode.ChatSession {
	const currentResponseParts: Array<vscode.ChatResponseMarkdownPart | vscode.ChatToolInvocationPart | vscode.ChatResponseConfirmationPart> = [];
	currentResponseParts.push(new vscode.ChatResponseMarkdownPart(`Session: ${sessionId}\n\n`));
	currentResponseParts.push(new vscode.ChatResponseMarkdownPart(`This is an untitled session. Send a message to begin our session.\n`));
	currentResponseParts.push(new vscode.ChatResponseConfirmationPart('Ping?', `Would you like to begin?\n\n`, { step: 'ping' }, ['yes', 'no']));
	const response2 = new vscode.ChatResponseTurn2(currentResponseParts, {}, CHAT_SESSION_TYPE);
	return {
		history: [
			new vscode.ChatRequestTurn2('Howdy', undefined, [], CHAT_SESSION_TYPE, [], []),
			response2 as vscode.ChatResponseTurn
		],
		requestHandler: undefined,
		// requestHandler: async (request, context, stream, token) => {
		// 	stream.markdown(`\n\nHello from ${sessionId}`);
		// 	return {};
		// }
	};
}

export function deactivate() {
	// Cleanup when extension is deactivated
}