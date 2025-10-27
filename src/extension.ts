/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as l10n from '@vscode/l10n';

const CHAT_SESSION_TYPE = 'josh-bot';

// Dynamically created sessions
const _sessionItems: vscode.ChatSessionItem[] = [];
const _chatSessions: Map<string, vscode.ChatSession> = new Map();
const _sessionOptions: Map<string, vscode.ChatSessionOptions> = new Map();

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
				stream.confirmation(l10n.t('New Chat Session'), l10n.t('Would you like to begin?\n\n'), { step: 'create' }, ['yes', 'no']);
				return;

			} else {
				/* follow up */
				stream.markdown(l10n.t('Welcome back!'))
			}
		} else {
			/*general query*/
			stream.markdown(l10n.t('Howdy! I am joshbot, your friendly chat companion.'));
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

		async provideHandleOptionsChange(sessionId: string, options: vscode.ChatSessionOptions, token: vscode.CancellationToken): Promise<void> {
			// Store the new options for this session
			_sessionOptions.set(sessionId, options);
			
			// Log the model change for debugging
			if (options.model) {
				console.log(`Session ${sessionId} model changed to: ${options.model.id} (${options.model.family})`);
			}
			
			// Note: The session object will retrieve the new options from _sessionOptions Map
			// on the next call to provideChatSessionContent. We don't update _chatSessions
			// directly to avoid losing object identity and potential side effects.
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
		stream.warning(l10n.t('Extension context unavailable'));
		return;
	}

	const parts = request.prompt.trim().split(/\s+/);
	const command = request.command;

	switch (command) {
		case 'set-secret': {
			if (parts.length < 2) {
				stream.warning(l10n.t('Usage: /set-secret <key> <value>'));
				return;
			}
			const key = parts[0];
			const value = parts.slice(1).join(' ');
			try {
				await extContext.secrets.store(key, value);
				stream.markdown(l10n.t('Stored secret **{0}** (value hidden).', escapeMarkdown(key)));
			} catch (err: any) {
				stream.warning(l10n.t('Failed to store secret: {0}', err?.message ?? err));
			}
			return;
		}
		case 'secrets': {
			try {
				const keys = await extContext.secrets.keys();
				if (keys.length === 0) {
					stream.markdown(l10n.t('No secrets stored. Use /set-secret <key> <value> to add one.'));
				} else {
					stream.markdown(l10n.t('Stored secret keys:\n'));
					for (const k of keys) {
						stream.markdown(`- ${escapeMarkdown(k)}\n`);
					}
				}
			} catch (err: any) {
				stream.warning(l10n.t('Failed to read secrets: {0}', err?.message ?? err));
			}
			return;
		}
		default:
			stream.warning(l10n.t('Unknown command: {0}', command ?? ''));
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
				stream.markdown(l10n.t('Unknown confirmation step: {0}\n\n', data.step));
				break;
		}
	}
}

async function handleCreation(accepted: boolean, request: vscode.ChatRequest, context: vscode.ChatContext, stream: vscode.ChatResponseStream): Promise<void> {
	if (!accepted) {
		stream.warning(l10n.t('New session was not created.\n\n'));
		return;
	}

	const original = context.chatSessionContext?.chatSessionItem;
	if (!original || !context.chatSessionContext?.isUntitled) {
		stream.warning(l10n.t('Cannot create new session - this is not an untitled session!.\n\n'));
		return;
	}

	stream.progress(l10n.t('Creating new session...\n\n'));
	await new Promise(resolve => setTimeout(resolve, 3000));

	/* Exchange this untitled session for a 'real' session */
	const count = _sessionItems.length + 1;
	const newSessionId = `session-${count}`;
	const newSessionItem: vscode.ChatSessionItem = {
		id: newSessionId,
		label: l10n.t('JoshBot Session {0}', count),
		status: vscode.ChatSessionStatus.Completed
	};
	_sessionItems.push(newSessionItem);
	
	// Transfer options from the untitled session to the new session
	const untitledOptions = _sessionOptions.get(original.id);
	if (untitledOptions) {
		_sessionOptions.set(newSessionId, untitledOptions);
		// Clean up the untitled session options to avoid memory leaks
		_sessionOptions.delete(original.id);
	}
	
	_chatSessions.set(newSessionId, {
		requestHandler: undefined,
		history: [
			new vscode.ChatRequestTurn2(l10n.t('Create a new session'), undefined, [], 'joshbot', [], []),
			new vscode.ChatResponseTurn2([new vscode.ChatResponseMarkdownPart(l10n.t('This is the start of session {0}\n\n', count))], {}, 'joshbot') as vscode.ChatResponseTurn
		],
		options: untitledOptions
	});
	/* Tell VS Code that we have created a new session and can replace this 'untitled' one with it */
	onDidCommitChatSessionItemEmitter.fire({ original, modified: newSessionItem });
}


