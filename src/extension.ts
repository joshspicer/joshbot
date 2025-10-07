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

// Debug mode utilities
function isDebugMode(): boolean {
	return vscode.workspace.getConfiguration('joshbot').get<boolean>('debugMode', false);
}

function debugLog(message: string, ...args: any[]): void {
	if (isDebugMode()) {
		console.log(`[JoshBot Debug] ${message}`, ...args);
	}
}

export function activate(context: vscode.ExtensionContext) {
	console.log('JoshBot extension is now active!');
	debugLog('Extension activated with debug mode enabled');
	onDidCommitChatSessionItemEmitter = new vscode.EventEmitter<{ original: vscode.ChatSessionItem; modified: vscode.ChatSessionItem; }>();
	const chatParticipant = vscode.chat.createChatParticipant(CHAT_SESSION_TYPE, async (request, chatContext, stream, token) => {
		debugLog(`Processing request with prompt: ${request.prompt}`);
		debugLog(`chatUserPromptSummary: ${chatContext?.chatSummary?.prompt}`);
		debugLog(`chatHistorySummary: ${chatContext?.chatSummary?.history}`);
		console.log(`chatUserPromptSummary: ${chatContext?.chatSummary?.prompt}`);
		console.log(`chatHistorySummary: ${chatContext?.chatSummary?.history}`);
		if (request.command) {
			debugLog(`Handling slash command: ${request.command}`);
			return await handleSlashCommand(request, context, stream, token);
		}
		if (chatContext.chatSessionContext) {
			const { isUntitled, chatSessionItem: original } = chatContext.chatSessionContext;
			debugLog(`Chat session context - ID: ${original.id}, isUntitled: ${isUntitled}`);
			// stream.markdown(`Good day! This is chat session '${original.id}'\n\n`);
			if (request.acceptedConfirmationData || request.rejectedConfirmationData) {
				debugLog('Handling confirmation data');
				return handleConfirmationData(request, chatContext, stream, token);
			}
			if (isUntitled) {
				/* Initial Untitled response */
				debugLog('Showing confirmation for new untitled session');
				stream.confirmation('New Chat Session', `Would you like to begin?\n\n`, { step: 'create' }, ['yes', 'no']);
				return;

			} else {
				/* follow up */
				debugLog('Processing follow-up message in existing session');
				stream.markdown(`Welcome back!`)
			}
		} else {
			/*general query*/
			debugLog('Processing general query without session context');
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
			debugLog(`Providing chat session content for: ${sessionId}`);
			switch (sessionId) {
				case 'demo-session-01':
				case 'demo-session-02':
					return completedChatSessionContent(sessionId);
				case 'demo-session-03':
					return inProgressChatSessionContent(sessionId);
				default:
					const existing = _chatSessions.get(sessionId);
					if (existing) {
						debugLog(`Returning existing session: ${sessionId}`);
						return existing;
					}
					// Guess this is an untitled session. Play along.
					debugLog(`Creating untitled session: ${sessionId}`);
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
		case 'debug': {
			const config = vscode.workspace.getConfiguration('joshbot');
			const currentDebugMode = config.get<boolean>('debugMode', false);
			
			if (parts.length > 0) {
				const action = parts[0].toLowerCase();
				if (action === 'on' || action === 'enable' || action === 'true') {
					await config.update('debugMode', true, vscode.ConfigurationTarget.Global);
					stream.markdown('✅ Debug mode **enabled**. Verbose logging is now active.');
					debugLog('Debug mode enabled via /debug command');
				} else if (action === 'off' || action === 'disable' || action === 'false') {
					await config.update('debugMode', false, vscode.ConfigurationTarget.Global);
					stream.markdown('❌ Debug mode **disabled**. Verbose logging is now inactive.');
				} else {
					stream.warning('Usage: /debug [on|off|enable|disable]\nOr use /debug to view current status.');
				}
			} else {
				// Show current status
				const status = currentDebugMode ? '**enabled** ✅' : '**disabled** ❌';
				stream.markdown(`Debug mode is currently ${status}\n\nUse \`/debug on\` to enable or \`/debug off\` to disable.`);
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
	const results: Array<{ step: string; accepted: boolean }> = [];
	results.push(...(request.acceptedConfirmationData?.map(data => ({ step: data.step, accepted: true })) ?? []));
	results.push(...((request.rejectedConfirmationData ?? []).filter(data => !results.some(r => r.step === data.step)).map(data => ({ step: data.step, accepted: false }))));
	debugLog(`Processing ${results.length} confirmation result(s)`);
	for (const data of results) {
		debugLog(`Confirmation step: ${data.step}, accepted: ${data.accepted}`);
		switch (data.step) {
			case 'create':
				await handleCreation(data.accepted, request, context, stream);
				break;
			default:
				stream.markdown(`Unknown confirmation step: ${data.step}\n\n`);
				break;
		}
	}
}

async function handleCreation(accepted: boolean, request: vscode.ChatRequest, context: vscode.ChatContext, stream: vscode.ChatResponseStream): Promise<void> {
	debugLog(`handleCreation called with accepted: ${accepted}`);
	if (!accepted) {
		debugLog('Session creation rejected by user');
		stream.warning(`New session was not created.\n\n`);
		return;
	}

	const original = context.chatSessionContext?.chatSessionItem;
	if (!original || !context.chatSessionContext?.isUntitled) {
		debugLog('Cannot create session - not an untitled session');
		stream.warning(`Cannot create new session - this is not an untitled session!.\n\n`);
		return;
	}

	debugLog('Creating new session...');
	stream.progress(`Creating new session...\n\n`);
	await new Promise(resolve => setTimeout(resolve, 3000));

	/* Exchange this untitled session for a 'real' session */
	const count = _sessionItems.length + 1;
	const newSessionId = `session-${count}`;
	debugLog(`New session ID: ${newSessionId}`);
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
	debugLog(`Committing session ${newSessionId}`);
	onDidCommitChatSessionItemEmitter.fire({ original, modified: newSessionItem });
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