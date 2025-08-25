/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { ThemeManager } from './colors/themeManager';
import { ColorUtils } from './colors/colorUtils';

async function getSessionContent(id: string, _token: vscode.CancellationToken): Promise<vscode.ChatSession> {
	const sessionManager = JoshBotSessionManager.getInstance();
	return await sessionManager.getSessionContent(id, _token);
}

// Must match package.json's "contributes.chatSessions.[0].id"
const CHAT_SESSION_TYPE = 'josh-bot';

function getCurrentSeason(): string {
	const now = new Date();
	const month = now.getMonth() + 1; // 1-12
	
	if (month >= 3 && month <= 5) return 'Spring';
	else if (month >= 6 && month <= 8) return 'Summer';
	else if (month >= 9 && month <= 11) return 'Fall';
	else return 'Winter';
}

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

	// Initialize theme manager
	const themeManager = ThemeManager.getInstance();

	// Create status bar item
	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusBarItem.text = '$(robot) JoshBot';
	statusBarItem.tooltip = 'JoshBot - Click to open color picker';
	statusBarItem.command = 'joshbot.colorPicker';
	statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
	statusBarItem.show();
	context.subscriptions.push(statusBarItem);

	// Update status bar color when theme changes
	const updateStatusBarColor = () => {
		const color = themeManager.getStatusBarColor();
		statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
	};
	
	// Listen for configuration changes to update status bar
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('joshbot.theme')) {
			updateStatusBarColor();
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('joshbot.hello', () => {
		vscode.window.showInformationMessage('Hello from JoshBot!');
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('joshbot.snake', () => {
		const config = themeManager.config;
		if (config.enableColorfulResponses) {
			const coloredMessage = ColorUtils.getStatusColorMarkdown('success', 'Snake! 🐍');
			vscode.window.showInformationMessage('Snake! 🐍');
		} else {
			vscode.window.showInformationMessage('Snake! 🐍');
		}
	}));
	
	context.subscriptions.push(vscode.commands.registerCommand('joshbot.squirrel', () => {
		const config = themeManager.config;
		if (config.enableColorfulResponses) {
			const coloredMessage = ColorUtils.getStatusColorMarkdown('info', 'Squirrel! 🐿️');
			vscode.window.showInformationMessage('Squirrel! 🐿️');
		} else {
			vscode.window.showInformationMessage('Squirrel! 🐿️');
		}
	}));

	// New color-themed commands
	context.subscriptions.push(vscode.commands.registerCommand('joshbot.rainbow', () => {
		const rainbowText = ColorUtils.rainbowText('Rainbow Colors! 🌈');
		vscode.window.showInformationMessage('Rainbow Colors! 🌈');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('joshbot.palette', async () => {
		const colors = [
			themeManager.getPrimaryColor(),
			themeManager.getAccentColor(),
			ColorUtils.StatusColors.SUCCESS,
			ColorUtils.StatusColors.WARNING,
			ColorUtils.StatusColors.ERROR,
			ColorUtils.StatusColors.INFO
		];
		
		const paletteMarkdown = ColorUtils.createColorPalette(colors);
		vscode.window.showInformationMessage(`Color Palette:\n${colors.join(', ')}`);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('joshbot.colorPicker', async () => {
		const colorOptions = Object.keys(ThemeManager.PRESET_THEMES);
		const selected = await vscode.window.showQuickPick(colorOptions, {
			placeHolder: 'Select a color theme'
		});
		
		if (selected) {
			await themeManager.applyPresetTheme(selected as keyof typeof ThemeManager.PRESET_THEMES);
			vscode.window.showInformationMessage(`Applied ${selected} theme! 🎨`);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('joshbot.seasonalTheme', async () => {
		await themeManager.applySeasonalTheme();
		const seasonalColors = themeManager.getSeasonalColors();
		const season = getCurrentSeason();
		vscode.window.showInformationMessage(`Applied ${season} seasonal theme! 🍂❄️🌸☀️`);
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
		const themeManager = ThemeManager.getInstance();
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
				
				// Show typing indicator first
				const typingIndicator = ColorUtils.getStatusColorMarkdown('info', 'JoshBot is processing your request...', themeManager.config.highContrast);
				stream.markdown(typingIndicator);
				
				// Handle special color commands
				if (prompt.includes('rainbow')) {
					const rainbowText = ColorUtils.rainbowText('Here\'s your rainbow! 🌈');
					stream.markdown(rainbowText);
				} else if (prompt.includes('color') || prompt.includes('palette')) {
					const colors = [
						themeManager.getPrimaryColor(),
						themeManager.getAccentColor(),
						ColorUtils.StatusColors.SUCCESS,
						ColorUtils.StatusColors.WARNING,
						ColorUtils.StatusColors.ERROR
					];
					const paletteDisplay = ColorUtils.createColorPalette(colors);
					stream.markdown(`**Current Color Palette:**\n${paletteDisplay}`);
				} else if (prompt.includes('status')) {
					// Demo status indicators
					const highContrast = themeManager.config.highContrast;
					stream.markdown(ColorUtils.getStatusColorMarkdown('success', 'Operation completed successfully!', highContrast));
					stream.markdown(ColorUtils.getStatusColorMarkdown('warning', 'This is a warning message.', highContrast));
					stream.markdown(ColorUtils.getStatusColorMarkdown('error', 'An error occurred.', highContrast));
					stream.markdown(ColorUtils.getStatusColorMarkdown('info', 'Here\'s some information.', highContrast));
				} else if (prompt.includes('theme') || prompt.includes('seasonal')) {
					const season = getCurrentSeason();
					const seasonalColors = themeManager.getSeasonalColors();
					stream.markdown(`**Current Season: ${season}**`);
					stream.markdown(`Primary: ${seasonalColors.primary}, Accent: ${seasonalColors.accent}`);
					stream.markdown(ColorUtils.getStatusColorMarkdown('info', `Try saying "apply seasonal theme" to use ${season.toLowerCase()} colors!`, themeManager.config.highContrast));
				} else {
					// Enhanced echo with themed styling
					const themedResponse = themeManager.createThemedMarkdown(`You said: **"${request.prompt}"**`);
					stream.markdown(themedResponse);
				}

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
				// Add typing indicator with colors
				const typingIndicator = ColorUtils.getStatusColorMarkdown('info', 'JoshBot is thinking...', themeManager.config.highContrast);
				stream.markdown(typingIndicator);
				
				await new Promise(resolve => setTimeout(resolve, 2000));
				
				// Enhanced response with theming
				const themedResponse = themeManager.createThemedMarkdown(`You said: **"${request.prompt}"**`);
				stream.markdown(themedResponse);
				
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
		const themeManager = ThemeManager.getInstance();
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
					const welcomeMessage = ColorUtils.getStatusColorMarkdown('success', 'Welcome to JoshBot! Configuring your session....', themeManager.config.highContrast);
					stream.markdown(welcomeMessage);
					return { metadata: { command: '', sessionId } };
				}

				// Enhanced echo with themed styling
				const themedResponse = themeManager.createThemedMarkdown(`You said: **"${request.prompt}"**`);
				stream.markdown(themedResponse);
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
