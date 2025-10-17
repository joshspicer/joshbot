/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

const CHAT_SESSION_TYPE = 'josh-bot';

// Dynamically created sessions
const _sessionItems: vscode.ChatSessionItem[] = [];
const _chatSessions: Map<string, vscode.ChatSession> = new Map();

// For now, just model.
const _sessionModel: Map<string, vscode.LanguageModelChatInformation | undefined> = new Map();

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
				stream.markdown(`Welcome back! This is served by model: **${_sessionModel.get(original.id)?.name ?? 'unknown'}**\n\n`);
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

		// Available models for session options
		availableModels: vscode.LanguageModelChatInformation[] = [
			{
				id: 'joshbot-basic',
				name: 'JoshBot Basic',
				family: 'joshbot',
				tooltip: 'A friendly and helpful basic model for everyday conversations',
				detail: 'Entry-level assistant',
				version: '1.0.0',
				maxInputTokens: 4096,
				maxOutputTokens: 1024,
				capabilities: {}
			},
			{
				id: 'joshbot-pro',
				name: 'JoshBot Pro',
				family: 'joshbot',
				tooltip: 'Advanced JoshBot with enhanced capabilities including tool calling',
				detail: 'Professional grade',
				version: '2.1.5',
				maxInputTokens: 8192,
				maxOutputTokens: 2048,
				capabilities: {}
			},
			{
				id: 'joshbot-ultra',
				name: 'JoshBot Ultra',
				family: 'joshbot',
				tooltip: 'The most advanced JoshBot model with multimodal capabilities',
				detail: 'Ultimate experience',
				version: '3.0.2',
				maxInputTokens: 16384,
				maxOutputTokens: 4096,
				capabilities: {}
			}
		];

		async provideChatSessionItems(token: vscode.CancellationToken): Promise<vscode.ChatSessionItem[]> {
			return [
				{
					id: 'demo-session-01',
					label: 'JoshBot Demo Session 01',
					resource: vscode.Uri.parse('vscode-chat-session://joshbot/demo-session-01'),
					status: vscode.ChatSessionStatus.Completed
				},
				{
					id: 'demo-session-02',
					label: 'JoshBot Demo Session 02',
					resource: vscode.Uri.parse('vscode-chat-session://joshbot/demo-session-02'),
					status: vscode.ChatSessionStatus.Completed
				},
				{
					id: 'demo-session-03',
					label: 'JoshBot Demo Session 03',
					resource: vscode.Uri.parse('vscode-chat-session://joshbot/demo-session-03'),
					status: vscode.ChatSessionStatus.InProgress
				},
				..._sessionItems,
			];
		}
		async provideChatSessionContent(sessionId: string, token: vscode.CancellationToken): Promise<vscode.ChatSession> {
			// Set default model
			if (!_sessionModel.get(sessionId)) {
				_sessionModel.set(sessionId, this.availableModels[0]);
			}
			switch (sessionId) {
				case 'demo-session-01':
				case 'demo-session-02':
					return completedChatSessionContent(sessionId);
				case 'demo-session-03':
					return inProgressChatSessionContent(sessionId);
				default:
					const existing = _chatSessions.get(sessionId);
					if (existing) {
						// Ensure options are returned from stored session options when present
						return existing;
					}
					// Guess this is an untitled session. Play along.
					return untitledChatSessionContent(sessionId);
			}
		}

		async provideChatSessionProviderOptions(token: vscode.CancellationToken): Promise<vscode.ChatSessionProviderOptions> {
			return {
				models: this.availableModels
			};
		}

		// Handle option changes for a session (store current state in a map)
		provideHandleOptionsChange(sessionId: string, updates: ReadonlyArray<vscode.ChatSessionOptionUpdate>, token: vscode.CancellationToken): void {
			for (const update of updates) {
				if (update.optionId === 'model') {
					if (typeof update.value === 'undefined') {
						_sessionModel.set(sessionId, undefined);
					} else {
						const model = this.availableModels.find(m => m.id === update.value);
						_sessionModel.set(sessionId, model);
					}
				}
			}
		}
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
	const results: Array<{ step: string; accepted: boolean }> = [];
	results.push(...(request.acceptedConfirmationData?.map(data => ({ step: data.step, accepted: true })) ?? []));
	results.push(...((request.rejectedConfirmationData ?? []).filter(data => !results.some(r => r.step === data.step)).map(data => ({ step: data.step, accepted: false }))));
	for (const data of results) {
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
		resource: vscode.Uri.parse(`vscode-chat-session://joshbot/newSessionId`),
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
		,
		options: { model: _sessionModel.get(newSessionId) }
	});
	/* Tell VS Code that we have created a new session and can replace this 'untitled' one with it */
	onDidCommitChatSessionItemEmitter.fire({ original, modified: newSessionItem });
}


function completedChatSessionContent(sessionId: string): vscode.ChatSession {
	const currentResponseParts: Array<vscode.ChatResponseMarkdownPart | vscode.ChatToolInvocationPart> = [];
	currentResponseParts.push(new vscode.ChatResponseMarkdownPart(`Session: ${sessionId}\n`));
	const response2 = new vscode.ChatResponseTurn2(currentResponseParts, {}, 'joshbot');
	const currentModel = _sessionModel.get(sessionId);
	return {
		history: [
			new vscode.ChatRequestTurn2(`hello. Using model: ${currentModel?.name}`, undefined, [], 'joshbot', [], []),
			response2 as vscode.ChatResponseTurn
		],
		requestHandler: undefined,
		options: { model: currentModel },
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
		options: { model: _sessionModel.get(sessionId) },
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
		options: { model: _sessionModel.get(sessionId) },
		// requestHandler: async (request, context, stream, token) => {
		// 	stream.markdown(`\n\nHello from ${sessionId}`);
		// 	return {};
		// }
	};
}

export function deactivate() {
	// Cleanup when extension is deactivated
}