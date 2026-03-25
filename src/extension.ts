/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

const CHAT_SESSION_TYPE = 'josh-bot';
const MODELS_OPTION_ID = 'model';
const SUB_AGENT_OPTION_ID = 'subagent';

const _sessionModel = new Map<string, vscode.ChatSessionProviderOptionItem | undefined>();
const _sessionSubAgent = new Map<string, vscode.ChatSessionProviderOptionItem | undefined>();

let _sessionCount = 0;

const availableModels: vscode.ChatSessionProviderOptionItem[] = [
	{ id: 'joshbot-basic', name: 'JoshBot Basic', default: true },
	{ id: 'joshbot-pro', name: 'JoshBot Pro' },
	{ id: 'joshbot-ultra', name: 'JoshBot Ultra' },
];

const availableSubAgents: vscode.ChatSessionProviderOptionItem[] = [
	{ id: 'basic', name: 'Basic', default: true },
	{ id: 'summarizer', name: 'Summarizer' },
	{ id: 'code-helper', name: 'Code Helper' },
	{ id: 'research-assistant', name: 'Research Assistant' },
];

export function activate(context: vscode.ExtensionContext) {
	console.log('JoshBot extension is now active!');

	// ── Chat Participant ──────────────────────────────────────────────
	const chatParticipant = vscode.chat.createChatParticipant(CHAT_SESSION_TYPE, async (request, chatContext, stream, token) => {
		if (request.command) {
			return handleSlashCommand(request, context, stream, token);
		}
		if (chatContext.chatSessionContext) {
			const sessionId = getSessionIdFromResource(chatContext.chatSessionContext.chatSessionItem.resource);
			stream.markdown(`Welcome back! model=**${_sessionModel.get(sessionId)?.name ?? 'unknown'}** subAgent=**${_sessionSubAgent.get(sessionId)?.name ?? 'unknown'}**\n\n`);
		} else {
			stream.markdown(`Howdy! I am joshbot, your friendly chat companion.`);
		}
	});
	context.subscriptions.push(chatParticipant);

	// ── Session Controller (replaces deprecated registerChatSessionItemProvider) ──
	const controller = vscode.chat.createChatSessionItemController(
		CHAT_SESSION_TYPE,
		async (_token) => {
			// Refresh handler: rebuild the items collection
			const items: vscode.ChatSessionItem[] = [];

			// Demo sessions
			const demos = [
				{ id: 'demo-01', label: 'JoshBot Demo Session 01', age: 30 * 60 * 1000 },
				{ id: 'demo-02', label: 'JoshBot Demo Session 02', age: 2 * 60 * 60 * 1000 },
				{ id: 'demo-03', label: 'JoshBot Demo Session 03', age: 24 * 60 * 60 * 1000 },
			];
			for (const d of demos) {
				const item = controller.createChatSessionItem(
					vscode.Uri.from({ scheme: CHAT_SESSION_TYPE, path: `/${d.id}` }),
					d.label,
				);
				item.status = vscode.ChatSessionStatus.Completed;
				item.timing = { created: Date.now() - d.age };
				item.iconPath = new vscode.ThemeIcon('snake');
				items.push(item);
			}

			controller.items.replace(items);
		},
	);
	context.subscriptions.push(controller);

	// Handle new session creation
	controller.newChatSessionItemHandler = async (ctx) => {
		_sessionCount++;
		const sessionId = `session-${_sessionCount}`;
		const item = controller.createChatSessionItem(
			vscode.Uri.from({ scheme: CHAT_SESSION_TYPE, path: `/${sessionId}` }),
			ctx.request.prompt || `JoshBot Session ${_sessionCount}`,
		);
		item.status = vscode.ChatSessionStatus.Completed;
		item.timing = { created: Date.now() };
		item.iconPath = new vscode.ThemeIcon('snake');
		return item;
	};

	// ── Content Provider ──────────────────────────────────────────────
	const demoIds = new Set(['demo-01', 'demo-02', 'demo-03']);

	context.subscriptions.push(
		vscode.chat.registerChatSessionContentProvider(CHAT_SESSION_TYPE, {
			async provideChatSessionContent(resource, token) {
				const sessionId = getSessionIdFromResource(resource);
				if (!_sessionModel.get(sessionId)) {
					_sessionModel.set(sessionId, availableModels[0]);
				}
				if (!_sessionSubAgent.get(sessionId)) {
					_sessionSubAgent.set(sessionId, availableSubAgents[0]);
				}

				const model = _sessionModel.get(sessionId);
				const options = {
					[MODELS_OPTION_ID]: model?.id ?? 'joshbot-basic',
					[SUB_AGENT_OPTION_ID]: _sessionSubAgent.get(sessionId)?.id ?? 'basic',
				};

				// Demo sessions get pre-filled history
				if (demoIds.has(sessionId)) {
					return {
						history: [
							new vscode.ChatRequestTurn2(`hello (model: ${model?.name})`, undefined, [], 'joshbot', [], [], undefined, undefined, undefined),
							new vscode.ChatResponseTurn2([new vscode.ChatResponseMarkdownPart(`Session: ${sessionId}\n`)], {}, 'joshbot') as vscode.ChatResponseTurn,
						],
						requestHandler: undefined,
						options,
					};
				}

				// New and untitled sessions start with empty history
				return {
					history: [],
					requestHandler: undefined,
					options,
				};
			},

			async provideChatSessionProviderOptions(_token) {
				return {
					optionGroups: [
						{ id: MODELS_OPTION_ID, name: 'Pick Model', description: 'Select the JoshBot model', items: availableModels },
						{ id: SUB_AGENT_OPTION_ID, name: 'Pick Sub-Agent', description: 'Select the JoshBot sub-agent', items: availableSubAgents },
					],
				};
			},

			provideHandleOptionsChange(resource, updates, _token) {
				const sessionId = getSessionIdFromResource(resource);
				for (const update of updates) {
					if (update.optionId === MODELS_OPTION_ID) {
						_sessionModel.set(sessionId, update.value === undefined ? undefined : availableModels.find(m => m.id === update.value));
					}
					if (update.optionId === SUB_AGENT_OPTION_ID) {
						_sessionSubAgent.set(sessionId, update.value === undefined ? undefined : availableSubAgents.find(sa => sa.id === update.value));
					}
				}
			},
		}, chatParticipant)
	);

	// ── Customizations Provider ───────────────────────────────────────
	const customizationsProvider = new JoshBotCustomizationsProvider();
	context.subscriptions.push(
		vscode.chat.registerChatSessionCustomizationsProvider(CHAT_SESSION_TYPE, customizationsProvider)
	);
	context.subscriptions.push(customizationsProvider);
}

