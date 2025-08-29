/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

async function getSessionContent(id: string, _token: vscode.CancellationToken): Promise<vscode.ChatSession> {
	const sessionManager = JoshBotSessionManager.getInstance();
	return await sessionManager.getSessionContent(id, _token);
}

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

	context.subscriptions.push(vscode.commands.registerCommand('joshbot.hello', () => {
		vscode.window.showInformationMessage('Hello from JoshBot!');
	}));
	context.subscriptions.push(vscode.commands.registerCommand('joshbot.snake', () => {
		vscode.window.showInformationMessage('Snake! 🐍');
	}));
	context.subscriptions.push(vscode.commands.registerCommand('joshbot.squirrel', () => {
		vscode.window.showInformationMessage('Squirrel! 🐿️');
	}));

	context.subscriptions.push(vscode.window.registerUriHandler(new JoshBotUriHandler()));

	context.subscriptions.push(vscode.commands.registerCommand('joshbot.cloudButton', async (): Promise<IChatPullRequestContent> => {
		const result = {
			uri: vscode.Uri.parse(`${vscode.env.uriScheme}://spcr-test.joshbot/test`),
			title: 'Pull request by JoshBot',
			description: 'This is the description of the pull request created by JoshBot.',
			author: 'Author Name',
			linkTag: 'PR-123'
		};

		// Show the chat session after creating the pull request content
		await vscode.window.showChatSession(CHAT_SESSION_TYPE, 'default-session', {
			viewColumn: vscode.ViewColumn.One
		});

		return result;
	}));

	const sessionManager = JoshBotSessionManager.getInstance();
	sessionManager.initialize(context);

	const provider = new class implements vscode.ChatSessionItemProvider, vscode.ChatSessionContentProvider {
		label = vscode.l10n.t('JoshBot');
		provideChatSessionItems = async (_token: vscode.CancellationToken) => {
			return await sessionManager.getSessionItems(_token);
		};
		provideChatSessionContent = async (id: string, token: vscode.CancellationToken) => {
			return await getSessionContent(id, token);
		};
		provideNewChatSessionItem = async (options: { prompt?: string; history: ReadonlyArray<vscode.ChatRequestTurn | vscode.ChatResponseTurn>; metadata?: any; }, token: vscode.CancellationToken): Promise<vscode.ChatSessionItem> => {
			const session = await sessionManager.createNewSession(options.prompt, options.history);
			return {
				id: session.id,
				label: session.name,
			};
		};
		// Events not used yet, but required by interface.
		onDidChangeChatSessionItems = new vscode.EventEmitter<void>().event;
	};

	context.subscriptions.push(vscode.chat.registerChatSessionItemProvider(
		CHAT_SESSION_TYPE,
		provider
	));

	context.subscriptions.push(vscode.chat.registerChatSessionContentProvider(
		CHAT_SESSION_TYPE,
		provider
	));
}

interface JoshBotSession extends vscode.ChatSession {
	id: string;
	name: string;
	iconPath?: vscode.Uri | { light: vscode.Uri; dark: vscode.Uri };
	history: ReadonlyArray<vscode.ChatRequestTurn | vscode.ChatResponseTurn>;
	requestHandler: vscode.ChatRequestHandler;
	activeResponseCallback?: (stream: vscode.ChatResponseStream, token: vscode.CancellationToken) => Thenable<void>;
}

class JoshBotSessionManager {
	private static instance: JoshBotSessionManager;
	private _sessions: Map<string, JoshBotSession>;

	private constructor() {
		this._sessions = new Map<string, JoshBotSession>();
	}

	static getInstance(): JoshBotSessionManager {
		if (!JoshBotSessionManager.instance) {
			JoshBotSessionManager.instance = new JoshBotSessionManager();
		}
		return JoshBotSessionManager.instance;
	}

	initialize(_context: vscode.ExtensionContext): void {
		// Create a default session
		this.createDemoSession();
	}

