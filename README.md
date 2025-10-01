# JoshBot

A VS Code extension demonstrating chat participant capabilities using proposed APIs.

## Overview

JoshBot is a sample VS Code extension that showcases how to create custom chat participants with session management capabilities. It uses several proposed VS Code APIs to provide an interactive chat experience.

## Proposed API Files

This extension uses several VS Code proposed API type definition files:

### vscode.proposed.chatParticipantPrivate.d.ts

This file provides **private/internal extensions** to the VS Code Chat API that are not yet part of the stable API. It includes:

#### Key Components:

- **ChatLocation enum** - Defines where chat interactions occur:
  - `Panel` - The chat panel
  - `Terminal` - Terminal inline chat
  - `Notebook` - Notebook inline chat
  - `Editor` - Code editor inline chat

- **Location-specific data classes**:
  - `ChatRequestEditorData` - Contains document, selection, and range information for editor-based chats
  - `ChatRequestNotebookData` - Contains cell information for notebook-based chats

- **ChatRequest extensions** - Adds private properties to chat requests:
  - Session and request identifiers
  - Command detection settings
  - Location information
  - Edited file events tracking

- **ChatRequestTurn2 & ChatResponseTurn2** - Extended versions of chat turn types that include:
  - Full prompt and participant information
  - Command details
  - References and tool attachments
  - Edited file event tracking

- **ChatParticipant extensions**:
  - `supportIssueReporting` - Enables issue reporting for the participant

- **Error handling**:
  - `ChatErrorLevel` - Info, Warning, Error severity levels
  - `ChatErrorDetails` - Enhanced error information including rate limiting, quota exceeded, and confirmation buttons

- **Dynamic participant creation**:
  - `createDynamicChatParticipant()` - Creates chat participants at runtime
  - `DynamicChatParticipantProps` - Properties for dynamic participants

- **Language model features**:
  - `LanguageModelIgnoredFileProvider` - Filter files from language model context
  - `LanguageModelToolInvocationOptions` - Options for tool invocations including session tracking
  - `ExtendedLanguageModelToolResult` - Enhanced tool results with messages and metadata

- **Participant detection**:
  - `ChatParticipantDetectionProvider` - Automatically detects which participant should handle a request
  - `registerChatParticipantDetectionProvider()` - Registers detection providers

#### Usage in this extension:

JoshBot uses this API to:
- Create predefined demo sessions with hardcoded request/response pairs using `ChatRequestTurn2` and `ChatResponseTurn2`
- Handle user confirmations for creating new chat sessions using the confirmation step mechanism

### Other Proposed API Files:

- **vscode.proposed.chatSessionsProvider.d.ts** - Provides APIs for managing chat sessions, including:
  - Session item providers
  - Session content providers
  - Session status and capabilities
  - History and active response handling

- **vscode.proposed.chatParticipantAdditions.d.ts** - Additional chat participant features:
  - Extended response parts (extensions, pull requests, code citations)
  - Text and notebook edits
  - Confirmation parts
  - Completion item providers

- **vscode.proposed.remoteCodingAgents.d.ts** - Support for remote coding agents
  
- **vscode.proposed.languageModelThinkingPart.d.ts** - Language model thinking/reasoning tokens

## Development

### Build
```bash
npm install
npm run compile
```

### Package
```bash
npm run package
```

### Note on Proposed APIs

These proposed APIs are experimental and may change. They are only available in VS Code Insiders builds and require explicit enablement in `package.json` via the `enabledApiProposals` field.

