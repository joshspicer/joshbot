/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as os from 'os';
import { TextDecoder } from 'util';

const CHAT_SESSION_TYPE = 'josh-bot';

// Dynamically created sessions
const _sessionItems: vscode.ChatSessionItem[] = [];
const _chatSessions: Map<string, vscode.ChatSession> = new Map();

const MODELS_OPTION_ID = 'model';
const SUB_AGENT_OPTION_ID = 'subagent';

const _sessionModel: Map<string, vscode.ChatSessionProviderOptionItem | undefined> = new Map();
const _sessionSubAgent: Map<string, vscode.ChatSessionProviderOptionItem | undefined> = new Map();

const textDecoder = new TextDecoder();
let cachedNpmScripts: string[] | undefined;

interface CommandLineAnalysis {
	tokens: string[];
	precedingTokens: string[];
	activeTokenText: string;
	tokenTextBeforeCursor: string;
	tokenIndex: number;
	isInToken: boolean;
	isAtNewToken: boolean;
	replacementRange: readonly [number, number];
}

interface CompletionSpec {
	label: string;
	detail?: string;
	documentation?: string | vscode.MarkdownString;
	kind?: vscode.TerminalCompletionItemKind;
	range?: readonly [number, number];
}

const ROOT_COMMAND_SUGGESTIONS: CompletionSpec[] = [
	{ label: 'josh-git', detail: 'Summon JoshBot for repository gossip', kind: vscode.TerminalCompletionItemKind.Method },
	{ label: 'josh-run', detail: 'Let JoshBot mash the shiny buttons', kind: vscode.TerminalCompletionItemKind.Method },
	{ label: 'josh-launch', detail: 'Teleport files into JoshBot Studio', kind: vscode.TerminalCompletionItemKind.Method },
	{ label: 'josh-huddle', detail: 'Gather the squirrels for planning', kind: vscode.TerminalCompletionItemKind.Method },
	{ label: 'josh-confetti', detail: 'Deploy celebratory sparkles everywhere', kind: vscode.TerminalCompletionItemKind.Method }
];

const JOSH_GIT_SUBCOMMANDS: CompletionSpec[] = [
	{ label: 'status-report', detail: 'JoshBot whispers the repo mood', kind: vscode.TerminalCompletionItemKind.Method },
	{ label: 'checkout-party', detail: 'Switch timelines with maximum flair', kind: vscode.TerminalCompletionItemKind.Method },
	{ label: 'commit-highfive', detail: 'Seal changes with a virtual high-five', kind: vscode.TerminalCompletionItemKind.Method },
	{ label: 'branch-sprout', detail: 'Grow a brand new idea vine', kind: vscode.TerminalCompletionItemKind.Method },
	{ label: 'stash-burrow', detail: 'Hide work in a squirrel-approved cache', kind: vscode.TerminalCompletionItemKind.Method },
	{ label: 'pull-syncopate', detail: 'Sync beats with the remote rhythm', kind: vscode.TerminalCompletionItemKind.Method }
];

const JOSH_GIT_GLOBAL_FLAGS: CompletionSpec[] = [
	{ label: '--confetti', detail: 'Enable celebratory output mode', kind: vscode.TerminalCompletionItemKind.Flag },
	{ label: '--dramatic', detail: 'Narrate every step with flair', kind: vscode.TerminalCompletionItemKind.Flag },
	{ label: '--sidekick=joshbot', detail: 'Guarantee JoshBot accompaniment', kind: vscode.TerminalCompletionItemKind.Flag },
	{ label: '--no-spoilers', detail: 'Keep reveal moments intact', kind: vscode.TerminalCompletionItemKind.Flag }
];

const JOSH_GIT_CHECKOUT_FLAGS: CompletionSpec[] = [
	{ label: '--launch-new-branch', detail: 'Spawn a fresh idea path', kind: vscode.TerminalCompletionItemKind.Flag, documentation: new vscode.MarkdownString('JoshBot builds a fresh branch and immediately beams you there.') },
	{ label: '--follow-squirrel', detail: 'Track whatever branch the squirrels prefer', kind: vscode.TerminalCompletionItemKind.Flag },
	{ label: '--stealth-mode', detail: 'Detach with stealthy precision', kind: vscode.TerminalCompletionItemKind.Flag }
];

