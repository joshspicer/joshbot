/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

// Must match package.json's "contributes.chatSessions.[0].id"
const CHAT_SESSION_TYPE = 'josh-bot';

export interface IChatPullRequestContent {
	uri: vscode.Uri;
	title: string;
	description: string;
	author: string;
	linkTag: string;
}

class JoshBotUriHandler implements vscode.UriHandler {
	handleUri(uri: vscode.Uri): vscode.ProviderResult<void> {
		const query = new URLSearchParams(uri.query);
		const command = uri.path;

		// Just show an information message box
		vscode.window.showInformationMessage(`JoshBot URI command received: ${command}`);
	}
}

export function activate(context: vscode.ExtensionContext) {
	console.log('JoshBot extension is now active!');

	// Initialize session manager
	const sessionManager = JoshBotSessionManager.getInstance();
	sessionManager.initialize(context);

	// Register basic commands
	context.subscriptions.push(vscode.commands.registerCommand('joshbot.hello', () => {
		vscode.window.showInformationMessage('Hello from JoshBot!');
	}));

	context.subscriptions.push(vscode.window.registerUriHandler(new JoshBotUriHandler()));

	context.subscriptions.push(vscode.commands.registerCommand('joshbot.cloudButton', async (): Promise<IChatPullRequestContent> => {
		return {
			uri: vscode.Uri.parse(`${vscode.env.uriScheme}://spcr-test.joshbot/test`),
			title: 'Pull request by JoshBot',
			description: 'This is the description of the pull request created by JoshBot.',
			author: 'Author Name',
			linkTag: 'PR-123'
		}
	}));

	// Session management commands to exercise API functionality
	context.subscriptions.push(vscode.commands.registerCommand('joshbot.createSession', async () => {
		const name = await vscode.window.showInputBox({ prompt: 'Enter session name' });
		const id = await sessionManager.createNewSession(name);
		vscode.window.showInformationMessage(`Created session: ${id}`);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('joshbot.deleteSession', async () => {
		const sessions = await sessionManager.getSessionItems(new vscode.CancellationTokenSource().token);
		const sessionLabels = sessions.map(s => ({ label: s.label, id: s.id }));
		const selected = await vscode.window.showQuickPick(sessionLabels, { placeHolder: 'Select session to delete' });
		if (selected) {
			await sessionManager.deleteSession(selected.id);
			vscode.window.showInformationMessage(`Deleted session: ${selected.label}`);
		}
	}));

	// Test error handling
	context.subscriptions.push(vscode.commands.registerCommand('joshbot.testError', async () => {
		try {
			await sessionManager.getSessionContent('non-existent', new vscode.CancellationTokenSource().token);
		} catch (error) {
			vscode.window.showErrorMessage(`Error handled correctly: ${error instanceof Error ? error.message : String(error)}`);
		}
	}));

	// Register chat session providers
	const provider = new class implements vscode.ChatSessionItemProvider, vscode.ChatSessionContentProvider {
		label = vscode.l10n.t('JoshBot');
		onDidChangeChatSessionItems = sessionManager.onDidChangeChatSessionItems;
		
		provideChatSessionItems = async (token: vscode.CancellationToken) => {
			return await sessionManager.getSessionItems(token);
		};
		
		provideChatSessionContent = async (id: string, token: vscode.CancellationToken) => {
			return await sessionManager.getSessionContent(id, token);
		};
	};

	context.subscriptions.push(vscode.chat.registerChatSessionItemProvider(CHAT_SESSION_TYPE, provider));
	context.subscriptions.push(vscode.chat.registerChatSessionContentProvider(CHAT_SESSION_TYPE, provider));
}

interface JoshBotSession extends vscode.ChatSession {
	id: string;
	name: string;
	iconPath?: vscode.Uri | { light: vscode.Uri; dark: vscode.Uri };
}

class JoshBotSessionManager {
	private static instance: JoshBotSessionManager;
	private _sessions: Map<string, JoshBotSession> = new Map();
	private _onDidChangeChatSessionItems = new vscode.EventEmitter<void>();
	
	readonly onDidChangeChatSessionItems = this._onDidChangeChatSessionItems.event;

	static getInstance(): JoshBotSessionManager {
		if (!JoshBotSessionManager.instance) {
			JoshBotSessionManager.instance = new JoshBotSessionManager();
		}
		return JoshBotSessionManager.instance;
	}

	initialize(_context: vscode.ExtensionContext): void {
		this.createDemoSessions();
	}

	private createDemoSessions(): void {
		// Sample response for history
		const sampleResponse = new vscode.ChatResponseTurn2(
			[new vscode.ChatResponseMarkdownPart('Hello! I\'m JoshBot.')], 
			{}, 
			'joshbot'
		);

		// 1. Read-only session (no request handler)
		this._sessions.set('readonly', {
			id: 'readonly',
			name: '📖 Read-only History',
			history: [
				new vscode.ChatRequestTurn2('What can you do?', undefined, [], 'joshbot', [], []),
				sampleResponse as vscode.ChatResponseTurn
			],
			requestHandler: undefined // Read-only!
		});

		// 2. Interactive session with simple echo
		this._sessions.set('interactive', {
			id: 'interactive',
			name: '💬 Interactive Chat',
			history: [],
			requestHandler: async (request, _context, stream, _token) => {
				stream.markdown(`**Echo:** ${request.prompt}`);
				return { metadata: { command: '', sessionId: 'interactive' } };
			}
		});

		// 3. Session with active streaming response
		this._sessions.set('streaming', {
			id: 'streaming',
			name: '⚡ Live Streaming',
			history: [
				new vscode.ChatRequestTurn2('Start streaming', undefined, [], 'joshbot', [], []),
				sampleResponse as vscode.ChatResponseTurn
			],
			requestHandler: async (request, _context, stream, _token) => {
				await new Promise(resolve => setTimeout(resolve, 500));
				stream.markdown(`**Processing:** ${request.prompt}`);
				return { metadata: { command: '', sessionId: 'streaming' } };
			}
		});

		this._onDidChangeChatSessionItems.fire();
	}

	async getSessionContent(id: string, _token: vscode.CancellationToken): Promise<vscode.ChatSession> {
		const session = this._sessions.get(id);
		if (!session) {
			throw new Error(`Session '${id}' not found`);
		}

		// Add active streaming for the streaming session
		if (id === 'streaming') {
			return {
				...session,
				activeResponseCallback: async (stream) => {
					for (let i = 1; i <= 3; i++) {
						stream.markdown(`\n⏳ Processing step ${i}/3...`);
						await new Promise(resolve => setTimeout(resolve, 800));
					}
					stream.markdown('\n✅ Complete!');
				}
			};
		}

		return session;
	}

	async createNewSession(name?: string): Promise<string> {
		const id = `session-${Date.now()}`;
		this._sessions.set(id, {
			id,
			name: name || `🆕 Session ${this._sessions.size + 1}`,
			history: [],
			requestHandler: async (request, _context, stream, _token) => {
				stream.markdown(`**New session echo:** ${request.prompt}`);
				return { metadata: { command: '', sessionId: id } };
			}
		});
		this._onDidChangeChatSessionItems.fire();
		return id;
	}

	async deleteSession(id: string): Promise<void> {
		if (this._sessions.delete(id)) {
			this._onDidChangeChatSessionItems.fire();
		}
	}

	async getSessionItems(_token: vscode.CancellationToken): Promise<vscode.ChatSessionItem[]> {
		return Array.from(this._sessions.values()).map(session => ({
			id: session.id,
			label: session.name,
			iconPath: session.iconPath
		}));
	}
}

export function deactivate() {
	// This method is called when the extension is deactivated
}