// ── Slash Commands ────────────────────────────────────────────────────────

async function handleSlashCommand(request: vscode.ChatRequest, extContext: vscode.ExtensionContext, stream: vscode.ChatResponseStream, _token: vscode.CancellationToken): Promise<void> {
	const parts = request.prompt.trim().split(/\s+/);
	switch (request.command) {
		case 'set-secret': {
			if (parts.length < 2) { stream.warning('Usage: /set-secret <key> <value>'); return; }
			const key = parts[0];
			const value = parts.slice(1).join(' ');
			try {
				await extContext.secrets.store(key, value);
				stream.markdown(`Stored secret **${key}** (value hidden).`);
			} catch (err: any) {
				stream.warning(`Failed to store secret: ${err?.message ?? err}`);
			}
			return;
		}
		case 'secrets': {
			try {
				const keys = await extContext.secrets.keys();
				if (keys.length === 0) { stream.markdown('No secrets stored.'); }
				else { stream.markdown('Stored secret keys:\n' + keys.map(k => `- ${k}\n`).join('')); }
			} catch (err: any) {
				stream.warning(`Failed to read secrets: ${err?.message ?? err}`);
			}
			return;
		}
		default:
			stream.warning(`Unknown command: ${request.command}`);
	}
}

export function deactivate() {}