const JOSH_BRANCH_SUGGESTIONS: CompletionSpec[] = [
	{ label: 'main-squirrel-wrangler', detail: 'Stable branch curated by JoshBot', kind: vscode.TerminalCompletionItemKind.ScmBranch },
	{ label: 'develop-bot-lounge', detail: 'Where experimental ideas dance', kind: vscode.TerminalCompletionItemKind.ScmBranch },
	{ label: 'feature/josh-confetti-cannon', detail: 'Adds unstoppable confetti effects', kind: vscode.TerminalCompletionItemKind.ScmBranch },
	{ label: 'release/v1.0.0-bot-blast', detail: 'Ship-worthy and party-ready', kind: vscode.TerminalCompletionItemKind.ScmBranch }
];

const JOSH_RUN_SUBCOMMANDS: CompletionSpec[] = [
	{ label: 'warmup', detail: 'Stretch JoshBot’s servos', kind: vscode.TerminalCompletionItemKind.Method },
	{ label: 'ritual', detail: 'Perform the sacred pre-run chant', kind: vscode.TerminalCompletionItemKind.Method },
	{ label: 'victory-lap', detail: 'Celebrate before even starting', kind: vscode.TerminalCompletionItemKind.Method },
	{ label: 'snack-break', detail: 'Refuel JoshBot with bytes', kind: vscode.TerminalCompletionItemKind.Method }
];

const JOSH_LAUNCH_FLAGS: CompletionSpec[] = [
	{ label: '--reuse-orbital', detail: 'Dock in the current Josh orbit', kind: vscode.TerminalCompletionItemKind.Option },
	{ label: '--dramatic-diff', detail: 'Compare files with theatrical flair', kind: vscode.TerminalCompletionItemKind.Option },
	{ label: '--await-applause', detail: 'Pause until the crowd cheers', kind: vscode.TerminalCompletionItemKind.Option },
	{ label: '--profile=joshbot-party', detail: 'Load the party-ready profile', kind: vscode.TerminalCompletionItemKind.Option }
];

let onDidCommitChatSessionItemEmitter: vscode.EventEmitter<{ original: vscode.ChatSessionItem; modified: vscode.ChatSessionItem; }>;

