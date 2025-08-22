/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

declare module 'vscode' {

	/**
	 * Represents a remote coding agent that can assist with development tasks.
	 */
	export interface RemoteCodingAgent {
		/**
		 * Unique identifier for the coding agent.
		 */
		readonly id: string;

		/**
		 * Human-readable name of the coding agent.
		 */
		readonly name: string;

		/**
		 * Display name shown in the UI.
		 */
		readonly displayName: string;

		/**
		 * Optional description of the coding agent's capabilities.
		 */
		readonly description?: string;

		/**
		 * Command to execute when the coding agent is invoked.
		 */
		readonly command: string;

		/**
		 * Optional condition for when the coding agent should be available.
		 */
		readonly when?: string;

		/**
		 * Optional icon for the coding agent.
		 */
		readonly iconPath?: Uri | { light: Uri; dark: Uri };
	}

	/**
	 * Configuration options for registering a remote coding agent.
	 */
	export interface RemoteCodingAgentOptions {
		/**
		 * The coding agent to register.
		 */
		readonly agent: RemoteCodingAgent;

		/**
		 * Handler function called when the coding agent is invoked.
		 */
		readonly handler: RemoteCodingAgentHandler;
	}

	/**
	 * Handler function for remote coding agent invocations.
	 */
	export interface RemoteCodingAgentHandler {
		/**
		 * Called when the remote coding agent is invoked.
		 * 
		 * @param context Context information about the invocation
		 * @param token Cancellation token
		 * @returns Promise that resolves to the result of the coding agent operation
		 */
		(context: RemoteCodingAgentContext, token: CancellationToken): ProviderResult<RemoteCodingAgentResult>;
	}

	/**
	 * Context provided to remote coding agent handlers.
	 */
	export interface RemoteCodingAgentContext {
		/**
		 * The workspace where the coding agent is being invoked.
		 */
		readonly workspace?: WorkspaceFolder;

		/**
		 * Active text editor, if any.
		 */
		readonly activeEditor?: TextEditor;

		/**
		 * Selected text in the active editor, if any.
		 */
		readonly selection?: string;

		/**
		 * Additional parameters passed to the coding agent.
		 */
		readonly parameters?: { [key: string]: any };
	}

	/**
	 * Result returned by a remote coding agent handler.
	 */
	export interface RemoteCodingAgentResult {
		/**
		 * Optional URI to show or navigate to.
		 */
		readonly uri?: Uri;

		/**
		 * Optional title for the result.
		 */
		readonly title?: string;

		/**
		 * Optional description of what was accomplished.
		 */
		readonly description?: string;

		/**
		 * Optional author information.
		 */
		readonly author?: string;

		/**
		 * Optional link tag or identifier.
		 */
		readonly linkTag?: string;

		/**
		 * Optional status message.
		 */
		readonly status?: string;

		/**
		 * Additional metadata about the result.
		 */
		readonly metadata?: { [key: string]: any };
	}

	/**
	 * Provider for remote coding agents.
	 */
	export interface RemoteCodingAgentProvider {
		/**
		 * Event fired when the list of available coding agents changes.
		 */
		readonly onDidChangeAgents?: Event<void>;

		/**
		 * Get the list of available remote coding agents.
		 * 
		 * @param token Cancellation token
		 * @returns Array of available coding agents
		 */
		provideAgents(token: CancellationToken): ProviderResult<RemoteCodingAgent[]>;

		/**
		 * Invoke a specific coding agent.
		 * 
		 * @param agentId ID of the agent to invoke
		 * @param context Context for the invocation
		 * @param token Cancellation token
		 * @returns Result of the coding agent operation
		 */
		invokeAgent(agentId: string, context: RemoteCodingAgentContext, token: CancellationToken): ProviderResult<RemoteCodingAgentResult>;
	}

	export namespace remoteCodingAgents {
		/**
		 * Register a remote coding agent provider.
		 * 
		 * @param provider The provider to register
		 * @returns Disposable to unregister the provider
		 */
		export function registerProvider(provider: RemoteCodingAgentProvider): Disposable;

		/**
		 * Register a single remote coding agent.
		 * 
		 * @param options Configuration for the coding agent
		 * @returns Disposable to unregister the agent
		 */
		export function registerAgent(options: RemoteCodingAgentOptions): Disposable;

		/**
		 * Get all currently registered remote coding agents.
		 * 
		 * @param token Cancellation token
		 * @returns Array of available coding agents
		 */
		export function getAgents(token?: CancellationToken): Thenable<RemoteCodingAgent[]>;

		/**
		 * Invoke a specific remote coding agent by ID.
		 * 
		 * @param agentId ID of the agent to invoke
		 * @param context Context for the invocation
		 * @param token Cancellation token
		 * @returns Result of the coding agent operation
		 */
		export function invokeAgent(agentId: string, context?: RemoteCodingAgentContext, token?: CancellationToken): Thenable<RemoteCodingAgentResult>;
	}
}
