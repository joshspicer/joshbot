# TypeScript Definitions for VS Code Chat Functionality

This document explains the TypeScript definition files (`.d.ts`) used in this Visual Studio Code extension for implementing chat functionality. These files define the proposed APIs for various chat-related features in VS Code.

## Overview

The extension uses five main TypeScript definition files that extend the VS Code API with chat-related functionality:

1. **`vscode.proposed.chatParticipantPrivate.d.ts`** - Private chat participant APIs and internal functionality
2. **`vscode.proposed.chatParticipantAdditions.d.ts`** - Additional chat participant features and response types
3. **`vscode.proposed.chatSessionsProvider.d.ts`** - Chat session management and provider APIs
4. **`vscode.proposed.languageModelThinkingPart.d.ts`** - Language model thinking/reasoning functionality
5. **`vscode.proposed.remoteCodingAgents.d.ts`** - Remote coding agent contribution points (placeholder)

---

## 1. Chat Participant Private API (`vscode.proposed.chatParticipantPrivate.d.ts`)

This file contains private APIs for chat participants with enhanced functionality and internal features.

### Enums

#### `ChatLocation`
Defines where chat interactions can occur:
- `Panel = 1` - The main chat panel
- `Terminal = 2` - Terminal inline chat
- `Notebook = 3` - Notebook inline chat
- `Editor = 4` - Code editor inline chat

#### `ChatRequestEditedFileEventKind`
Tracks file edit events during chat sessions:
- `Keep = 1` - File changes are kept
- `Undo = 2` - File changes are undone
- `UserModification = 3` - User made modifications to the file

#### `ChatErrorLevel`
Severity levels for chat errors:
- `Info = 0` - Informational messages
- `Warning = 1` - Warning messages  
- `Error = 2` - Error messages

### Classes

#### `ChatRequestEditorData`
Contains editor-specific data for chat requests:
- `document: TextDocument` - The document being edited
- `selection: Selection` - Current text selection
- `wholeRange: Range` - The entire range being considered

#### `ChatRequestNotebookData`
Contains notebook-specific data for chat requests:
- `cell: TextDocument` - The notebook cell document

#### `ChatRequestTurn2`
Enhanced version of ChatRequestTurn with private additions:
- `prompt: string` - The user's input prompt
- `participant: string` - ID of the target chat participant
- `command?: string` - Optional command name
- `references: ChatPromptReference[]` - References used in the request
- `toolReferences: ChatLanguageModelToolReference[]` - Tool references
- `editedFileEvents?: ChatRequestEditedFileEvent[]` - File edit events

#### `ChatResponseTurn2`
Enhanced chat response with additional metadata:
- `response: ReadonlyArray<ChatResponsePart>` - Response content parts
- `result: ChatResult` - The chat result
- `participant: string` - ID of responding participant
- `command?: string` - Command that generated the response

### Interfaces

#### `ChatRequest`
Core chat request interface with extended properties:
- `id: string` - Unique request identifier
- `attempt: number` - Request attempt number (starts at 0)
- `enableCommandDetection: boolean` - Whether command detection is enabled
- `isParticipantDetected: boolean` - Whether participant was auto-detected
- `location: ChatLocation` - Where the chat is happening (deprecated)
- `location2: ChatRequestEditorData | ChatRequestNotebookData | undefined` - Location-specific data
- `editedFileEvents?: ChatRequestEditedFileEvent[]` - File editing events

#### `ChatRequestEditedFileEvent`
Represents a file editing event:
- `uri: Uri` - File URI
- `eventKind: ChatRequestEditedFileEventKind` - Type of edit event

#### `ChatErrorDetails`
Error information for chat responses:
- `responseIsRedacted?: boolean` - Whether response content is hidden
- `isQuotaExceeded?: boolean` - Whether usage quota was exceeded
- `level?: ChatErrorLevel` - Error severity level