export function activate(context: vscode.ExtensionContext) {
	console.log('JoshBot extension is now active!');
	setupNpmScriptWatcher(context);
	const terminalCompletionProvider = new TerminalCompletionPlaygroundProvider();
	context.subscriptions.push(vscode.window.registerTerminalCompletionProvider(terminalCompletionProvider, '-'));
	context.subscriptions.push(vscode.commands.registerCommand('joshbot.openTerminalCompletionPlayground', openTerminalCompletionPlayground));
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
				const sessionId = getSessionIdFromResource(original.resource);
				stream.markdown(`Welcome back! model=**${_sessionModel.get(sessionId)?.name ?? 'unknown'}** subAgent=**${_sessionSubAgent.get(sessionId)?.name ?? 'unknown'}**\n\n`);
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
		availableModels: vscode.ChatSessionProviderOptionItem[] = [
			{
				id: 'joshbot-basic',
				name: 'JoshBot Basic',
			},
			{
				id: 'joshbot-pro',
				name: 'JoshBot Pro',
			},
			{
				id: 'joshbot-ultra',
				name: 'JoshBot Ultra',
			}
		];

		availableSubAgent: vscode.ChatSessionProviderOptionItem[] = [
			{
				id: 'basic',
				name: 'Basic',
			},
			{
				id: "summarizer",
				name: "Summarizer",
			},
			{
				id: "code-helper",
				name: "Code Helper",
			},
			{
				id: "research-assistant",
				name: "Research Assistant",
			},
		];

		async provideChatSessionItems(token: vscode.CancellationToken): Promise<vscode.ChatSessionItem[]> {
			return [
				{
					label: 'JoshBot Demo Session 01',
					resource: vscode.Uri.from({ scheme: CHAT_SESSION_TYPE, path: '/demo-with-options-01' }),
					status: vscode.ChatSessionStatus.Completed
				},
				{
					label: 'JoshBot Demo Session 02',
					resource: vscode.Uri.from({ scheme: CHAT_SESSION_TYPE, path: '/demo-with-options-02' }),
					status: vscode.ChatSessionStatus.Completed
				},
				{
					label: 'JoshBot Demo Session 03 (no options shown)',
					resource: vscode.Uri.from({ scheme: CHAT_SESSION_TYPE, path: '/demo-no-options-03' }),
					status: vscode.ChatSessionStatus.Completed
				},
				{
					label: 'JoshBot Demo Session 04',
					resource: vscode.Uri.from({ scheme: CHAT_SESSION_TYPE, path: '/demo-with-options-04' }),
					status: vscode.ChatSessionStatus.InProgress
				},
				..._sessionItems,
			];
		}
		async provideChatSessionContent(resource: vscode.Uri, token: vscode.CancellationToken): Promise<vscode.ChatSession> {
			const sessionId = getSessionIdFromResource(resource);
			const setDefaultOptionsIfMissing = () => {
				if (!_sessionModel.get(sessionId)) {
					_sessionModel.set(sessionId, this.availableModels[0]);
				}
				if (!_sessionSubAgent.get(sessionId)) {
					_sessionSubAgent.set(sessionId, this.availableSubAgent[0]);
				}
			}
			switch (sessionId) {
				case 'demo-with-options-01':
				case 'demo-with-options-02':
					setDefaultOptionsIfMissing();
					return completedChatSessionContent(sessionId, true);

				case 'demo-no-options-03':
					// NOTE: Does NOT set default options
					return completedChatSessionContent(sessionId, false);

				case 'demo-with-options-04':
					setDefaultOptionsIfMissing();
					return inProgressChatSessionContent(sessionId);

				// case sessionId.startsWith('untitled-'):
				default:
					setDefaultOptionsIfMissing();
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
				optionGroups: [
					{
						id: MODELS_OPTION_ID, // TODO: Enum
						name: 'Pick Model',
						description: 'Select the JoshBot model to use',
						items: this.availableModels,
					},
					{
						id: SUB_AGENT_OPTION_ID,
						name: 'Pick Sub-Agent',
						description: 'Select the JoshBot sub-agent to assist you',
						items: this.availableSubAgent,
					}
				]
			};
		}

		// Handle option changes for a session (store current state in a map)
		provideHandleOptionsChange(resource: vscode.Uri, updates: ReadonlyArray<vscode.ChatSessionOptionUpdate>, token: vscode.CancellationToken): void {
			const sessionId = getSessionIdFromResource(resource);
			for (const update of updates) {
				if (update.optionId === MODELS_OPTION_ID) {
					if (typeof update.value === 'undefined') {
						_sessionModel.set(sessionId, undefined);
					} else {
						_sessionModel.set(sessionId, this.availableModels.find(m => m.id === update.value));
					}
				}
				if (update.optionId === SUB_AGENT_OPTION_ID) {
					if (typeof update.value === 'undefined') {
						_sessionSubAgent.set(sessionId, undefined);
					} else {
						_sessionSubAgent.set(sessionId, this.availableSubAgent.find(sa => sa.id === update.value));
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
		resource: vscode.Uri.from({ scheme: CHAT_SESSION_TYPE, path: '/' + newSessionId }),
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
		options: { 
			[MODELS_OPTION_ID]: _sessionModel.get(newSessionId)?.id ?? 'joshbot-basic',
			[SUB_AGENT_OPTION_ID]: _sessionSubAgent.get(newSessionId)?.id ?? 'basic',
		}
	});
	/* Tell VS Code that we have created a new session and can replace this 'untitled' one with it */
	onDidCommitChatSessionItemEmitter.fire({ original, modified: newSessionItem });
}


function completedChatSessionContent(sessionId: string, showOptions?: boolean): vscode.ChatSession {
	const currentResponseParts: Array<vscode.ChatResponseMarkdownPart | vscode.ChatToolInvocationPart> = [];
	currentResponseParts.push(new vscode.ChatResponseMarkdownPart(`Session: ${sessionId}\n`));
	const response2 = new vscode.ChatResponseTurn2(currentResponseParts, {}, 'joshbot');
	const currentModel = _sessionModel.get(sessionId);
	const currentSubAgent = _sessionSubAgent.get(sessionId);
	return {
		history: [
			new vscode.ChatRequestTurn2(`hello. Using model: ${currentModel?.name}`, undefined, [], 'joshbot', [], []),
			response2 as vscode.ChatResponseTurn
		],
		requestHandler: undefined,
		options: (showOptions ? { 
			[MODELS_OPTION_ID]: currentModel?.id ?? 'joshbot-basic',
			[SUB_AGENT_OPTION_ID]: currentSubAgent?.id ?? 'basic',
		 } : undefined),
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
			stream.progress(`\nStill working\n`);
			await new Promise(resolve => setTimeout(resolve, 3000));
			stream.markdown(`2+2=...\n`);
			await new Promise(resolve => setTimeout(resolve, 3000));
			stream.markdown(`4!\n`);
		},
		requestHandler: undefined,
		options: { 
			[MODELS_OPTION_ID]: _sessionModel.get(sessionId)?.id ?? 'joshbot-basic',
			[SUB_AGENT_OPTION_ID]: _sessionSubAgent.get(sessionId)?.id ?? 'basic'
		},
		// requestHandler: async (request, context, stream, token) => {
		// 	stream.markdown(`Hello from ${sessionId}`);
		// 	return {};
		// }
	};
}

function untitledChatSessionContent(sessionId: string, showOptions?: boolean): vscode.ChatSession {
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
		options: (showOptions ? { 
			[MODELS_OPTION_ID]: _sessionModel.get(sessionId)?.id ?? 'joshbot-basic',
			[SUB_AGENT_OPTION_ID]: _sessionSubAgent.get(sessionId)?.id ?? 'basic'
		} : undefined),
		// requestHandler: async (request, context, stream, token) => {
		// 	stream.markdown(`\n\nHello from ${sessionId}`);
		// 	return {};
		// }
	};
}

