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

// Enhanced pull request data structure for better functionality
interface EnhancedPullRequest {
	id: string;
	title: string;
	description: string;
	author: string;
	status: 'open' | 'closed' | 'merged';
	url: string;
	branch: string;
	targetBranch: string;
	createdAt: string;
	updatedAt: string;
}

// Sample pull requests for demonstration
const SAMPLE_PULL_REQUESTS: EnhancedPullRequest[] = [
	{
		id: 'PR-123',
		title: 'Add new chat session functionality',
		description: 'This PR adds enhanced chat session management with better user experience and improved error handling.',
		author: 'JoshBot',
		status: 'open',
		url: 'https://github.com/joshspicer/joshbot/pull/123',
		branch: 'feature/chat-sessions',
		targetBranch: 'main',
		createdAt: '2024-01-15T10:30:00Z',
		updatedAt: '2024-01-16T14:20:00Z'
	},
	{
		id: 'PR-124',
		title: 'Fix translation service bug',
		description: 'Resolves issue with German translation not working for certain phrases. Improves translation accuracy and adds more common phrases.',
		author: 'DevBot',
		status: 'merged',
		url: 'https://github.com/joshspicer/joshbot/pull/124',
		branch: 'bugfix/translation-service',
		targetBranch: 'main',
		createdAt: '2024-01-14T09:15:00Z',
		updatedAt: '2024-01-15T16:45:00Z'
	},
	{
		id: 'PR-125',
		title: 'Implement VS Code theming commands',
		description: 'Adds three new theming commands: Zen Mode, Party Mode, and Rainbow Mode for enhanced user customization.',
		author: 'ThemeBot',
		status: 'open',
		url: 'https://github.com/joshspicer/joshbot/pull/125',
		branch: 'feature/theming-commands',
		targetBranch: 'main',
		createdAt: '2024-01-16T11:00:00Z',
		updatedAt: '2024-01-16T15:30:00Z'
	}
];

// Helper functions for pull request operations
function searchPullRequests(query: string): EnhancedPullRequest[] {
	const lowercaseQuery = query.toLowerCase();
	return SAMPLE_PULL_REQUESTS.filter(pr => 
		pr.title.toLowerCase().includes(lowercaseQuery) ||
		pr.description.toLowerCase().includes(lowercaseQuery) ||
		pr.author.toLowerCase().includes(lowercaseQuery) ||
		pr.id.toLowerCase().includes(lowercaseQuery)
	);
}

function getPullRequestsByStatus(status: 'open' | 'closed' | 'merged'): EnhancedPullRequest[] {
	return SAMPLE_PULL_REQUESTS.filter(pr => pr.status === status);
}

function formatPullRequestForChat(pr: EnhancedPullRequest): string {
	const statusEmoji = pr.status === 'open' ? '🟢' : pr.status === 'merged' ? '🟣' : '🔴';
	const updatedDate = new Date(pr.updatedAt).toLocaleDateString();
	
	return `${statusEmoji} **${pr.id}: ${pr.title}**
📝 ${pr.description}
👤 Author: ${pr.author}
🌿 ${pr.branch} → ${pr.targetBranch}
📅 Updated: ${updatedDate}
🔗 [View Pull Request](${pr.url})`;
}

function detectPullRequestIntent(prompt: string): { intent: string; query?: string; status?: string } | null {
	const lowercasePrompt = prompt.toLowerCase();
	
	if (lowercasePrompt.includes('show pull request') || lowercasePrompt.includes('list prs') || lowercasePrompt.includes('pull requests')) {
		// Check for status filters
		if (lowercasePrompt.includes('open')) {
			return { intent: 'list', status: 'open' };
		}
		if (lowercasePrompt.includes('merged')) {
			return { intent: 'list', status: 'merged' };
		}
		if (lowercasePrompt.includes('closed')) {
			return { intent: 'list', status: 'closed' };
		}
		return { intent: 'list' };
	}
	
	if (lowercasePrompt.includes('search pr') || lowercasePrompt.includes('find pull request')) {
		// Extract search query
		const searchMatch = lowercasePrompt.match(/(?:search pr|find pull request)\s+(.+)/);
		if (searchMatch) {
			return { intent: 'search', query: searchMatch[1] };
		}
		return { intent: 'search' };
	}
	
	if (lowercasePrompt.includes('pr status') || lowercasePrompt.includes('pull request status')) {
		return { intent: 'status' };
	}
	
	return null;
}