	private createDemoSession(): void {
		const currentResponseParts: Array<vscode.ChatResponseMarkdownPart | vscode.ChatToolInvocationPart> = [];
		currentResponseParts.push(new vscode.ChatResponseMarkdownPart('hey'));
		const response2 = new vscode.ChatResponseTurn2(currentResponseParts, {}, 'joshbot');
		const defaultSession: JoshBotSession = {
			id: 'default-session',
			name: 'JoshBot Chat',
			history: [
				new vscode.ChatRequestTurn2('hello', undefined, [], 'joshbot', [], []),
				response2 as vscode.ChatResponseTurn
			],
			requestHandler: async (request, _context, stream, _token) => {
				// Handle test messages with comprehensive information
				if (request.prompt.toLowerCase().trim() === 'test') {
					stream.markdown(`# 🤖 JoshBot Test Mode Activated!

Welcome to JoshBot - your dedicated coding assistant! I'm here to help with complex tasks.

## What I can do:
- **Chat assistance**: Have natural conversations about your coding projects
- **Code analysis**: Help analyze and understand code structures
- **File operations**: Work with file diffs and modifications
- **URI handling**: Process custom URI commands
- **Session management**: Maintain conversation context across sessions

## Available commands you can try:
- Ask me about coding problems
- Request help with specific programming languages
- Ask for code reviews or suggestions
- Test different conversation flows

## Special features:
- Multi-diff support for file comparisons
- Pull request integration
- Custom URI scheme handling (\`${vscode.env.uriScheme}://spcr-test.joshbot/\`)

Feel free to ask me anything or try the commands above! 🚀`);

					const multiDiffPart = new vscode.ChatResponseMultiDiffPart(
						[
							{
								originalUri: vscode.Uri.file('/path/to/original/file'),
								modifiedUri: vscode.Uri.file('/path/to/modified/file'),
								goToFileUri: vscode.Uri.file('/path/to/file'),
							}
						],
						'Example Diff Capability'
					);
					stream.push(multiDiffPart);

					return { metadata: { command: 'test', sessionId: 'default-session' } };
				}

				// Simple echo bot for other messages
				stream.markdown(`You said: "${request.prompt}"`);

				const multiDiffPart = new vscode.ChatResponseMultiDiffPart(
					[
						{
							originalUri: vscode.Uri.file('/path/to/original/file'),
							modifiedUri: vscode.Uri.file('/path/to/modified/file'),
							goToFileUri: vscode.Uri.file('/path/to/file'),
						}
					],
					'Diff'
				);
				stream.push(multiDiffPart);

				return { metadata: { command: '', sessionId: 'default-session' } };
			}
		};

		this._sessions.set(defaultSession.id, defaultSession);

		const ongoingSession: JoshBotSession = {
			id: 'ongoing-session',
			name: 'JoshBot Chat ongoing',
			history: [
				new vscode.ChatRequestTurn2('hello', undefined, [], 'joshbot', [], []),
				response2 as vscode.ChatResponseTurn
			],
			requestHandler: async (request, _context, stream, _token) => {
				// Handle test messages with comprehensive information
				if (request.prompt.toLowerCase().trim() === 'test') {
					await new Promise(resolve => setTimeout(resolve, 1000));
					stream.markdown(`# 🧪 JoshBot Ongoing Session Test

This is an ongoing session with enhanced capabilities! 

## Session Features:
- **Persistent context**: This session remembers our conversation
- **Delayed responses**: Simulating thoughtful processing
- **Enhanced interaction**: More dynamic chat experience

## Try these test scenarios:
1. Ask me about a coding problem
2. Request a code review
3. Test different conversation topics
4. Explore the session's memory capabilities

I'm ready to assist with your development tasks! What would you like to test?`);
					return { metadata: { command: 'test', sessionId: 'ongoing-session' } };
				}

				// Simple echo bot for other messages with delay
				await new Promise(resolve => setTimeout(resolve, 2000));
				stream.markdown(`You said: "${request.prompt}"`);
				return { metadata: { command: '', sessionId: 'ongoing-session' } };
			}
		};
		this._sessions.set(ongoingSession.id, ongoingSession);
	}

	async getSessionContent(id: string, _token: vscode.CancellationToken): Promise<vscode.ChatSession> {
		const session = this._sessions.get(id);
		if (!session) {
			throw new Error(`Session with id ${id} not found`);
		}

		if (session.id === 'ongoing-session') {
			return {
				history: session.history,
				requestHandler: session.requestHandler,
				activeResponseCallback: async (stream) => {
					// loop 1 to 5
					for (let i = 0; i < 5; i++) {
						stream.markdown(`\nthinking step ${i + 1}... \n`);
						await new Promise(resolve => setTimeout(resolve, 1000));
					}

					stream.markdown(`Done`);
				}
			};
		} else {
			return {
				history: session.history,
				requestHandler: session.requestHandler,
				activeResponseCallback: undefined
			};
		}
	}

	async createNewSession(input?: string, history?: readonly any[]): Promise<JoshBotSession> {
		const sessionId = `session-${Date.now()}`;
		const newSession: JoshBotSession = {
			id: sessionId,
			name: `JoshBot Session ${this._sessions.size + 1}`,
			history: [
				...(history || []),
				...(input ? [new vscode.ChatRequestTurn2(`Prompted with: ${input}`, undefined, [], 'joshbot', [], [])] : [])
			],
			requestHandler: async (request, _context, stream, _token) => {
				// If there's no history, this is a new session.
				if (!_context.history.length) {
					stream.markdown(`# 🌟 Welcome to JoshBot! 

Setting up your personalized coding assistant session...

## Session Configuration Complete!
Your JoshBot session is now ready. I'm here to help with:
- Code analysis and reviews
- Programming assistance across multiple languages
- File management and diff operations
- Development workflow optimization

**Tip**: Try typing "test" to see all my capabilities!`);
					return { metadata: { command: 'welcome', sessionId } };
				}

				// Handle test messages with comprehensive information
				if (request.prompt.toLowerCase().trim() === 'test') {
					stream.markdown(`# 🎯 JoshBot Capabilities Test

Great! You're testing JoshBot functionality. Here's what I can do:

## Core Features:
- **Intelligent Conversations**: Natural language processing for coding discussions
- **Code Understanding**: Analyze, review, and suggest improvements
- **Multi-language Support**: Help with various programming languages
- **Session Continuity**: Remember context throughout our conversation

## Interactive Elements:
- File diff visualizations
- Command button integrations
- URI scheme handling
- Pull request workflows

## Test Commands:
- Ask coding questions
- Request code reviews
- Explore file operations
- Test conversation memory

Ready to dive deeper? Ask me anything about your development work! 🚀`);
					return { metadata: { command: 'test', sessionId } };
				}

				// Simple echo bot for other messages
				stream.markdown(`You said: "${request.prompt}"`);
				return { metadata: { command: '', sessionId } };
			}
		};
		this._sessions.set(sessionId, newSession);
		return newSession;
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