class TerminalCompletionPlaygroundProvider implements vscode.TerminalCompletionProvider<vscode.TerminalCompletionItem> {
	async provideTerminalCompletions(terminal: vscode.Terminal, context: vscode.TerminalCompletionContext, token: vscode.CancellationToken): Promise<vscode.TerminalCompletionItem[] | vscode.TerminalCompletionList<vscode.TerminalCompletionItem> | undefined> {
		if (token.isCancellationRequested) {
			return;
		}

		const analysis = analyzeCommandLine(context.commandLine, context.cursorIndex);
		const completions: vscode.TerminalCompletionItem[] = [];
		let resourceOptions: vscode.TerminalCompletionResourceOptions | undefined;
		const seen = new Set<string>();
		const prefixLower = analysis.tokenTextBeforeCursor.toLowerCase();

		const pushCompletion = (spec: CompletionSpec) => {
			if (prefixLower && !spec.label.toLowerCase().startsWith(prefixLower)) {
				return;
			}
			const key = `${spec.label}|${spec.kind ?? 'none'}`;
			if (seen.has(key)) {
				return;
			}
			const range = spec.range ?? analysis.replacementRange;
			const item = new vscode.TerminalCompletionItem(spec.label, range, spec.kind);
			if (spec.detail) {
				item.detail = spec.detail;
			}
			if (spec.documentation) {
				item.documentation = spec.documentation;
			}
			completions.push(item);
			seen.add(key);
		};

		if (analysis.tokenIndex === 0) {
			for (const suggestion of ROOT_COMMAND_SUGGESTIONS) {
				pushCompletion(suggestion);
			}
		}

		const command = determineCommand(analysis);
		const argumentIndex = analysis.tokenIndex - 1;
		const activeTokenLower = analysis.activeTokenText.toLowerCase();
		const isFlagFragment = analysis.tokenTextBeforeCursor.startsWith('-') || activeTokenLower.startsWith('-');

		if (command === 'josh-git') {
			if (argumentIndex === 0) {
				for (const subcommand of JOSH_GIT_SUBCOMMANDS) {
					pushCompletion(subcommand);
				}
			}

			if (isFlagFragment) {
				for (const flag of JOSH_GIT_GLOBAL_FLAGS) {
					pushCompletion(flag);
				}
			}

			const subcommand = getGitSubcommand(analysis, argumentIndex);
			const subcommandLower = subcommand?.toLowerCase();
			if (subcommandLower === 'checkout-party') {
				if (isFlagFragment) {
					for (const flag of JOSH_GIT_CHECKOUT_FLAGS) {
						pushCompletion(flag);
					}
				} else if (argumentIndex >= 1) {
					for (const branch of JOSH_BRANCH_SUGGESTIONS) {
						pushCompletion(branch);
					}
				}
			}
		} else if (command === 'josh-run') {
			if (argumentIndex === 0) {
				for (const subcommand of JOSH_RUN_SUBCOMMANDS) {
					pushCompletion(subcommand);
				}
			}

			const firstArgLower = analysis.tokens[1]?.toLowerCase() ?? (argumentIndex === 0 ? activeTokenLower : analysis.precedingTokens[1]?.toLowerCase());
			if (firstArgLower === 'ritual' && argumentIndex >= 1) {
				const scripts = await getNpmScriptNames();
				if (token.isCancellationRequested) {
					return;
				}
				for (const script of scripts) {
					pushCompletion({
						label: `josh-script:${script}`,
						detail: 'JoshBot recites this package ritual',
						kind: vscode.TerminalCompletionItemKind.OptionValue
					});
				}
			}
		} else if (command === 'josh-launch') {
			if (isFlagFragment) {
				for (const flag of JOSH_LAUNCH_FLAGS) {
					pushCompletion(flag);
				}
			} else if (argumentIndex >= 0) {
				resourceOptions = {
					showFiles: true,
					showDirectories: true,
					cwd: inferTerminalCwd(terminal)
				};
			}
		}

		if (token.isCancellationRequested) {
			return;
		}

		if (completions.length === 0 && !resourceOptions) {
			return;
		}

		if (resourceOptions) {
			return new vscode.TerminalCompletionList(completions, resourceOptions);
		}

		return completions;
	}
}

