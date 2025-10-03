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
	const chatParticipant = vscode.chat.createChatParticipant(CHAT_SESSION_TYPE, async (request, chatContext, stream, token) => {
		console.log(`chatUserPromptSummary: ${chatContext?.chatSummary?.prompt}`);
		console.log(`chatHistorySummary: ${chatContext?.chatSummary?.history}`);
		if (request.command) {
			return await handleSlashCommand(request, context, stream, token);
		}
		if (chatContext.chatSessionContext) {
			const { isUntitled, chatSessionItem: original } = chatContext.chatSessionContext;
			// stream.markdown(`Good day! This is chat session '${original.id}'\n\n`);
			if (request.acceptedConfirmationData || request.rejectedConfirmationData) {
				return handleConfirmationData(request, chatContext, stream, token);
			}
			if (isUntitled) {
				/* Initial Untitled response */
				stream.confirmation('New Chat Session', `Would you like to begin?\n\n`, { step: 'create' }, ['yes', 'no']);
				return;

			} else {
				/* follow up */
				stream.markdown(`Welcome back! What would you like to do today?\n\n`);
				stream.confirmation('Delete Session', `Would you like to delete this session?\n\n`, { step: 'delete', sessionId: original.id }, ['Delete', 'Cancel']);
				stream.confirmation('Rename Session', `Would you like to rename this session?\n\n`, { step: 'rename', sessionId: original.id, currentLabel: original.label }, ['Rename', 'Cancel']);
				stream.confirmation('Export Session', `Would you like to export this session data?\n\n`, { step: 'export', sessionId: original.id }, ['Export', 'Cancel']);
				stream.confirmation('Clear History', `Would you like to clear the chat history for this session?\n\n`, { step: 'clearHistory', sessionId: original.id }, ['Clear', 'Cancel']);
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

async function handleSlashCommand(request: vscode.ChatRequest, extContext: vscode.ExtensionContext | undefined, stream: vscode.ChatResponseStream, token: vscode.CancellationToken): Promise<void> {
	if (!extContext) {
		stream.warning('Extension context unavailable');
		return;
	}

	const parts = request.prompt.trim().split(/\s+/);
	const command = request.command;

	switch (command) {
		case 'set-secret': {
			if (parts.length < 2) {
				stream.warning('Usage: /set-secret <key> <value>');
				return;
			}
			const key = parts[0];
			const value = parts.slice(1).join(' ');
			try {
				await extContext.secrets.store(key, value);
				stream.markdown(`Stored secret **${escapeMarkdown(key)}** (value hidden).`);
			} catch (err: any) {
				stream.warning(`Failed to store secret: ${err?.message ?? err}`);
			}
			return;
		}
		case 'secrets': {
			try {
				const keys = await extContext.secrets.keys();
				if (keys.length === 0) {
					stream.markdown('No secrets stored. Use /set-secret <key> <value> to add one.');
				} else {
					stream.markdown('Stored secret keys:\n');
					for (const k of keys) {
						stream.markdown(`- ${escapeMarkdown(k)}\n`);
					}
				}
			} catch (err: any) {
				stream.warning(`Failed to read secrets: ${err?.message ?? err}`);
			}
			return;
		}
		default:
			stream.warning(`Unknown command: ${command}`);
			return;
	}
}

function escapeMarkdown(value: string): string {
	return value.replace(/[\\`*_{}\[\]()#+\-.!]/g, '\\$&');
}

async function handleConfirmationData(request: vscode.ChatRequest, context: vscode.ChatContext, stream: vscode.ChatResponseStream, token: vscode.CancellationToken): Promise<void> {
	const results: Array<{ step: string; accepted: boolean; data: any }> = [];
	results.push(...(request.acceptedConfirmationData?.map(data => ({ step: data.step, accepted: true, data })) ?? []));
	results.push(...((request.rejectedConfirmationData ?? []).filter(data => !results.some(r => r.step === data.step)).map(data => ({ step: data.step, accepted: false, data }))));
	for (const result of results) {
		switch (result.step) {
			case 'create':
				await handleCreation(result.accepted, request, context, stream);
				break;
			case 'delete':
				await handleDeletion(result.accepted, result.data, context, stream);
				break;
			case 'rename':
				await handleRename(result.accepted, result.data, request, context, stream);
				break;
			case 'export':
				await handleExport(result.accepted, result.data, context, stream);
				break;
			case 'clearHistory':
				await handleClearHistory(result.accepted, result.data, context, stream);
				break;
			default:
				stream.markdown(`Unknown confirmation step: ${result.step}\n\n`);
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
			new vscode.ChatRequestTurn2('Create a new session', undefined, [], 'joshbot', [], []),
			new vscode.ChatResponseTurn2([new vscode.ChatResponseMarkdownPart(`This is the start of session ${count}\n\n`)], {}, 'joshbot') as vscode.ChatResponseTurn
		]
	});
	/* Tell VS Code that we have created a new session and can replace this 'untitled' one with it */
	onDidCommitChatSessionItemEmitter.fire({ original, modified: newSessionItem });
}

async function handleDeletion(accepted: boolean, data: any, context: vscode.ChatContext, stream: vscode.ChatResponseStream): Promise<void> {
	if (!accepted) {
		stream.markdown(`Session deletion cancelled.\n\n`);
		return;
	}

	const sessionId = data.sessionId;
	if (!sessionId) {
		stream.warning(`Cannot delete session - no session ID provided.\n\n`);
		return;
	}

	stream.progress(`Deleting session ${escapeMarkdown(sessionId)}...\n\n`);
	await new Promise(resolve => setTimeout(resolve, 2000));

	// Find and remove the session from our collections
	const index = _sessionItems.findIndex(item => item.id === sessionId);
	if (index !== -1) {
		_sessionItems.splice(index, 1);
		_chatSessions.delete(sessionId);
		stream.markdown(`✅ Session **${escapeMarkdown(sessionId)}** has been deleted successfully.\n\n`);
	} else {
		stream.warning(`Session **${escapeMarkdown(sessionId)}** not found in dynamic sessions.\n\n`);
	}
}

async function handleRename(accepted: boolean, data: any, request: vscode.ChatRequest, context: vscode.ChatContext, stream: vscode.ChatResponseStream): Promise<void> {
	if (!accepted) {
		stream.markdown(`Session rename cancelled.\n\n`);
		return;
	}

	const sessionId = data.sessionId;
	const currentLabel = data.currentLabel || 'Unknown';
	
	if (!sessionId) {
		stream.warning(`Cannot rename session - no session ID provided.\n\n`);
		return;
	}

	// Generate a new name with timestamp
	const timestamp = new Date().toLocaleString();
	const newName = `JoshBot Session - ${timestamp}`;

	stream.progress(`Renaming session...\n\n`);
	await new Promise(resolve => setTimeout(resolve, 1500));

	// Find and update the session
	const sessionItem = _sessionItems.find(item => item.id === sessionId);
	if (sessionItem) {
		// Create a copy of the original state before modification
		const originalItem: vscode.ChatSessionItem = { ...sessionItem };
		
		sessionItem.label = newName;
		stream.markdown(`✅ Session renamed from **${escapeMarkdown(originalItem.label)}** to **${escapeMarkdown(newName)}**\n\n`);
		
		// Notify VS Code about the change
		onDidCommitChatSessionItemEmitter.fire({ original: originalItem, modified: sessionItem });
	} else {
		stream.warning(`Session **${escapeMarkdown(sessionId)}** not found in dynamic sessions.\n\n`);
	}
}

async function handleExport(accepted: boolean, data: any, context: vscode.ChatContext, stream: vscode.ChatResponseStream): Promise<void> {
	if (!accepted) {
		stream.markdown(`Session export cancelled.\n\n`);
		return;
	}

	const sessionId = data.sessionId;
	if (!sessionId) {
		stream.warning(`Cannot export session - no session ID provided.\n\n`);
		return;
	}

	stream.progress(`Exporting session ${escapeMarkdown(sessionId)}...\n\n`);
	await new Promise(resolve => setTimeout(resolve, 2000));

	// Get the session data
	const session = _chatSessions.get(sessionId);
	const sessionItem = _sessionItems.find(item => item.id === sessionId);
	
	if (session || sessionItem) {
		stream.markdown(`### 📦 Session Export\n\n`);
		stream.markdown(`**Session ID:** ${escapeMarkdown(sessionId)}\n\n`);
		
		if (sessionItem) {
			stream.markdown(`**Label:** ${escapeMarkdown(sessionItem.label)}\n\n`);
			stream.markdown(`**Status:** ${sessionItem.status === vscode.ChatSessionStatus.Completed ? 'Completed' : sessionItem.status === vscode.ChatSessionStatus.InProgress ? 'In Progress' : 'Failed'}\n\n`);
		}
		
		if (session && session.history) {
			stream.markdown(`**History entries:** ${session.history.length}\n\n`);
			stream.markdown(`\`\`\`json\n${JSON.stringify({ sessionId, label: sessionItem?.label, historyCount: session.history.length }, null, 2)}\n\`\`\`\n\n`);
		}
		
		stream.markdown(`✅ Session data exported successfully.\n\n`);
	} else {
		stream.warning(`Session **${escapeMarkdown(sessionId)}** not found.\n\n`);
	}
}

async function handleClearHistory(accepted: boolean, data: any, context: vscode.ChatContext, stream: vscode.ChatResponseStream): Promise<void> {
	if (!accepted) {
		stream.markdown(`Clear history cancelled.\n\n`);
		return;
	}

	const sessionId = data.sessionId;
	if (!sessionId) {
		stream.warning(`Cannot clear history - no session ID provided.\n\n`);
		return;
	}

	stream.progress(`Clearing history for session ${escapeMarkdown(sessionId)}...\n\n`);
	await new Promise(resolve => setTimeout(resolve, 1500));

	// Clear the session history by creating a new session with empty history
	const oldSession = _chatSessions.get(sessionId);
	if (oldSession) {
		// Replace the session with a new one that has empty history
		_chatSessions.set(sessionId, {
			requestHandler: oldSession.requestHandler,
			history: []
		});
		stream.markdown(`✅ Chat history cleared for session **${escapeMarkdown(sessionId)}**. Starting fresh!\n\n`);
	} else {
		stream.warning(`Session **${escapeMarkdown(sessionId)}** not found in dynamic sessions.\n\n`);
	}
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