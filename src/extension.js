"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
async function getSessionContent(id, _token) {
    const sessionManager = JoshBotSessionManager.getInstance();
    return await sessionManager.getSessionContent(id, _token);
}
// Must match package.json's "contributes.chatSessions.[0].id"
const CHAT_SESSION_TYPE = 'josh-bot';
function activate(context) {
    console.log('JoshBot extension is now active!');
    const disposable = vscode.commands.registerCommand('joshbot.hello', () => {
        vscode.window.showInformationMessage('Hello from JoshBot!');
    });
    const sessionManager = JoshBotSessionManager.getInstance();
    sessionManager.initialize(context);
    const provider = new class {
        constructor() {
            this.label = vscode.l10n.t('JoshBot');
            this.provideChatSessionItems = async (_token) => {
                return await sessionManager.getSessionItems(_token);
            };
            this.provideChatSessionContent = async (id, token) => {
                return await getSessionContent(id, token);
            };
            // Events not used yet, but required by interface.
            this.onDidChangeChatSessionItems = new vscode.EventEmitter().event;
        }
    };
    context.subscriptions.push(vscode.chat.registerChatSessionItemProvider(CHAT_SESSION_TYPE, provider));
    context.subscriptions.push(vscode.chat.registerChatSessionContentProvider(CHAT_SESSION_TYPE, provider));
    context.subscriptions.push(disposable);
}
class JoshBotSessionManager {
    constructor() {
        this._sessions = new Map();
    }
    static getInstance() {
        if (!JoshBotSessionManager.instance) {
            JoshBotSessionManager.instance = new JoshBotSessionManager();
        }
        return JoshBotSessionManager.instance;
    }
    initialize(_context) {
        // Create a default session
        this.createDemoSession();
    }
    createDemoSession() {
        const currentResponseParts = [];
        currentResponseParts.push(new vscode.ChatResponseMarkdownPart('hey'));
        const response2 = new vscode.ChatResponseTurn2(currentResponseParts, {}, 'joshbot');
        const defaultSession = {
            id: 'default-session',
            name: 'JoshBot Chat',
            history: [
                new vscode.ChatRequestTurn2('hello', undefined, [], 'joshbot', [], []),
                response2
            ],
            requestHandler: async (request, _context, stream, _token) => {
                // Simple echo bot for demo purposes
                stream.markdown(`You said: "${request.prompt}"`);
                return { metadata: { command: '', sessionId: 'default-session' } };
            }
        };
        this._sessions.set(defaultSession.id, defaultSession);
        const ongoingSession = {
            id: 'ongoing-session',
            name: 'JoshBot Chat ongoing',
            history: [
                new vscode.ChatRequestTurn2('hello', undefined, [], 'joshbot', [], []),
                response2
            ],
            requestHandler: async (request, _context, stream, _token) => {
                // Simple echo bot for demo purposes
                await new Promise(resolve => setTimeout(resolve, 2000));
                stream.markdown(`You said: "${request.prompt}"`);
                return { metadata: { command: '', sessionId: 'ongoing-session' } };
            }
        };
        this._sessions.set(ongoingSession.id, ongoingSession);
    }
    async getSessionContent(id, _token) {
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
        }
        else {
            return {
                history: session.history,
                requestHandler: session.requestHandler,
                activeResponseCallback: undefined
            };
        }
    }
    async createNewSession(name) {
        const sessionId = `session-${Date.now()}`;
        const newSession = {
            id: sessionId,
            name: name || `JoshBot Session ${this._sessions.size + 1}`,
            history: [],
            requestHandler: async (request, _context, stream, _token) => {
                // Simple echo bot for demo purposes
                stream.markdown(`You said: "${request.prompt}"`);
                return { metadata: { command: '', sessionId } };
            }
        };
        this._sessions.set(sessionId, newSession);
        return sessionId;
    }
    async getSessionItems(_token) {
        return Array.from(this._sessions.values()).map(session => ({
            id: session.id,
            label: session.name,
            iconPath: session.iconPath
        }));
    }
}
function deactivate() {
    // This method is called when the extension is deactivated
}
//# sourceMappingURL=extension.js.map