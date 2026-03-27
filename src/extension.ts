/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';

const CHAT_SESSION_TYPE = 'josh-bot';
const MODELS_OPTION_ID = 'model';
const SUB_AGENT_OPTION_ID = 'subagent';

const _sessionModel = new Map<string, vscode.ChatSessionProviderOptionItem | undefined>();
const _sessionSubAgent = new Map<string, vscode.ChatSessionProviderOptionItem | undefined>();

let _sessionCount = 0;

const JOSHBOT_FOLDER = '.joshbot';
const USER_JOSHBOT_DIR = path.join(os.homedir(), JOSHBOT_FOLDER);

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

	// ── Commands ──────────────────────────────────────────────────────
	context.subscriptions.push(
		vscode.commands.registerCommand('joshbot.newAgent', async () => {
			const name = await vscode.window.showInputBox({ prompt: 'Agent name', placeHolder: 'my-agent' });
			if (!name) { return; }
			const root = vscode.workspace.workspaceFolders?.[0];
			if (!root) { vscode.window.showWarningMessage('Open a workspace first'); return; }
			const uri = vscode.Uri.joinPath(root.uri, JOSHBOT_FOLDER, 'agents', `${name}.agent.md`);
			await vscode.workspace.fs.writeFile(uri, Buffer.from(`---\ndescription: ${name} agent\ntools:\n  - search/codebase\n---\n\nYou are **${name}**, a helpful agent.\n`));
			await vscode.commands.executeCommand('vscode.open', uri);
		}),
		vscode.commands.registerCommand('joshbot.newSkill', async () => {
			const name = await vscode.window.showInputBox({ prompt: 'Skill name', placeHolder: 'my-skill' });
			if (!name) { return; }
			const root = vscode.workspace.workspaceFolders?.[0];
			if (!root) { vscode.window.showWarningMessage('Open a workspace first'); return; }
			const dir = vscode.Uri.joinPath(root.uri, JOSHBOT_FOLDER, 'skills', name);
			const uri = vscode.Uri.joinPath(dir, 'SKILL.md');
			await vscode.workspace.fs.writeFile(uri, Buffer.from(`---\nname: ${name}\ndescription: ${name} skill\n---\n\n# ${name}\n\nThis skill does amazing things.\n`));
			await vscode.commands.executeCommand('vscode.open', uri);
		}),
		vscode.commands.registerCommand('joshbot.newInstruction', async () => {
			const name = await vscode.window.showInputBox({ prompt: 'Instruction name', placeHolder: 'my-rules' });
			if (!name) { return; }
			const root = vscode.workspace.workspaceFolders?.[0];
			if (!root) { vscode.window.showWarningMessage('Open a workspace first'); return; }
			const uri = vscode.Uri.joinPath(root.uri, JOSHBOT_FOLDER, 'instructions', `${name}.instructions.md`);
			await vscode.workspace.fs.writeFile(uri, Buffer.from(`---\ndescription: ${name} instructions\n---\n\nFollow the ${name} guidelines.\n`));
			await vscode.commands.executeCommand('vscode.open', uri);
		}),
		vscode.commands.registerCommand('joshbot.newPrompt', async () => {
			const name = await vscode.window.showInputBox({ prompt: 'Prompt name', placeHolder: 'my-prompt' });
			if (!name) { return; }
			const root = vscode.workspace.workspaceFolders?.[0];
			if (!root) { vscode.window.showWarningMessage('Open a workspace first'); return; }
			const uri = vscode.Uri.joinPath(root.uri, JOSHBOT_FOLDER, 'prompts', `${name}.prompt.md`);
			await vscode.workspace.fs.writeFile(uri, Buffer.from(`---\ndescription: ${name} prompt\n---\n\nPlease ${name} the code.\n`));
			await vscode.commands.executeCommand('vscode.open', uri);
		}),
		vscode.commands.registerCommand('joshbot.newUserAgent', async () => {
			const name = await vscode.window.showInputBox({ prompt: 'User agent name', placeHolder: 'my-global-agent' });
			if (!name) { return; }
			const uri = vscode.Uri.file(path.join(USER_JOSHBOT_DIR, 'agents', `${name}.agent.md`));
			await vscode.workspace.fs.writeFile(uri, Buffer.from(`---\ndescription: ${name} user agent\ntools:\n  - search/codebase\n---\n\nYou are **${name}**, a global agent.\n`));
			await vscode.commands.executeCommand('vscode.open', uri);
		}),
		vscode.commands.registerCommand('joshbot.openItem', async (itemUri: vscode.Uri | string) => {
			const uri = itemUri instanceof vscode.Uri ? itemUri : vscode.Uri.parse(itemUri);
			if (uri.scheme === 'joshbot-builtin') {
				vscode.window.showInformationMessage(`Built-in item: ${uri.path}`);
				return;
			}
			await vscode.commands.executeCommand('vscode.open', uri);
		}),
		vscode.commands.registerCommand('joshbot.inspectItem', async (itemUri: vscode.Uri | string) => {
			const uri = itemUri instanceof vscode.Uri ? itemUri : vscode.Uri.parse(itemUri);
			if (uri.scheme === 'joshbot-builtin') {
				vscode.window.showInformationMessage(`Built-in: ${uri.path.slice(1)} (no file on disk)`);
				return;
			}
			try {
				const content = await vscode.workspace.fs.readFile(uri);
				const preview = Buffer.from(content).toString('utf8').slice(0, 200);
				vscode.window.showInformationMessage(`${path.basename(uri.path)}: ${preview}...`);
			} catch {
				vscode.window.showWarningMessage(`Cannot read: ${uri.path}`);
			}
		}),
	);

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

	// ── Session Controller ────────────────────────────────────────────
	const controller = vscode.chat.createChatSessionItemController(
		CHAT_SESSION_TYPE,
		async (_token) => {
			const items: vscode.ChatSessionItem[] = [];
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
				if (!_sessionModel.get(sessionId)) { _sessionModel.set(sessionId, availableModels[0]); }
				if (!_sessionSubAgent.get(sessionId)) { _sessionSubAgent.set(sessionId, availableSubAgents[0]); }

				const model = _sessionModel.get(sessionId);
				const options = {
					[MODELS_OPTION_ID]: model?.id ?? 'joshbot-basic',
					[SUB_AGENT_OPTION_ID]: _sessionSubAgent.get(sessionId)?.id ?? 'basic',
				};

				if (demoIds.has(sessionId)) {
					return {
						history: [
							new vscode.ChatRequestTurn2(`hello (model: ${model?.name})`, undefined, [], 'josh-bot', [], [], undefined, undefined, undefined),
							new vscode.ChatResponseTurn2([new vscode.ChatResponseMarkdownPart(`Session: ${sessionId}\n`)], {}, 'josh-bot') as vscode.ChatResponseTurn,
						],
						requestHandler: undefined,
						options,
					};
				}

				return { history: [], requestHandler: undefined, options };
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
		vscode.chat.registerChatSessionCustomizationProvider('joshbot', {
			label: 'JoshBot',
			iconId: 'snake',
			workspaceSubpaths: [JOSHBOT_FOLDER],
		}, customizationsProvider)
	);
	context.subscriptions.push(customizationsProvider);
}

