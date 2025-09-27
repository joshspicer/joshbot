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

export function activate(context: vscode.ExtensionContext) {
	console.log('JoshBot extension is now active!');
	onDidCommitChatSessionItemEmitter = new vscode.EventEmitter<{ original: vscode.ChatSessionItem; modified: vscode.ChatSessionItem; }>();
	const chatParticipant = vscode.chat.createChatParticipant(CHAT_SESSION_TYPE, async (request, context, stream, token) => {
		if (request.acceptedConfirmationData || request.rejectedConfirmationData) {
			return handleConfirmationData(request, context, stream, token);
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
			// Handle special case for "nice" with long Z string (testing thinking progress)
			const prompt = request.prompt.toLowerCase();
			const hasNice = prompt.includes('nice');
			const hasLongZString = request.prompt.includes('Z'.repeat(5)) || request.prompt.split('Z').length > 10;
			
			if (hasNice && hasLongZString) {
				return handleLongThinkingProcess(request, stream);
			}
			
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

async function handleLongThinkingProcess(request: vscode.ChatRequest, stream: vscode.ChatResponseStream): Promise<void> {
	// Handle the "nice" + long Z string case with thinking progress
	const prompt = request.prompt;
	const zCount = (prompt.match(/Z/g) || []).length;
	
	// Start with a nice response
	stream.markdown(`Nice! I see you've sent me a message with ${zCount.toLocaleString()} Z characters. `);
	stream.markdown(`This looks like a great opportunity to demonstrate thinking progress!\n\n`);
	
	// Use thinking progress to show processing of the long string
	if (stream.thinkingProgress) {
		try {
			// Simulate thinking process with progressive analysis
			stream.thinkingProgress({
				text: "Hmm, this is a very long string of Z's. Let me think about what this means...",
				id: "thinking-1",
				metadata: "initial-analysis"
			});
			
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			stream.thinkingProgress({
				text: "The Z's could represent sleeping, or perhaps it's a stress test for large text handling. Let me count them systematically...",
				id: "thinking-2",
				metadata: "counting-analysis"
			});
			
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			stream.thinkingProgress({
				text: `I count ${zCount.toLocaleString()} Z characters. That's quite a lot! This seems like a test of my ability to handle large inputs efficiently.`,
				id: "thinking-3",
				metadata: "final-analysis"
			});
			
			await new Promise(resolve => setTimeout(resolve, 500));
			
			// Additional thinking step for very large inputs
			if (zCount > 5000) {
				stream.thinkingProgress({
					text: "This is definitely a stress test - over 5,000 characters! I'm handling this gracefully though.",
					id: "thinking-4",
					metadata: "stress-test-analysis"
				});
				
				await new Promise(resolve => setTimeout(resolve, 300));
			}
		} catch (error) {
			// Fallback if thinking progress is not supported
			console.log('Thinking progress not supported, continuing with regular response');
		}
	}
	
	// Provide final response with enhanced analysis
	stream.markdown(`After thinking about it carefully, I believe you're testing my ability to handle large text inputs gracefully. `);
	stream.markdown(`\nThe **${zCount.toLocaleString()}** Z characters could represent:\n`);
	stream.markdown(`- 💤 Someone falling asleep or deep in thought\n`);
	stream.markdown(`- 🧪 A performance test for large text processing\n`);
	stream.markdown(`- 🔄 A stress test of the thinking progress feature\n`);
	stream.markdown(`- 📊 A memory and UI handling test\n\n`);
	
	// Add performance insights
	if (zCount > 1000) {
		stream.markdown(`**Performance Note**: Successfully processed ${zCount.toLocaleString()} characters with thinking progress demonstration.\n\n`);
	}
	
	stream.markdown(`Thanks for the interesting challenge! This was a great test of the thinking progress API. 🤖✨`);
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