// ── Customizations Provider ───────────────────────────────────────────────

const JOSHBOT_FOLDER = '.joshbot';

/**
 * Discovers customization items from a `.joshbot/` folder in the workspace.
 *
 * Layout:
 *   .joshbot/
 *     agents/       → *.agent.md files
 *     skills/       → SKILL.md files
 *     instructions/ → *.instructions.md files
 *     prompts/      → *.prompt.md files
 */
class JoshBotCustomizationsProvider implements vscode.ChatSessionCustomizationsProvider, vscode.Disposable {
	private readonly _onDidChangeCustomizations = new vscode.EventEmitter<void>();
	readonly onDidChangeCustomizations = this._onDidChangeCustomizations.event;

	private _watcher: vscode.FileSystemWatcher | undefined;
	private readonly _disposables: vscode.Disposable[] = [];

	constructor() {
		const root = vscode.workspace.workspaceFolders?.[0];
		if (root) {
			const pattern = new vscode.RelativePattern(root, `${JOSHBOT_FOLDER}/**`);
			this._watcher = vscode.workspace.createFileSystemWatcher(pattern);
			this._disposables.push(this._watcher);
			this._watcher.onDidCreate(() => this._onDidChangeCustomizations.fire(), undefined, this._disposables);
			this._watcher.onDidDelete(() => this._onDidChangeCustomizations.fire(), undefined, this._disposables);
			this._watcher.onDidChange(() => this._onDidChangeCustomizations.fire(), undefined, this._disposables);
		}
	}

	async provideCustomizations(_token: vscode.CancellationToken): Promise<vscode.ChatSessionCustomizationItemGroup[]> {
		const groups: vscode.ChatSessionCustomizationItemGroup[] = [];

		const agents = await this._findFiles('agents', '**/*.agent.md');
		if (agents.length > 0) {
			groups.push({ id: vscode.ChatSessionCustomizationType.Agents, items: agents, commands: [{ command: 'joshbot.hello', title: 'New JoshBot Agent' }] });
		}

		const skills = await this._findFiles('skills', '**/SKILL.md');
		if (skills.length > 0) {
			groups.push({ id: vscode.ChatSessionCustomizationType.Skills, items: skills });
		}

		const instructions = await this._findFiles('instructions', '**/*.instructions.md');
		if (instructions.length > 0) {
			groups.push({ id: vscode.ChatSessionCustomizationType.AgentInstructions, items: instructions });
		}

		const prompts = await this._findFiles('prompts', '**/*.prompt.md');
		if (prompts.length > 0) {
			groups.push({ id: vscode.ChatSessionCustomizationType.Prompts, items: prompts });
		}

		return groups;
	}

	async resolveCustomizationDeletion(item: vscode.ChatSessionCustomizationItem, _token: vscode.CancellationToken): Promise<void> {
		await vscode.workspace.fs.delete(item.uri);
	}

	private async _findFiles(subfolder: string, glob: string): Promise<vscode.ChatSessionCustomizationItem[]> {
		const root = vscode.workspace.workspaceFolders?.[0];
		if (!root) { return []; }
		const pattern = new vscode.RelativePattern(vscode.Uri.joinPath(root.uri, JOSHBOT_FOLDER, subfolder), glob);
		const files = await vscode.workspace.findFiles(pattern);
		return files.map(uri => {
			const filename = uri.path.split('/').pop() ?? '';
			const name = filename.replace(/\.(agent|instructions|prompt)\.md$/, '').replace(/^SKILL$/, subfolder);
			return { id: uri.toString(), label: name, description: filename, uri, storageLocation: vscode.ChatSessionCustomizationStorageLocation.Workspace };
		});
	}

	dispose(): void {
		this._disposables.forEach(d => d.dispose());
		this._onDidChangeCustomizations.dispose();
	}
}

function getSessionIdFromResource(resource: vscode.Uri): string {
	return resource.path.startsWith('/') ? resource.path.slice(1) : resource.path;
}
