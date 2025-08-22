/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { MCPManager, MCPTool } from './mcp/mcp-manager';

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

// Simple German translation function for common words and phrases
function translateToGerman(text: string): string {
	const translations: { [key: string]: string } = {
		'hello': 'hallo',
		'goodbye': 'auf wiedersehen',
		'thank you': 'danke',
		'thanks': 'danke',
		'please': 'bitte',
		'yes': 'ja',
		'no': 'nein',
		'good morning': 'guten morgen',
		'good evening': 'guten abend',
		'good night': 'gute nacht',
		'how are you': 'wie geht es dir',
		'what is your name': 'wie heißt du',
		'my name is': 'mein name ist',
		'i love you': 'ich liebe dich',
		'excuse me': 'entschuldigung',
		'sorry': 'entschuldigung',
		'water': 'wasser',
		'food': 'essen',
		'house': 'haus',
		'car': 'auto',
		'dog': 'hund',
		'cat': 'katze',
		'translate to german': 'ins deutsche übersetzen'
	};

	const lowerText = text.toLowerCase().trim();
	
	// Check for exact matches first
	if (translations[lowerText]) {
		return translations[lowerText];
	}
	
	// Check for partial matches and replace words
	let result = lowerText;
	for (const [english, german] of Object.entries(translations)) {
		const regex = new RegExp('\\b' + english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
		result = result.replace(regex, german);
	}
	
	// If no translation found, return original with a note
	if (result === lowerText) {
		return `${text} (Übersetzung nicht verfügbar)`;
	}
	
	return result;
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
	context.subscriptions.push(vscode.commands.registerCommand('joshbot.translateToGerman', async () => {
		const input = await vscode.window.showInputBox({
			placeHolder: 'Enter text to translate to German',
			prompt: 'Text to translate'
		});
		if (input) {
			const translated = translateToGerman(input);
			vscode.window.showInformationMessage(`German: ${translated}`);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('joshbot.listMCPTools', async () => {
		try {
			const mcpManager = MCPManager.getInstance();
			const tools = await mcpManager.getAvailableTools();
			const githubTools = tools.filter(t => t.serverType === 'github');
			const browserTools = tools.filter(t => t.serverType === 'browser');
			
			const message = `MCP Tools Available:\n` +
				`GitHub Tools: ${githubTools.length}\n` +
				`Browser Tools: ${browserTools.length}\n` +
				`Total: ${tools.length} tools`;
			
			vscode.window.showInformationMessage(message);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to list MCP tools: ${error instanceof Error ? error.message : String(error)}`);
		}
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
		// Initialize MCP Manager
		const mcpManager = MCPManager.getInstance();
		mcpManager.initialize().then(() => {
			console.log('MCP Manager initialized successfully');
		}).catch((error) => {
			console.error('Failed to initialize MCP Manager:', error);
		});
		
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
				const prompt = request.prompt.toLowerCase();
				const mcpManager = MCPManager.getInstance();
				
				// Check if this is an MCP tool request
				if (prompt.includes('github') || prompt.includes('repo') || prompt.includes('issue') || prompt.includes('pull request')) {
					try {
						stream.markdown('🔧 **Using GitHub MCP Tools**\n\n');
						
						// Example: List GitHub tools
						if (prompt.includes('list') && prompt.includes('tools')) {
							const githubTools = await mcpManager.listGitHubTools();
							stream.markdown('**Available GitHub Tools:**\n');
							githubTools.forEach(tool => {
								stream.markdown(`- **${tool.name}**: ${tool.description}\n`);
							});
						} else if (prompt.includes('file') && prompt.includes('content')) {
							// Example tool invocation
							const mockResult = await mcpManager.invokeTool('github-mcp-server-get_file_contents', {
								owner: 'example',
								repo: 'example-repo',
								path: '/README.md'
							});
							stream.markdown(`**GitHub File Contents Result:**\n${mockResult.content[0].text}`);
						} else {
							stream.markdown('I can help you with GitHub operations! Try asking me to:\n');
							stream.markdown('- "list github tools" - to see available GitHub tools\n');
							stream.markdown('- "get file content from repo" - to fetch file contents\n');
							stream.markdown('- "list issues in repository" - to get repository issues\n');
						}
					} catch (error) {
						stream.markdown(`❌ Error using GitHub tools: ${error instanceof Error ? error.message : String(error)}`);
					}
				} else if (prompt.includes('browser') || prompt.includes('web') || prompt.includes('navigate') || prompt.includes('click')) {
					try {
						stream.markdown('🌐 **Using Browser MCP Tools**\n\n');
						
						// Example: List browser tools
						if (prompt.includes('list') && prompt.includes('tools')) {
							const browserTools = await mcpManager.listBrowserTools();
							stream.markdown('**Available Browser Tools:**\n');
							browserTools.forEach(tool => {
								stream.markdown(`- **${tool.name}**: ${tool.description}\n`);
							});
						} else if (prompt.includes('navigate')) {
							// Example tool invocation
							const mockResult = await mcpManager.invokeTool('playwright-browser_navigate', {
								url: 'https://example.com'
							});
							stream.markdown(`**Browser Navigation Result:**\n${mockResult.content[0].text}`);
						} else if (prompt.includes('screenshot')) {
							const mockResult = await mcpManager.invokeTool('playwright-browser_take_screenshot', {
								filename: 'page.png'
							});
							stream.markdown(`**Browser Screenshot Result:**\n${mockResult.content[0].text}`);
						} else {
							stream.markdown('I can help you with browser automation! Try asking me to:\n');
							stream.markdown('- "list browser tools" - to see available browser tools\n');
							stream.markdown('- "navigate to website" - to open a website\n');
							stream.markdown('- "take a screenshot" - to capture the current page\n');
						}
					} catch (error) {
						stream.markdown(`❌ Error using browser tools: ${error instanceof Error ? error.message : String(error)}`);
					}
				} else if (prompt.includes('mcp') || prompt.includes('tools')) {
					try {
						stream.markdown('🛠️ **MCP Tools Available**\n\n');
						const allTools = await mcpManager.getAvailableTools();
						const githubToolsCount = allTools.filter(t => t.serverType === 'github').length;
						const browserToolsCount = allTools.filter(t => t.serverType === 'browser').length;
						
						stream.markdown(`**Total MCP Tools:** ${allTools.length}\n`);
						stream.markdown(`- **GitHub Tools:** ${githubToolsCount} tools\n`);
						stream.markdown(`- **Browser Tools:** ${browserToolsCount} tools\n\n`);
						
						stream.markdown('Ask me about "github tools" or "browser tools" to see specific capabilities!');
					} catch (error) {
						stream.markdown(`❌ Error listing MCP tools: ${error instanceof Error ? error.message : String(error)}`);
					}
				} else if (prompt.includes('translate') && prompt.includes('german')) {
					// Check if this is a translation request
					// Extract text to translate (simple heuristic)
					let textToTranslate = request.prompt;
					
					// Remove common translation prefixes
					textToTranslate = textToTranslate.replace(/^(translate|translate to german|please translate|can you translate)\s*/i, '');
					textToTranslate = textToTranslate.replace(/\s*(to german|into german|in german)$/i, '');
					textToTranslate = textToTranslate.trim();
					
					if (textToTranslate) {
						const translated = translateToGerman(textToTranslate);
						stream.markdown(`**Translation to German:** ${translated}`);
					} else {
						stream.markdown('Please provide text to translate to German. For example: "translate hello to german"');
					}
				} else {
					// Enhanced echo bot with MCP tool suggestions
					stream.markdown(`You said: "${request.prompt}"\n\n`);
					stream.markdown('💡 **Available capabilities:**\n');
					stream.markdown('- Ask about **GitHub** operations (repos, issues, PRs)\n');
					stream.markdown('- Ask about **browser** automation (navigation, clicks, screenshots)\n');
					stream.markdown('- Ask me to **translate to German**\n');
					stream.markdown('- Type "list mcp tools" to see all available tools\n');

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
				}

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
				await new Promise(resolve => setTimeout(resolve, 2000));
				
				const prompt = request.prompt.toLowerCase();
				
				// Check if this is a translation request
				if (prompt.includes('translate') && prompt.includes('german')) {
					// Extract text to translate (simple heuristic)
					let textToTranslate = request.prompt;
					
					// Remove common translation prefixes
					textToTranslate = textToTranslate.replace(/^(translate|translate to german|please translate|can you translate)\s*/i, '');
					textToTranslate = textToTranslate.replace(/\s*(to german|into german|in german)$/i, '');
					textToTranslate = textToTranslate.trim();
					
					if (textToTranslate) {
						const translated = translateToGerman(textToTranslate);
						stream.markdown(`**Translation to German:** ${translated}`);
					} else {
						stream.markdown('Please provide text to translate to German. For example: "translate hello to german"');
					}
				} else {
					// Simple echo bot for demo purposes
					stream.markdown(`You said: "${request.prompt}"`);
				}
				
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
					stream.markdown(`Welcome to JoshBot! Configuring your session....`);
					return { metadata: { command: '', sessionId } };
				}

				const prompt = request.prompt.toLowerCase();
				
				// Check if this is a translation request
				if (prompt.includes('translate') && prompt.includes('german')) {
					// Extract text to translate (simple heuristic)
					let textToTranslate = request.prompt;
					
					// Remove common translation prefixes
					textToTranslate = textToTranslate.replace(/^(translate|translate to german|please translate|can you translate)\s*/i, '');
					textToTranslate = textToTranslate.replace(/\s*(to german|into german|in german)$/i, '');
					textToTranslate = textToTranslate.trim();
					
					if (textToTranslate) {
						const translated = translateToGerman(textToTranslate);
						stream.markdown(`**Translation to German:** ${translated}`);
					} else {
						stream.markdown('Please provide text to translate to German. For example: "translate hello to german"');
					}
				} else {
					// Simple echo bot for demo purposes
					stream.markdown(`You said: "${request.prompt}"`);
				}
				
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
