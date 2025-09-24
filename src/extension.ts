/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

const CHAT_SESSION_TYPE = 'josh-bot';

// Dynamically created sessions
const _sessionItems: vscode.ChatSessionItem[] = [];
const _chatSessions: Map<string, vscode.ChatSession> = new Map();

export function activate(context: vscode.ExtensionContext) {
	console.log('JoshBot extension is now active!');

	const onDidCreateChatSessionItemEmitter = new vscode.EventEmitter<{ original: vscode.ChatSessionItem; modified: vscode.ChatSessionItem; }>();
	// Create a simple chat participant
	const chatParticipant = vscode.chat.createChatParticipant(CHAT_SESSION_TYPE, async (request, context, stream, token) => {
		if (context.chatSessionContext) {
			const { isUntitled, chatSessionItem: original } = context.chatSessionContext;
			stream.markdown(`Good day! This is chat session '${original.id}'\n\n`);
			if (isUntitled) {
				const count = _sessionItems.length + 1;
				/* Exchange this untitled session for a 'real' session */
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
						new vscode.ChatRequestTurn2(request.prompt, undefined, [], 'joshbot', [], []),
						new vscode.ChatResponseTurn2([new vscode.ChatResponseMarkdownPart(`This is the start of session ${count}\n\n`)], {}, 'joshbot') as vscode.ChatResponseTurn
					]
				});
				/* Tell VS Code that we have created a new session and can replace this 'untitled' one with it */
				onDidCreateChatSessionItemEmitter.fire({ original , modified: newSessionItem });
			} else {
				/* follow up */
				stream.markdown(`Welcome back!`)
			}
		} else {
			/*general query*/
			stream.markdown(`Howdy! I am joshbot, your friendly chat companion.`);
		}
	});
	context.subscriptions.push(chatParticipant);

	// Create session provider
	const sessionProvider = new class implements vscode.ChatSessionItemProvider, vscode.ChatSessionContentProvider {
		onDidChangeChatSessionItems = new vscode.EventEmitter<void>().event;
		onDidCreateChatSessionItem: vscode.Event<{ original: vscode.ChatSessionItem; modified: vscode.ChatSessionItem; }> = onDidCreateChatSessionItemEmitter.event;
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

function completedChatSessionContent(sessionId: string): vscode.ChatSession {
	const currentResponseParts: Array<vscode.ChatResponseMarkdownPart | vscode.ChatToolInvocationPart> = [];
	currentResponseParts.push(new vscode.ChatResponseMarkdownPart(`Session: ${sessionId}\n`));
	const response2 = new vscode.ChatResponseTurn2(currentResponseParts, {}, 'joshbot');
	return {
		history: [
			new vscode.ChatRequestTurn2('hello', undefined, [], 'joshbot', [], []),
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
	const response2 = new vscode.ChatResponseTurn2(currentResponseParts, {}, 'joshbot');
	return {
		history: [
			new vscode.ChatRequestTurn2('hello', undefined, [], 'joshbot', [], []),
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
	const currentResponseParts: Array<vscode.ChatResponseMarkdownPart | vscode.ChatToolInvocationPart> = [];
	currentResponseParts.push(new vscode.ChatResponseMarkdownPart(`Session: ${sessionId}\n\n`));
	currentResponseParts.push(new vscode.ChatResponseMarkdownPart(`This is an untitled session. Send a message to begin our session.\n`));
	const response2 = new vscode.ChatResponseTurn2(currentResponseParts, {}, 'joshbot');
	return {
		history: [
			new vscode.ChatRequestTurn2('Howdy', undefined, [], 'joshbot', [], []),
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