function setupNpmScriptWatcher(context: vscode.ExtensionContext): void {
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	if (!workspaceFolder) {
		return;
	}
	const pattern = new vscode.RelativePattern(workspaceFolder, 'package.json');
	const watcher = vscode.workspace.createFileSystemWatcher(pattern);
	const reset = () => {
		cachedNpmScripts = undefined;
	};
	context.subscriptions.push(
		watcher,
		watcher.onDidChange(reset),
		watcher.onDidCreate(reset),
		watcher.onDidDelete(reset),
		vscode.workspace.onDidChangeWorkspaceFolders(reset)
	);
}

async function getNpmScriptNames(): Promise<string[]> {
	if (cachedNpmScripts) {
		return cachedNpmScripts;
	}
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	if (!workspaceFolder) {
		cachedNpmScripts = [];
		return cachedNpmScripts;
	}
	try {
		const packageJsonUri = vscode.Uri.joinPath(workspaceFolder.uri, 'package.json');
		const bytes = await vscode.workspace.fs.readFile(packageJsonUri);
		const parsed = JSON.parse(textDecoder.decode(bytes));
		if (parsed && typeof parsed === 'object' && parsed.scripts && typeof parsed.scripts === 'object') {
			cachedNpmScripts = Object.keys(parsed.scripts);
		} else {
			cachedNpmScripts = [];
		}
	} catch (err) {
		console.warn('Failed to read npm scripts for terminal completions', err);
		cachedNpmScripts = [];
	}
	return cachedNpmScripts ?? [];
}

