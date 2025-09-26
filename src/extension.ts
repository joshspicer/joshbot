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
		
		// Handle test command
		if (request.prompt.toLowerCase().trim() === 'test!') {
			return handleTestCommand(request, context, stream, token);
		}
		
		if (context.chatSessionContext) {
			const { isUntitled } = context.chatSessionContext;
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

	// Register commands
	const testCommand = vscode.commands.registerCommand('joshbot.test', () => {
		vscode.window.showInformationMessage('JoshBot Test! Use "test!" in chat to run the test suite.');
	});
	context.subscriptions.push(testCommand);

	// Create session provider
	const sessionProvider = new class implements vscode.ChatSessionItemProvider, vscode.ChatSessionContentProvider {
		onDidChangeChatSessionItems = new vscode.EventEmitter<void>().event;
		onDidCommitChatSessionItem: vscode.Event<{ original: vscode.ChatSessionItem; modified: vscode.ChatSessionItem; }> = onDidCommitChatSessionItemEmitter.event;
		async provideChatSessionItems(_token: vscode.CancellationToken): Promise<vscode.ChatSessionItem[]> {
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
		async provideChatSessionContent(sessionId: string, _token: vscode.CancellationToken): Promise<vscode.ChatSession> {
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

async function handleTestCommand(request: vscode.ChatRequest, context: vscode.ChatContext, stream: vscode.ChatResponseStream, _token: vscode.CancellationToken): Promise<void> {
	stream.progress('Running tests...\n\n');
	await new Promise(resolve => setTimeout(resolve, 1000));
	
	stream.markdown('🧪 **JoshBot Test Suite** 🧪\n\n');
	
	// Simulate running different types of tests
	const tests = [
		{ name: 'Chat Participant Connection', result: 'PASS' },
		{ name: 'Session Management', result: 'PASS' },
		{ name: 'Confirmation Handling', result: 'PASS' },
		{ name: 'Markdown Rendering', result: 'PASS' },
		{ name: 'Extension Activation', result: 'PASS' }
	];
	
	stream.markdown('Running test suite:\n\n');
	
	for (const test of tests) {
		await new Promise(resolve => setTimeout(resolve, 500));
		const icon = test.result === 'PASS' ? '✅' : '❌';
		stream.markdown(`${icon} ${test.name}: **${test.result}**\n`);
	}
	
	const passedTests = tests.filter(t => t.result === 'PASS').length;
	const totalTests = tests.length;
	
	stream.markdown(`\n📊 **Results**: ${passedTests}/${totalTests} tests passed\n\n`);
	
	if (passedTests === totalTests) {
		stream.markdown('🎉 All tests passed! JoshBot is working correctly.\n');
	} else {
		stream.markdown('⚠️ Some tests failed. Please check the logs.\n');
	}
}

async function handleConfirmationData(request: vscode.ChatRequest, context: vscode.ChatContext, stream: vscode.ChatResponseStream, _token: vscode.CancellationToken): Promise<void> {
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
		activeResponseCallback: async (stream, _token) => {
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