function completedChatSessionContent(sessionId: string): vscode.ChatSession {
	const currentResponseParts: Array<vscode.ChatResponseMarkdownPart | vscode.ChatToolInvocationPart> = [];
	currentResponseParts.push(new vscode.ChatResponseMarkdownPart(l10n.t('Session: {0}\n', sessionId)));
	const response2 = new vscode.ChatResponseTurn2(currentResponseParts, {}, 'joshbot');
	
	// Get stored options for this session, if any
	const options = _sessionOptions.get(sessionId);
	
	return {
		history: [
			new vscode.ChatRequestTurn2(l10n.t('hello'), undefined, [], 'joshbot', [], []),
			response2 as vscode.ChatResponseTurn
		],
		requestHandler: undefined,
		options: options,
		// requestHandler: async (request, context, stream, token) => {
		// 	stream.markdown(`\n\nHello from ${sessionId}`);
		// 	return {};
		// }
	};
}

function inProgressChatSessionContent(sessionId: string): vscode.ChatSession {
	const currentResponseParts: Array<vscode.ChatResponseMarkdownPart | vscode.ChatToolInvocationPart> = [];
	currentResponseParts.push(new vscode.ChatResponseMarkdownPart(l10n.t('Session: {0}\n', sessionId)));
	const response2 = new vscode.ChatResponseTurn2(currentResponseParts, {}, 'joshbot');
	
	// Get stored options for this session, if any
	const options = _sessionOptions.get(sessionId);
	
	return {
		history: [
			new vscode.ChatRequestTurn2(l10n.t('hello'), undefined, [], 'joshbot', [], []),
			response2 as vscode.ChatResponseTurn
		],
		activeResponseCallback: async (stream, token) => {
			stream.progress(l10n.t('\n\Still working\n'));
			await new Promise(resolve => setTimeout(resolve, 3000));
			stream.markdown(l10n.t('2+2=...\n'));
			await new Promise(resolve => setTimeout(resolve, 3000));
			stream.markdown(l10n.t('4!\n'));
		},
		requestHandler: undefined,
		options: options,
		// requestHandler: async (request, context, stream, token) => {
		// 	stream.markdown(`Hello from ${sessionId}`);
		// 	return {};
		// }
	};
}

function untitledChatSessionContent(sessionId: string): vscode.ChatSession {
	const currentResponseParts: Array<vscode.ChatResponseMarkdownPart | vscode.ChatToolInvocationPart> = [];
	currentResponseParts.push(new vscode.ChatResponseMarkdownPart(l10n.t('Session: {0}\n\n', sessionId)));
	currentResponseParts.push(new vscode.ChatResponseMarkdownPart(l10n.t('This is an untitled session. Send a message to begin our session.\n')));
	const response2 = new vscode.ChatResponseTurn2(currentResponseParts, {}, 'joshbot');
	
	// Get stored options for this session, if any
	const options = _sessionOptions.get(sessionId);
	
	return {
		history: [
			new vscode.ChatRequestTurn2(l10n.t('Howdy'), undefined, [], 'joshbot', [], []),
			response2 as vscode.ChatResponseTurn
		],
		requestHandler: undefined,
		options: options,
		// requestHandler: async (request, context, stream, token) => {
		// 	stream.markdown(`\n\nHello from ${sessionId}`);
		// 	return {};
		// }
	};
}

export function deactivate() {
	// Cleanup when extension is deactivated
}