function openTerminalCompletionPlayground(): void {
	const terminal = vscode.window.createTerminal({ name: 'JoshBot Completion Playground' });
	terminal.show();
	terminal.sendText('# JoshBot terminal completion playground - try josh-git, josh-run ritual, or josh-launch .', true);
	vscode.window.showInformationMessage('Terminal completion playground ready. Try typing `josh-git`, `josh-git checkout-party`, `josh-run ritual`, or `josh-launch` in the new terminal.');
}

function analyzeCommandLine(commandLine: string, cursorIndex: number): CommandLineAnalysis {
	const tokens: Array<{ text: string; start: number; end: number }> = [];
	let tokenStart = -1;
	for (let index = 0; index <= commandLine.length; index++) {
		const char = commandLine[index];
		const isWhitespace = index === commandLine.length ? true : /\s/.test(char);
		if (isWhitespace) {
			if (tokenStart !== -1) {
				tokens.push({ text: commandLine.slice(tokenStart, index), start: tokenStart, end: index });
				tokenStart = -1;
			}
		} else if (tokenStart === -1) {
			tokenStart = index;
		}
	}

	let activeToken = tokens.find(token => token.start <= cursorIndex && cursorIndex <= token.end);
	let isInToken = !!activeToken;
	let tokenIndex: number;
	if (isInToken && activeToken) {
		tokenIndex = tokens.indexOf(activeToken);
	} else {
		const preceding = tokens.filter(token => token.end < cursorIndex);
		tokenIndex = preceding.length;
	}
	const start = isInToken && activeToken ? activeToken.start : cursorIndex;
	const end = isInToken && activeToken ? activeToken.end : cursorIndex;
	const activeText = isInToken && activeToken ? activeToken.text : '';
	const tokenTextBeforeCursor = isInToken && activeToken ? commandLine.slice(activeToken.start, cursorIndex) : '';
	return {
		tokens: tokens.map(token => token.text),
		precedingTokens: tokens.slice(0, tokenIndex).map(token => token.text),
		activeTokenText: activeText,
		tokenTextBeforeCursor,
		tokenIndex,
		isInToken,
		isAtNewToken: !isInToken,
		replacementRange: [start, end] as const
	};
}

function determineCommand(analysis: CommandLineAnalysis): string | undefined {
	if (analysis.tokens.length > 0) {
		return analysis.tokens[0];
	}
	if (analysis.tokenIndex === 0 && analysis.isInToken) {
		return analysis.activeTokenText;
	}
	return undefined;
}

function getGitSubcommand(analysis: CommandLineAnalysis, argumentIndex: number): string | undefined {
	if (analysis.tokens.length > 1) {
		return analysis.tokens[1];
	}
	if (argumentIndex === 0 && analysis.isInToken) {
		return analysis.activeTokenText;
	}
	return analysis.precedingTokens[1];
}

function inferTerminalCwd(terminal: vscode.Terminal): vscode.Uri {
	const creationOptions = terminal.creationOptions as vscode.TerminalOptions | vscode.ExtensionTerminalOptions | undefined;
	if (creationOptions && 'cwd' in creationOptions && creationOptions.cwd) {
		const cwd = creationOptions.cwd;
		if (typeof cwd === 'string') {
			return vscode.Uri.file(cwd);
		}
		return cwd;
	}
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	if (workspaceFolder) {
		return workspaceFolder.uri;
	}
	return vscode.Uri.file(os.homedir());
}

export function deactivate() {
	// Cleanup when extension is deactivated
}

/**
 * Helper function to extract session ID from a chat session resource URI.
 * @param resource The URI of the chat session (e.g., vscode-chat-session://joshbot/demo-with-options-01)
 * @returns The session ID extracted from the URI path
 */
function getSessionIdFromResource(resource: vscode.Uri): string {
	// Remove leading slash from the path to get the session ID
	return resource.path.startsWith('/') ? resource.path.slice(1) : resource.path;
}