#### `DynamicChatParticipantProps`
Properties for dynamically created chat participants:
- `name: string` - Participant name
- `publisherName: string` - Publisher/creator name
- `description?: string` - Optional description
- `fullName?: string` - Optional full display name

#### `LanguageModelIgnoredFileProvider`
Interface for providing file ignore logic:
- `provideFileIgnored(uri: Uri, token: CancellationToken): ProviderResult<boolean>` - Determines if file should be ignored

### Namespaces

#### `chat`
- `createDynamicChatParticipant()` - Creates dynamic chat participants

#### `lm`
- `registerIgnoredFileProvider()` - Registers file ignore providers

---

## 2. Chat Participant Additions (`vscode.proposed.chatParticipantAdditions.d.ts`)

This file provides additional features and response types for chat participants.

### Enums

#### `ChatEditingSessionActionOutcome`
Outcomes for editing session actions:
- `Accepted = 1` - Changes were accepted
- `Rejected = 2` - Changes were rejected
- `Saved = 3` - Changes were saved

#### `ChatVariableLevel`
Detail levels for chat variables:
- `Short = 1` - Brief information
- `Medium = 2` - Moderate detail
- `Full = 3` - Complete information

#### `ChatResponseReferencePartStatusKind`
Status of reference parts:
- `Complete = 1` - Reference is complete
- `Partial = 2` - Reference is partially loaded
- `Omitted = 3` - Reference was omitted

#### `ChatResponseClearToPreviousToolInvocationReason`
Reasons for clearing to previous tool invocation:
- `NoReason = 0` - No specific reason

#### `ChatCopyKind`
How content was copied from chat:
- `Action = 1` - Via keyboard shortcut or context menu
- `Toolbar = 2` - Via toolbar button

### Classes

#### `ChatResponseTextEditPart`
Represents text edits in chat responses:
- `uri: Uri` - File URI to edit
- `edits: TextEdit[]` - Array of text edits
- `isDone?: boolean` - Whether editing is complete

#### `ChatResponseNotebookEditPart`
Represents notebook edits in chat responses:
- `uri: Uri` - Notebook URI
- `edits: NotebookEdit[]` - Array of notebook edits
- `isDone?: boolean` - Whether editing is complete

#### `ChatResponseConfirmationPart`
Interactive confirmation dialogs in chat:
- `title: string` - Confirmation dialog title
- `message: string | MarkdownString` - Message content
- `data: any` - Associated data
- `buttons?: string[]` - Optional action buttons

#### `ChatResponseCodeCitationPart`
Code citation information:
- `value: Uri` - Source code URI
- `license: string` - License information
- `snippet: string` - Code snippet

#### `ChatResponseMultiDiffPart`
Multiple file diffs display:
- `value: ChatResponseDiffEntry[]` - Array of diff entries
- `title: string` - Multi-diff title

#### `ChatResponseMarkdownWithVulnerabilitiesPart`
Markdown content with security vulnerability annotations:
- `value: MarkdownString` - Markdown content
- `vulnerabilities: ChatVulnerability[]` - Security vulnerabilities

#### `ChatResponseCodeblockUriPart`
Code block with URI reference:
- `value: Uri` - Referenced URI
- `isEdit?: boolean` - Whether this represents an edit

#### `ChatResponseThinkingProgressPart`
Specialized progress indicator for thinking/reasoning:
- Extends `ChatResponseProgressPart` with thinking-specific functionality

#### `ChatResponseReferencePart2`
Enhanced reference part for chat responses:
- `value: Uri | Location | {variableName: string; value?: Uri | Location} | string` - Reference target
- `iconPath?: Uri | ThemeIcon | {light: Uri; dark: Uri}` - Reference icon
- `options?: {status?: {description: string; kind: ChatResponseReferencePartStatusKind}}` - Status options

#### `ChatResponseMovePart`
Represents a file move operation:
- `uri: Uri` - Target URI
- `range: Range` - Range to move