// ── Slash Commands ────────────────────────────────────────────────────────

async function handleSlashCommand(request: vscode.ChatRequest, extContext: vscode.ExtensionContext, stream: vscode.ChatResponseStream, _token: vscode.CancellationToken): Promise<void> {
	const parts = request.prompt.trim().split(/\s+/);
	switch (request.command) {
		case 'set-secret': {
			if (parts.length < 2) { stream.warning('Usage: /set-secret <key> <value>'); return; }
			try {
				await extContext.secrets.store(parts[0], parts.slice(1).join(' '));
				stream.markdown(`Stored secret **${parts[0]}** (value hidden).`);
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

export function deactivate() { }

// ── Customizations Provider ───────────────────────────────────────────────

/**
 * Discovers customization items from multiple sources:
 * - Workspace: `.joshbot/` folder in the workspace
 * - User: `~/.joshbot/` folder (user-level customizations)
 * - Global: items from the chatPromptFiles API (other extensions' agents/skills/etc.)
 * - BuiltIn: hardcoded items shipped with the extension
 *
 * Exercises the ChatSessionCustomizationProvider API surface:
 * - All customization types (Agents, Skills, Instructions, Prompts)
 * - File watchers for dynamic updates via onDidChange
 * - Custom icons on items
 */
class JoshBotCustomizationsProvider implements vscode.ChatSessionCustomizationProvider, vscode.Disposable {
	private readonly _onDidChange = new vscode.EventEmitter<void>();
	readonly onDidChange = this._onDidChange.event;
	private readonly _disposables: vscode.Disposable[] = [];

	constructor() {
		// Watch workspace .joshbot/
		const root = vscode.workspace.workspaceFolders?.[0];
		if (root) {
			const watcher = vscode.workspace.createFileSystemWatcher(
				new vscode.RelativePattern(root, `${JOSHBOT_FOLDER}/**`)
			);
			this._disposables.push(watcher);
			watcher.onDidCreate(() => this._onDidChange.fire(), undefined, this._disposables);
			watcher.onDidDelete(() => this._onDidChange.fire(), undefined, this._disposables);
			watcher.onDidChange(() => this._onDidChange.fire(), undefined, this._disposables);
		}

		// Watch user ~/.joshbot/
		const userWatcher = vscode.workspace.createFileSystemWatcher(
			new vscode.RelativePattern(vscode.Uri.file(USER_JOSHBOT_DIR), '**')
		);
		this._disposables.push(userWatcher);
		userWatcher.onDidCreate(() => this._onDidChange.fire(), undefined, this._disposables);
		userWatcher.onDidDelete(() => this._onDidChange.fire(), undefined, this._disposables);
		userWatcher.onDidChange(() => this._onDidChange.fire(), undefined, this._disposables);

		// Re-curate when global customizations change (other extensions' agents/skills/instructions)
		this._disposables.push(vscode.chat.onDidChangeCustomAgents(() => this._onDidChange.fire()));
		this._disposables.push(vscode.chat.onDidChangeSkills(() => this._onDidChange.fire()));
		this._disposables.push(vscode.chat.onDidChangeInstructions(() => this._onDidChange.fire()));
	}

	async provideChatSessionCustomizations(_token: vscode.CancellationToken): Promise<vscode.ChatSessionCustomizationItem[]> {
		const items: vscode.ChatSessionCustomizationItem[] = [];

		// ── Pull globally-discovered items via chatPromptFiles API ────
		const globalAgents = this._resourceToItems(vscode.chat.customAgents, vscode.ChatSessionCustomizationType.Agent);
		const globalSkills = this._resourceToItems(vscode.chat.skills, vscode.ChatSessionCustomizationType.Skill);
		const globalInstructions = this._resourceToItems(vscode.chat.instructions, vscode.ChatSessionCustomizationType.Instructions);

		// ── Agents ────────────────────────────────────────────────────
		items.push(
			...await this._findWorkspaceFiles('agents', '**/*.agent.md', vscode.ChatSessionCustomizationType.Agent),
			...await this._findUserFiles('agents', '**/*.agent.md', vscode.ChatSessionCustomizationType.Agent),
			...globalAgents.slice(0, 3),
		);

		// ── Skills ────────────────────────────────────────────────────
		items.push(
			...await this._findWorkspaceFiles('skills', '**/SKILL.md', vscode.ChatSessionCustomizationType.Skill),
			...await this._findUserFiles('skills', '**/SKILL.md', vscode.ChatSessionCustomizationType.Skill),
			...globalSkills.slice(0, 3),
		);

		// ── Instructions ──────────────────────────────────────────────
		items.push(
			...await this._findWorkspaceFiles('instructions', '**/*.instructions.md', vscode.ChatSessionCustomizationType.Instructions),
			...await this._findUserFiles('instructions', '**/*.instructions.md', vscode.ChatSessionCustomizationType.Instructions),
			...globalInstructions.slice(0, 3),
		);

		// ── Built-in instruction items ────────────────────────────────
		items.push({
			name: 'TypeScript Style Guide',
			description: 'Auto-applied to *.ts files',
			uri: vscode.Uri.parse('joshbot-builtin://instructions/ts-style'),
			type: vscode.ChatSessionCustomizationType.Instructions,
		});
		items.push({
			name: 'Security Review Checklist',
			description: 'Invoke manually for security audits',
			uri: vscode.Uri.parse('joshbot-builtin://instructions/security-review'),
			type: vscode.ChatSessionCustomizationType.Instructions,
		});

		// ── Prompts ───────────────────────────────────────────────────
		items.push(
			...await this._findWorkspaceFiles('prompts', '**/*.prompt.md', vscode.ChatSessionCustomizationType.Prompt),
			...await this._findUserFiles('prompts', '**/*.prompt.md', vscode.ChatSessionCustomizationType.Prompt),
		);
		items.push({
			name: 'Explain Code',
			description: 'Built-in prompt to explain selected code',
			uri: vscode.Uri.parse('joshbot-builtin://prompts/explain'),
			type: vscode.ChatSessionCustomizationType.Prompt,
		});

		return items;
	}

	/** Convert ChatResource[] from chatPromptFiles API to customization items. */
	private _resourceToItems(resources: readonly vscode.ChatResource[], type: vscode.ChatSessionCustomizationType): vscode.ChatSessionCustomizationItem[] {
		return resources.map(r => {
			const parts = r.uri.path.split('/');
			const filename = parts.pop() ?? '';
			const name = filename === 'SKILL.md'
				? (parts.pop() ?? 'skill')
				: (filename.replace(/\.(agent|instructions|prompt)\.md$/, '') || 'untitled');
			return {
				name,
				description: `${filename} (global)`,
				uri: r.uri,
				type,
			};
		});
	}

	private async _findWorkspaceFiles(subfolder: string, glob: string, type: vscode.ChatSessionCustomizationType): Promise<vscode.ChatSessionCustomizationItem[]> {
		const root = vscode.workspace.workspaceFolders?.[0];
		if (!root) { return []; }
		return this._scanDir(vscode.Uri.joinPath(root.uri, JOSHBOT_FOLDER, subfolder), glob, type);
	}

	private async _findUserFiles(subfolder: string, glob: string, type: vscode.ChatSessionCustomizationType): Promise<vscode.ChatSessionCustomizationItem[]> {
		return this._scanDir(vscode.Uri.file(path.join(USER_JOSHBOT_DIR, subfolder)), glob, type);
	}

	private async _scanDir(base: vscode.Uri, glob: string, type: vscode.ChatSessionCustomizationType): Promise<vscode.ChatSessionCustomizationItem[]> {
		const pattern = new vscode.RelativePattern(base, glob);
		const files = await vscode.workspace.findFiles(pattern);
		return files.map(uri => {
			const parts = uri.path.split('/');
			const filename = parts.pop() ?? '';
			const name = filename === 'SKILL.md'
				? (parts.pop() ?? 'skill')
				: filename.replace(/\.(agent|instructions|prompt)\.md$/, '');
			return { name, description: filename, uri, type };
		});
	}

	dispose(): void {
		this._disposables.forEach(d => d.dispose());
		this._onDidChange.dispose();
	}
}

function getSessionIdFromResource(resource: vscode.Uri): string {
	return resource.path.startsWith('/') ? resource.path.slice(1) : resource.path;
}