// Handle pull request intents and update the chat stream
async function handlePullRequestIntent(
	intent: { intent: string; query?: string; status?: string }, 
	stream: vscode.ChatResponseStream
): Promise<void> {
	switch (intent.intent) {
		case 'list':
			if (intent.status) {
				const filteredPRs = getPullRequestsByStatus(intent.status as 'open' | 'closed' | 'merged');
				stream.markdown(`## ${intent.status.charAt(0).toUpperCase() + intent.status.slice(1)} Pull Requests\n`);
				
				if (filteredPRs.length === 0) {
					stream.markdown(`No ${intent.status} pull requests found.`);
				} else {
					for (const pr of filteredPRs) {
						stream.markdown(formatPullRequestForChat(pr) + '\n\n');
						
						// Use ChatResponsePullRequestPart for rich display
						const prPart = new vscode.ChatResponsePullRequestPart(
							vscode.Uri.parse(pr.url),
							pr.title,
							pr.description,
							pr.author,
							pr.id
						);
						stream.push(prPart);
					}
				}
			} else {
				stream.markdown(`## All Pull Requests\n`);
				for (const pr of SAMPLE_PULL_REQUESTS) {
					stream.markdown(formatPullRequestForChat(pr) + '\n\n');
					
					// Use ChatResponsePullRequestPart for rich display
					const prPart = new vscode.ChatResponsePullRequestPart(
						vscode.Uri.parse(pr.url),
						pr.title,
						pr.description,
						pr.author,
						pr.id
					);
					stream.push(prPart);
				}
			}
			break;
			
		case 'search':
			if (intent.query) {
				const searchResults = searchPullRequests(intent.query);
				stream.markdown(`## Search Results for "${intent.query}"\n`);
				
				if (searchResults.length === 0) {
					stream.markdown(`No pull requests found matching "${intent.query}".`);
				} else {
					for (const pr of searchResults) {
						stream.markdown(formatPullRequestForChat(pr) + '\n\n');
						
						// Use ChatResponsePullRequestPart for rich display
						const prPart = new vscode.ChatResponsePullRequestPart(
							vscode.Uri.parse(pr.url),
							pr.title,
							pr.description,
							pr.author,
							pr.id
						);
						stream.push(prPart);
					}
				}
			} else {
				stream.markdown('Please provide a search query. For example: "search pr translation" or "find pull request theming"');
			}
			break;
			
		case 'status':
			const openCount = getPullRequestsByStatus('open').length;
			const mergedCount = getPullRequestsByStatus('merged').length;
			const closedCount = getPullRequestsByStatus('closed').length;
			
			stream.markdown(`## Pull Request Status Summary\n\n` +
				`🟢 **Open:** ${openCount}\n` +
				`🟣 **Merged:** ${mergedCount}\n` +
				`🔴 **Closed:** ${closedCount}\n\n` +
				`**Total:** ${SAMPLE_PULL_REQUESTS.length} pull requests`);
			break;
			
		default:
			stream.markdown('I can help you with pull requests! Try:\n' +
				'• "show pull requests" - list all PRs\n' +
				'• "show open pull requests" - filter by status\n' +
				'• "search pr translation" - search PRs\n' +
				'• "pr status" - get status summary');
	}
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

	context.subscriptions.push(vscode.commands.registerCommand('joshbot.showPullRequests', async () => {
		const options = ['All Pull Requests', 'Open PRs', 'Merged PRs', 'Closed PRs'];
		const selected = await vscode.window.showQuickPick(options, {
			placeHolder: 'Select pull request filter'
		});

		if (selected) {
			let pullRequests: EnhancedPullRequest[];
			switch (selected) {
				case 'Open PRs':
					pullRequests = getPullRequestsByStatus('open');
					break;
				case 'Merged PRs':
					pullRequests = getPullRequestsByStatus('merged');
					break;
				case 'Closed PRs':
					pullRequests = getPullRequestsByStatus('closed');
					break;
				default:
					pullRequests = SAMPLE_PULL_REQUESTS;
			}

			if (pullRequests.length === 0) {
				vscode.window.showInformationMessage('No pull requests found for the selected filter.');
				return;
			}

			// Show in chat session with pull request information
			await vscode.window.showChatSession(CHAT_SESSION_TYPE, 'default-session', {
				viewColumn: vscode.ViewColumn.One
			});

			// The chat session will handle displaying the pull requests
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
				
				// Check for pull request intents first
				const prIntent = detectPullRequestIntent(request.prompt);
				if (prIntent) {
					await handlePullRequestIntent(prIntent, stream);
					return { metadata: { command: '', sessionId: 'default-session' } };
				}
				
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
				
				// Check for pull request intents first
				const prIntent = detectPullRequestIntent(request.prompt);
				if (prIntent) {
					await handlePullRequestIntent(prIntent, stream);
					return { metadata: { command: '', sessionId: 'ongoing-session' } };
				}
				
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
				
				// Check for pull request intents first
				const prIntent = detectPullRequestIntent(request.prompt);
				if (prIntent) {
					await handlePullRequestIntent(prIntent, stream);
					return { metadata: { command: '', sessionId } };
				}
				
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