#### `ChatResponseExtensionsPart`
Lists VS Code extensions:
- `extensions: string[]` - Array of extension identifiers

#### `ChatResponsePullRequestPart`
Pull request information display:
- `uri: Uri` - Pull request URI
- `linkTag: string` - Link identifier
- `title: string` - Pull request title
- `description: string` - Pull request description
- `author: string` - Pull request author

#### `ChatToolInvocationPart`
Tool invocation in chat responses:
- `toolName: string` - Name of invoked tool
- `toolCallId: string` - Unique call identifier
- `isError?: boolean` - Whether invocation resulted in error
- `invocationMessage?: string | MarkdownString` - Message during invocation
- `originMessage?: string | MarkdownString` - Origin context message
- `pastTenseMessage?: string | MarkdownString` - Past tense completion message
- `isConfirmed?: boolean` - Whether user confirmed the action
- `isComplete?: boolean` - Whether invocation is complete
- `toolSpecificData?: ChatTerminalToolInvocationData` - Tool-specific data

#### `ChatCompletionItem`
Auto-completion item for chat:
- `id: string` - Unique identifier
- `label: string | CompletionItemLabel` - Display label
- `values: ChatVariableValue[]` - Associated values
- `fullName?: string` - Optional full name
- `icon?: ThemeIcon` - Optional icon
- `insertText?: string` - Text to insert
- `detail?: string` - Additional detail
- `documentation?: string | MarkdownString` - Documentation
- `command?: Command` - Associated command

### Interfaces

#### `ChatDocumentContext`
Document context information:
- `uri: Uri` - Document URI
- `version: number` - Document version
- `ranges: Range[]` - Relevant ranges

#### `ChatCommand`
Chat command definition (for intent detection):
- `name: string` - Command name
- `description: string` - Command description

#### `ChatVulnerability`
Security vulnerability information:
- `title: string` - Vulnerability title
- `description: string` - Vulnerability description

#### `ChatCommandButton`
Command button in chat responses:
- `command: Command` - VS Code command to execute

#### `ChatResponseDiffEntry`
Single file diff entry:
- `originalUri?: Uri` - Original file (undefined for new files)
- `modifiedUri?: Uri` - Modified file (undefined for deleted files)
- `goToFileUri?: Uri` - URI to navigate to when clicked

#### `ChatResponseAnchorPart`
Anchor links in chat responses:
- `value2: Uri | Location | SymbolInformation` - Link target (URI, location, or symbol)
- `resolve?(token): Thenable<void>` - Optional method to resolve symbol details

#### `ChatTerminalToolInvocationData`
Terminal-specific tool invocation data:
- `commandLine: {original: string; userEdited?: string; toolEdited?: string}` - Command line variants
- `language: string` - Programming/shell language

#### `ChatParticipantCompletionItemProvider`
Provides completion items for chat participants:
- `provideCompletionItems(query: string, token: CancellationToken): ProviderResult<ChatCompletionItem[]>` - Gets completion items

#### `ChatParticipantPauseStateEvent`
Event for pause state changes:
- `request: ChatRequest` - The affected request
- `isPaused: boolean` - Current pause state

#### `ChatResponseStream`
Extended response streaming interface:
- `progress(value, task?)` - Push progress updates
- `thinkingProgress(thinkingDelta)` - Push thinking/reasoning updates
- `textEdit(target, edits)` - Apply text edits
- `notebookEdit(target, edits)` - Apply notebook edits
- `markdownWithVulnerabilities(value, vulnerabilities)` - Add markdown with security annotations
- `codeblockUri(uri, isEdit?)` - Add code block with URI reference
- `confirmation(title, message, data, buttons?)` - Request user confirmation

### Type Definitions

#### `ChatExtendedRequestHandler`
Enhanced request handler function type:
```typescript
(request: ChatRequest, context: ChatContext, response: ChatResponseStream, token: CancellationToken) => ProviderResult<ChatResult | void>
```

