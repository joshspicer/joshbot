# JoshBot

A VS Code extension that provides a dedicated coding assistant great at complex tasks.

## Overview

JoshBot is a VS Code extension that demonstrates the use of VS Code's chat participant APIs, including proposed APIs for advanced chat features. The extension creates a chat participant that can handle chat sessions, slash commands, and confirmations.

## TypeScript Definition Files

This project includes several TypeScript definition files (`.d.ts`) that provide type definitions for proposed VS Code APIs:

### vscode.proposed.chatParticipantPrivate.d.ts

This file provides **private/internal additions** to VS Code's chat participant API. It extends the public chat APIs with additional capabilities that are not yet part of the stable API.

**Key features defined in this file:**

1. **ChatLocation enum** - Defines where chat interactions can occur:
   - Panel (chat panel)
   - Terminal (terminal inline chat)
   - Notebook (notebook inline chat)
   - Editor (code editor inline chat)

2. **Extended ChatRequest interface** - Adds private properties to chat requests:
   - `id`: Unique identifier for the chat request
   - `attempt`: The attempt number of the request
   - `sessionId`: Session identifier
   - `enableCommandDetection`: Whether automatic command detection is enabled
   - `isParticipantDetected`: Whether the participant was auto-assigned
   - `location2`: Location-specific data (editor or notebook context)
   - `editedFileEvents`: Events for files edited during the session

3. **ChatRequestTurn2 & ChatResponseTurn2 classes** - Enhanced versions of the standard turn classes with additional metadata:
   - `ChatRequestTurn2`: Includes prompt, participant, command, references, tool references, and edited file events
   - `ChatResponseTurn2`: Contains response content, result, participant, and command information

4. **ChatErrorDetails interface** - Extended error handling:
   - `responseIsRedacted`: Flag to completely hide message content
   - `isQuotaExceeded`: Quota status indicator
   - `isRateLimited`: Rate limiting indicator
   - `level`: Error severity level (Info, Warning, Error)
   - `confirmationButtons`: Optional confirmation buttons for error recovery

5. **Dynamic Chat Participant Creation** - `createDynamicChatParticipant()`:
   - Allows creating chat participants programmatically
   - Accepts dynamic properties (name, publisher, description, etc.)

6. **Language Model Extensions**:
   - `LanguageModelIgnoredFileProvider`: Provider for marking files to be ignored by language models
   - `LanguageModelToolInvocationOptions`: Options for tool invocations including chat context
   - `ExtendedLanguageModelToolResult`: Enhanced tool results with additional metadata

7. **Chat Participant Detection**:
   - `ChatParticipantDetectionProvider`: Interface for automatic participant detection
   - `ChatParticipantMetadata`: Metadata for disambiguation between participants

**Purpose**: This file enables the JoshBot extension to use advanced chat features that are still in the proposal stage. These APIs may change before becoming stable, hence the "proposed" designation.

**Note**: This file is automatically downloaded via the `@vscode/dts` package during `npm install` (see `postinstall` script in package.json). It corresponds to the `chatParticipantPrivate` API proposal enabled in the `enabledApiProposals` field of package.json.

### Other Definition Files

- **vscode.proposed.chatParticipantAdditions.d.ts** - Additional public chat participant features
- **vscode.proposed.chatSessionsProvider.d.ts** - Chat session provider APIs
- **vscode.proposed.languageModelThinkingPart.d.ts** - Language model thinking part APIs
- **vscode.proposed.remoteCodingAgents.d.ts** - Remote coding agent APIs

## Development

```bash
# Install dependencies
npm install

# Compile
npm run compile

# Watch mode
npm run watch

# Lint
npm run lint

# Package extension
npm run package
```

## Enabled API Proposals

This extension uses the following proposed VS Code APIs (see `enabledApiProposals` in package.json):
- `chatSessionsProvider`
- `chatParticipantAdditions`
- `chatParticipantPrivate`
- `remoteCodingAgents`
- `languageModelThinkingPart`