#### `ThinkingDelta`
Union type for thinking content updates with various combinations of:
- `text?: string` - Thinking text content
- `id?: string` - Thinking sequence ID
- `metadata?: string` - Associated metadata

---

## 3. Chat Sessions Provider (`vscode.proposed.chatSessionsProvider.d.ts`)

This file defines APIs for managing chat sessions and their lifecycle.

### Enums

#### `ChatSessionStatus`
Current status of chat sessions:
- `Failed = 0` - Session failed to complete
- `Completed = 1` - Session completed successfully
- `InProgress = 2` - Session is currently active

### Interfaces

#### `ChatSessionItemProvider`
Provides chat session listings and management:
- `onDidChangeChatSessionItems: Event<void>` - Event when sessions change
- `onDidCommitChatSessionItem: Event<{original, modified}>` - Event when session is replaced
- `provideChatSessionItems(token): Promise<ChatSessionItem[]>` - Gets available sessions

#### `ChatSessionItem`
Metadata for a chat session:
- `id: string` - Unique session identifier
- `label: string` - Display name
- `iconPath?: IconPath` - Optional icon
- `description?: string | MarkdownString` - Optional description
- `status?: ChatSessionStatus` - Current session status
- `tooltip?: string | MarkdownString` - Hover tooltip
- `timing?: {startTime, endTime}` - Session timing information
- `statistics?: {insertions, deletions}` - Session statistics

#### `ChatSession`
Full chat session content:
- `history: ReadonlyArray<ChatRequestTurn | ChatResponseTurn2>` - Complete chat history
- `activeResponseCallback?: (stream, token) => Thenable<void>` - Handler for active responses
- `requestHandler: ChatRequestHandler | undefined` - Handler for new requests

#### `ChatSessionContentProvider`
Provides full session content:
- `provideChatSessionContent(sessionId, token): Thenable<ChatSession>` - Resolves session content

### Namespaces

#### `chat`
Session management functions:
- `registerChatSessionItemProvider()` - Registers session item providers
- `registerChatSessionContentProvider()` - Registers session content providers
- `showChatSession()` - Opens a specific chat session

---

## 4. Language Model Thinking Part (`vscode.proposed.languageModelThinkingPart.d.ts`)

This file defines APIs for language model thinking and reasoning content.

### Classes

#### `LanguageModelThinkingPart`
Represents model's internal reasoning:
- `value: string` - The thinking/reasoning text
- `id?: string` - Optional unique identifier for the thinking sequence
- `metadata?: string` - Optional metadata for the thinking sequence
- `constructor(value, id?, metadata?)` - Creates thinking part with content

### Interfaces

#### `LanguageModelChatResponse`
Enhanced chat response interface:
- `stream: AsyncIterable<LanguageModelTextPart | LanguageModelThinkingPart | LanguageModelToolCallPart | unknown>` - Stream including thinking parts

---

## 5. Remote Coding Agents (`vscode.proposed.remoteCodingAgents.d.ts`)

This file is currently a placeholder for remote coding agent contribution points. It contains only copyright information and a comment indicating it's an empty placeholder for coding agent functionality from the VS Code core.

---

## Usage in Extension

These TypeScript definitions are used throughout the extension to:

1. **Define chat participant behavior** - Handle user requests and generate responses
2. **Manage chat sessions** - Create, list, and provide content for chat sessions  
3. **Handle file operations** - Track and manage file edits during chat interactions
4. **Provide thinking/reasoning** - Display model reasoning process to users
5. **Error handling** - Manage and display various types of chat errors
6. **UI components** - Render different types of chat response content

The extension leverages these APIs through the `enabledApiProposals` configuration in `package.json`, which enables the proposed APIs:
- `chatSessionsProvider@2`
- `chatParticipantAdditions` 
- `chatParticipantPrivate`
- `remoteCodingAgents`
- `languageModelThinkingPart`

This allows the extension to provide advanced chat functionality while the APIs are still in development and not yet part of the stable VS Code API.