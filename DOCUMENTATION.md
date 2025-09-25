# JoshBot VS Code Extension - Comprehensive Documentation

## Table of Contents
1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [File Structure](#file-structure)
4. [Configuration Files](#configuration-files)
   - 4.1 [package.json - Extension Manifest](#packagejson---extension-manifest)
   - 4.2 [tsconfig.json - TypeScript Configuration](#tsconfigjson---typescript-configuration)
   - 4.3 [VS Code Configuration](#vs-code-configuration)
5. [Proposed APIs](#proposed-apis)
6. [Extension Implementation](#extension-implementation)
   - 6.1 [Core Architecture](#core-architecture)
   - 6.2 [Chat Participant](#chat-participant)
   - 6.3 [Session Management](#session-management)
   - 6.4 [Confirmation Handling](#confirmation-handling)
7. [Development Guide](#development-guide)
8. [User Guide](#user-guide)
9. [Troubleshooting](#troubleshooting)
10. [API Reference](#api-reference)

---

## Introduction

JoshBot is a sophisticated VS Code extension that demonstrates advanced chat session management capabilities using VS Code's cutting-edge proposed APIs. This extension showcases how to create interactive chat experiences with persistent session management, user confirmations, and dynamic content generation.

**Key Features:**
- Interactive chat participant with confirmation dialogs
- Persistent chat session management
- Multiple session states (completed, in-progress, untitled)
- Dynamic session creation and state transitions
- Integration with VS Code's chat UI system
- Custom menu contributions and commands

---

## Architecture Overview

The extension employs a **dual provider pattern** where a single class implements both `ChatSessionItemProvider` and `ChatSessionContentProvider` interfaces. This design enables:

- **Cohesive Session Management**: Unified handling of session metadata and content
- **Efficient State Sharing**: Shared state between session listing and content provision
- **Event Coordination**: Synchronized events for session lifecycle management

```
┌─────────────────────────────────────────┐
│            VS Code Chat UI              │
├─────────────────────────────────────────┤
│        Chat Participant Handler         │
├─────────────────────────────────────────┤
│         Session Providers              │
│  ┌───────────────┬──────────────────┐   │
│  │ Item Provider │ Content Provider │   │
│  └───────────────┴──────────────────┘   │
├─────────────────────────────────────────┤
│          Global State Management        │
│     (_sessionItems, _chatSessions)      │
└─────────────────────────────────────────┘
```

---

## File Structure

```
joshbot/
├── src/
│   └── extension.ts              # Main extension implementation
├── .vscode/
│   ├── launch.json              # Debug configuration
│   └── tasks.json               # Build tasks
├── package.json                 # Extension manifest
├── tsconfig.json               # TypeScript configuration  
├── vscode.proposed.*.d.ts      # Proposed API definitions
├── README.md                   # Basic project information
└── DOCUMENTATION.md            # This comprehensive guide
```

---

## Configuration Files

### package.json - Extension Manifest

The manifest file defines the extension's identity, capabilities, and VS Code integration points.

#### Extension Metadata
```json
{
  "name": "joshbot",
  "displayName": "Josh Bot",
  "description": "A dedicated coding assistant great at complex tasks",
  "version": "1.3.0",
  "publisher": "spcr-test",
  "license": "MIT"
}
```

**Naming Strategy Analysis:**
- **Internal Name**: `joshbot` (lowercase, kebab-case) - used for npm packages, file references
- **Display Name**: `Josh Bot` (human-readable) - appears in extension marketplace
- **Version**: `1.3.0` follows semantic versioning (major.minor.patch)

#### Engine Requirements
```json
{
  "engines": {
    "vscode": "^1.102.0"
  }
}
```

**Critical Requirements:**
- Requires VS Code version 1.102.0 or higher
- This is a bleeding-edge requirement that ensures proposed API availability
- Users on older VS Code versions cannot install this extension

#### Proposed APIs
```json
{
  "enabledApiProposals": [
    "chatSessionsProvider@2",
    "chatParticipantAdditions", 
    "chatParticipantPrivate",
    "remoteCodingAgents",
    "languageModelThinkingPart"
  ]
}
```

**API Analysis:**
- **`chatSessionsProvider@2`**: Version 2 of session provider API (breaking changes from v1)
- **`chatParticipantAdditions`**: Extended chat participant capabilities
- **`chatParticipantPrivate`**: Private/internal chat participant APIs
- **`remoteCodingAgents`**: Support for remote coding assistance
- **`languageModelThinkingPart`**: AI reasoning display capabilities

⚠️ **Risk Assessment**: Proposed APIs are experimental and subject to change without notice.

#### Activation Events
```json
{
  "activationEvents": [
    "onChatSession:josh-bot",
    "*"
  ]
}
```

**Activation Strategy:**
- **Specific Trigger**: `onChatSession:josh-bot` - activates when JoshBot chat session is accessed
- **Universal Trigger**: `"*"` - activates immediately on VS Code startup
- **Performance Impact**: Universal activation means the extension loads on startup
- **Memory Usage**: Always-active extensions consume memory continuously

#### Contribution Points

**Remote Coding Agents:**
```json
{
  "remoteCodingAgents": [{
    "id": "josh-bot",
    "name": "Josh Bot", 
    "displayName": "Josh Bot",
    "command": "joshbot.cloudButton",
    "when": "config.joshbot.contributeCloudButton"
  }]
}
```

**Chat Sessions:**
```json
{
  "chatSessions": [{
    "type": "josh-bot",
    "name": "joshbot",
    "displayName": "Josh Bot",
    "description": "A dedicated coding assistant great at complex tasks",
    "when": "config.joshbot.contributeChatSessions"
  }]
}
```

**Context Menus:**
```json
{
  "menus": {
    "chat/multiDiff/context": [
      {
        "command": "joshbot.squirrel",
        "when": "chatSessionType == josh-bot"
      },
      {
        "command": "joshbot.snake", 
        "when": "chatSessionType == josh-bot"
      }
    ]
  }
}
```

### tsconfig.json - TypeScript Configuration

#### JSX Configuration
```json
{
  "jsx": "react",
  "jsxFactory": "vscpp",
  "jsxFragmentFactory": "vscppf"
}
```

**JSX Integration:**
- Uses React-compatible JSX transformation
- Custom factories (`vscpp`, `vscppf`) likely integrate with VS Code's rendering system
- Suggests the extension may render custom UI components

#### Compilation Targets
```json
{
  "target": "es2020",
  "module": "commonjs",
  "strict": true
}
```

**ES2020 Features Available:**
- Optional chaining (`?.`)
- Nullish coalescing (`??`)
- BigInt support
- Promise.allSettled()
- Dynamic imports

**Module System**: CommonJS required for VS Code extension host compatibility

### VS Code Configuration

#### Debug Configuration (launch.json)
```json
{
  "name": "Run Extension",
  "type": "extensionHost",
  "request": "launch",
  "args": ["--extensionDevelopmentPath=${workspaceFolder}"],
  "preLaunchTask": "npm: watch"
}
```

#### Build Tasks (tasks.json)
```json
{
  "type": "npm",
  "script": "watch",
  "group": {"kind": "build", "isDefault": true},
  "isBackground": true
}
```

---

## Proposed APIs

The extension leverages five cutting-edge proposed APIs:

### 1. Chat Sessions Provider v2
Manages chat session lifecycle, metadata, and content provision.

**Key Interfaces:**
- `ChatSessionItemProvider`: Lists available sessions
- `ChatSessionContentProvider`: Provides session conversation history
- `ChatSessionItem`: Session metadata structure

### 2. Chat Participant Additions
Extends basic chat participant functionality with:
- Enhanced response types (confirmations, warnings, progress)
- Custom response parts
- Advanced user interaction patterns

### 3. Chat Participant Private
Provides access to internal VS Code chat APIs:
- Extended request handling
- Private chat context information
- Advanced session management

### 4. Remote Coding Agents
Enables integration with remote AI coding assistance:
- Cloud-based AI interactions
- Remote execution capabilities
- Distributed coding workflows

### 5. Language Model Thinking Part
Displays AI reasoning processes:
- Thought process visualization
- Step-by-step reasoning
- Transparent AI decision making

---

## Extension Implementation

### Core Architecture

#### Module Structure
```typescript
import * as vscode from 'vscode';

const CHAT_SESSION_TYPE = 'josh-bot';

// Global State
const _sessionItems: vscode.ChatSessionItem[] = [];
const _chatSessions: Map<string, vscode.ChatSession> = new Map();
let onDidCommitChatSessionItemEmitter: vscode.EventEmitter<...>;
```

**State Management Strategy:**
- **Array for Ordered Lists**: `_sessionItems` maintains session display order
- **Map for Fast Lookup**: `_chatSessions` provides O(1) session content retrieval
- **Event-Driven Architecture**: EventEmitter follows VS Code patterns
- **Memory Considerations**: No cleanup mechanism - potential memory leak with heavy usage

#### Extension Activation
```typescript
export function activate(context: vscode.ExtensionContext) {
  console.log('JoshBot extension is now active!');
  
  // Initialize event system
  onDidCommitChatSessionItemEmitter = new vscode.EventEmitter<...>();
  
  // Create chat participant
  const chatParticipant = vscode.chat.createChatParticipant(CHAT_SESSION_TYPE, handler);
  
  // Create and register providers
  const sessionProvider = new class implements 
    vscode.ChatSessionItemProvider, 
    vscode.ChatSessionContentProvider { /* ... */ };
  
  // Register with VS Code
  context.subscriptions.push(
    chatParticipant,
    vscode.chat.registerChatSessionItemProvider(CHAT_SESSION_TYPE, sessionProvider),
    vscode.chat.registerChatSessionContentProvider(CHAT_SESSION_TYPE, sessionProvider, chatParticipant)
  );
}
```

### Chat Participant

#### Request Handler Architecture
```typescript
const chatParticipant = vscode.chat.createChatParticipant(CHAT_SESSION_TYPE, async (request, context, stream, token) => {
  // Priority 1: Handle confirmations
  if (request.acceptedConfirmationData || request.rejectedConfirmationData) {
    return handleConfirmationData(request, context, stream, token);
  }
  
  // Priority 2: Handle session context
  if (context.chatSessionContext) {
    const { isUntitled, chatSessionItem: original } = context.chatSessionContext;
    if (isUntitled) {
      stream.confirmation('New Chat Session', 'Would you like to begin?\n\n', { step: 'create' }, ['yes', 'no']);
      return;
    } else {
      stream.markdown('Welcome back!');
    }
  } else {
    // Priority 3: General interaction
    stream.markdown('Howdy! I am joshbot, your friendly chat companion.');
    stream.confirmation('Ping', 'Would you like to ping me?', { step: 'ping' }, ['yes', 'no']);
  }
});
```

**Handler Parameters:**
- **request**: User input and metadata
- **context**: Session and environment context
- **stream**: Response output mechanism
- **token**: Cancellation support

**Response Logic Flow:**
1. **Confirmation Processing**: Handles user yes/no responses first
2. **Context-Sensitive Responses**: Different behavior based on session state
3. **Fallback Interaction**: Default behavior for new interactions

#### Stream API Usage
```typescript
// Text responses
stream.markdown('Hello world');

// Interactive prompts
stream.confirmation('Title', 'Message', { step: 'actionId' }, ['yes', 'no']);

// Status updates
stream.progress('Working...');
stream.warning('Something went wrong');
```

### Session Management

#### Session Provider Implementation
```typescript
const sessionProvider = new class implements vscode.ChatSessionItemProvider, vscode.ChatSessionContentProvider {
  // Event handling
  onDidChangeChatSessionItems = new vscode.EventEmitter<void>().event;
  onDidCommitChatSessionItem = onDidCommitChatSessionItemEmitter.event;
  
  // Session listing
  async provideChatSessionItems(token: vscode.CancellationToken): Promise<vscode.ChatSessionItem[]> {
    return [
      { id: 'demo-session-01', label: 'JoshBot Demo Session 01', status: vscode.ChatSessionStatus.Completed },
      { id: 'demo-session-02', label: 'JoshBot Demo Session 02', status: vscode.ChatSessionStatus.Completed },
      { id: 'demo-session-03', label: 'JoshBot Demo Session 03', status: vscode.ChatSessionStatus.InProgress },
      ..._sessionItems, // Dynamic sessions
    ];
  }
  
  // Session content provision
  async provideChatSessionContent(sessionId: string, token: vscode.CancellationToken): Promise<vscode.ChatSession> {
    switch (sessionId) {
      case 'demo-session-01':
      case 'demo-session-02':
        return completedChatSessionContent(sessionId);
      case 'demo-session-03':
        return inProgressChatSessionContent(sessionId);
      default:
        const existing = _chatSessions.get(sessionId);
        if (existing) return existing;
        return untitledChatSessionContent(sessionId);
    }
  }
};
```

#### Session Content Factory Functions

**Completed Session:**
```typescript
function completedChatSessionContent(sessionId: string): vscode.ChatSession {
  return {
    history: [
      new vscode.ChatRequestTurn2('hello', undefined, [], CHAT_SESSION_TYPE, [], []),
      new vscode.ChatResponseTurn2([
        new vscode.ChatResponseMarkdownPart(`Session: ${sessionId}\n`)
      ], {}, CHAT_SESSION_TYPE) as vscode.ChatResponseTurn
    ],
    requestHandler: undefined, // Read-only session
  };
}
```

**In-Progress Session:**
```typescript
function inProgressChatSessionContent(sessionId: string): vscode.ChatSession {
  return {
    history: [/* previous conversation */],
    activeResponseCallback: async (stream, token) => {
      stream.progress('\n\Still working\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
      stream.markdown('2+2=...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
      stream.markdown('4!\n');
    },
    requestHandler: undefined,
  };
}
```

**Untitled Session:**
```typescript
function untitledChatSessionContent(sessionId: string): vscode.ChatSession {
  return {
    history: [
      new vscode.ChatRequestTurn2('Howdy', undefined, [], CHAT_SESSION_TYPE, [], []),
      new vscode.ChatResponseTurn2([
        new vscode.ChatResponseMarkdownPart(`Session: ${sessionId}\n\n`),
        new vscode.ChatResponseMarkdownPart('This is an untitled session. Send a message to begin our session.\n'),
        new vscode.ChatResponseConfirmationPart('Ping?', 'Would you like to begin?\n\n', { step: 'ping' }, ['yes', 'no'])
      ], {}, CHAT_SESSION_TYPE) as vscode.ChatResponseTurn
    ],
    requestHandler: undefined,
  };
}
```

### Confirmation Handling

#### Data Processing Pipeline
```typescript
async function handleConfirmationData(request, context, stream, token) {
  // 1. Normalize confirmation data
  const results: Array<{ step: string; accepted: boolean }> = [];
  results.push(...(request.acceptedConfirmationData?.map(data => ({ step: data.step, accepted: true })) ?? []));
  results.push(...((request.rejectedConfirmationData ?? [])
    .filter(data => !results.some(r => r.step === data.step))
    .map(data => ({ step: data.step, accepted: false }))));
  
  // 2. Process each confirmation step
  for (const data of results) {
    switch (data.step) {
      case 'create':
        await handleCreation(data.accepted, request, context, stream);
        break;
      case 'ping':
        if (data.accepted) {
          stream.markdown('pong!\n\n');
        }
        break;
      default:
        stream.markdown(`Unknown confirmation step: ${data.step}\n\n`);
        break;
    }
  }
}
```

#### Session Creation Process
```typescript
async function handleCreation(accepted: boolean, request, context, stream) {
  // Validation
  if (!accepted) {
    stream.warning('New session was not created.\n\n');
    return;
  }
  
  const original = context.chatSessionContext?.chatSessionItem;
  if (!original || !context.chatSessionContext?.isUntitled) {
    stream.warning('Cannot create new session - this is not an untitled session!.\n\n');
    return;
  }
  
  // Creation process
  stream.progress('Creating new session...\n\n');
  await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate work
  
  // Generate new session
  const count = _sessionItems.length + 1;
  const newSessionId = `session-${count}`;
  const newSessionItem: vscode.ChatSessionItem = {
    id: newSessionId,
    label: `JoshBot Session ${count}`,
    status: vscode.ChatSessionStatus.Completed
  };
  
  // Update state
  _sessionItems.push(newSessionItem);
  _chatSessions.set(newSessionId, {
    requestHandler: undefined,
    history: [/* initial conversation */]
  });
  
  // Notify VS Code
  onDidCommitChatSessionItemEmitter.fire({ original, modified: newSessionItem });
}
```

---

## Development Guide

### Prerequisites
- VS Code version 1.102.0 or higher
- Node.js (version specified in package.json engines)
- npm or yarn package manager

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/joshspicer/joshbot.git
   cd joshbot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Compile TypeScript:**
   ```bash
   npm run compile
   # or for watch mode:
   npm run watch
   ```

### Development Workflow

1. **Start development mode:**
   ```bash
   npm run watch
   ```

2. **Launch extension in VS Code:**
   - Press `F5` or use "Run Extension" launch configuration
   - A new Extension Development Host window opens
   - The extension is automatically loaded

3. **Test the extension:**
   - Open VS Code chat panel
   - Look for "Josh Bot" in the chat sessions list
   - Interact with the bot to test functionality

### Debugging

#### Debug Configuration
The extension includes a pre-configured debug setup:
- **Pre-launch task**: Automatically compiles TypeScript
- **Extension host**: Runs extension in isolated environment
- **Source maps**: Enables TypeScript debugging

#### Common Debug Scenarios
- **Breakpoints**: Set breakpoints in TypeScript source files
- **Console output**: Use `console.log()` for runtime debugging
- **VS Code Developer Tools**: Access via Help → Toggle Developer Tools

### Code Organization Best Practices

#### State Management
```typescript
// Good: Centralized state
const globalState = {
  sessions: new Map(),
  items: [],
  emitters: {}
};

// Avoid: Scattered global variables
let sessions, items, emitter1, emitter2;
```

#### Error Handling
```typescript
// Good: Comprehensive error handling
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  stream.warning(`Operation failed: ${error.message}`);
  return fallbackResult;
}
```

#### Event Management
```typescript
// Good: Proper cleanup
export function activate(context: vscode.ExtensionContext) {
  const emitter = new vscode.EventEmitter();
  context.subscriptions.push(emitter); // Auto-cleanup
  return emitter;
}
```

---

## User Guide

### Installation

#### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions view (`Ctrl+Shift+X`)
3. Search for "Josh Bot"
4. Click "Install"

#### From VSIX Package
1. Download the `.vsix` file
2. Open VS Code
3. Run command: "Extensions: Install from VSIX..."
4. Select the downloaded file

### Basic Usage

#### Starting a Chat Session
1. Open the Chat panel (`Ctrl+Alt+I`)
2. Click "New Chat" or look for existing JoshBot sessions
3. Select "Josh Bot" as your chat participant
4. Start typing to interact

#### Session Types
- **New Sessions**: Create fresh conversations
- **Untitled Sessions**: Temporary sessions that can be converted
- **Completed Sessions**: Read-only historical conversations
- **In-Progress Sessions**: Active sessions with ongoing responses

#### Interactive Features
- **Confirmations**: Respond to yes/no prompts
- **Progress Updates**: See real-time status during operations
- **Session Creation**: Convert untitled sessions to permanent ones

### Configuration Options

#### Extension Settings
Access via File → Preferences → Settings → Extensions → JoshBot

- **Contribute Chat Sessions**: Enable/disable chat session provider
- **Contribute Cloud Button**: Enable/disable remote coding agent button

#### Context Menu Commands
Available in chat multi-diff context:
- **Squirrel Command**: Custom action when in JoshBot sessions
- **Snake Command**: Another custom action for JoshBot sessions

---

## Troubleshooting

### Common Issues

#### Extension Not Loading
**Symptoms:** Extension doesn't appear in VS Code
**Solutions:**
1. Check VS Code version (must be 1.102.0+)
2. Verify extension is installed and enabled
3. Restart VS Code
4. Check Developer Console for errors

#### Chat Sessions Not Appearing
**Symptoms:** JoshBot sessions don't show in chat panel
**Solutions:**
1. Enable "Contribute Chat Sessions" in settings
2. Check if `chatSessionsProvider@2` API is available
3. Verify extension activation (check console logs)

#### Confirmations Not Working
**Symptoms:** Yes/No buttons don't respond
**Solutions:**
1. Check if `chatParticipantAdditions` API is loaded
2. Verify confirmation data handling in logs
3. Ensure proper session context

#### Memory Issues
**Symptoms:** VS Code becomes slow with many sessions
**Solutions:**
1. Restart VS Code periodically
2. Limit number of active sessions
3. Clear session history if possible

### Debug Information

#### Enable Developer Console
1. Help → Toggle Developer Tools
2. Check Console tab for errors
3. Look for JoshBot-related messages

#### Extension Logs
```typescript
// Add debugging to extension code
console.log('JoshBot: Session created', sessionId);
console.error('JoshBot: Error occurred', error);
```

#### API Availability Check
```typescript
// Check if proposed APIs are loaded
if (vscode.chat.registerChatSessionItemProvider) {
  console.log('Chat sessions API available');
} else {
  console.error('Chat sessions API not available');
}
```

### Performance Optimization

#### Memory Management
- Monitor session count in `_sessionItems` and `_chatSessions`
- Implement session cleanup for old/unused sessions
- Use weak references where possible

#### Event Handling
- Unsubscribe from unused events
- Batch event emissions to reduce frequency
- Use debouncing for high-frequency events

---

## API Reference

### Core Types

#### ChatSessionItem
```typescript
interface ChatSessionItem {
  id: string;                    // Unique identifier
  label: string;                // Display name
  status?: ChatSessionStatus;    // Current state
  description?: string;          // Additional context
  tooltip?: string;              // Hover text
  timing?: {                     // Session timestamps
    startTime: number;
    endTime?: number;
  };
  statistics?: {                 // Usage metrics
    insertions: number;
    deletions: number;
  };
}
```

#### ChatSession
```typescript
interface ChatSession {
  history: Array<ChatRequestTurn | ChatResponseTurn>;  // Conversation history
  requestHandler?: ChatRequestHandler;                  // Active request handler
  activeResponseCallback?: (stream, token) => Promise<void>; // In-progress response
}
```

#### ChatRequest
```typescript
interface ChatRequest {
  id: string;                           // Request identifier
  prompt: string;                       // User input
  attempt: number;                      // Retry attempt number
  acceptedConfirmationData?: any[];     // Accepted confirmations
  rejectedConfirmationData?: any[];     // Rejected confirmations
  enableCommandDetection: boolean;      // Command detection enabled
  isParticipantDetected: boolean;       // Auto-assigned participant
}
```

### Provider Interfaces

#### ChatSessionItemProvider
```typescript
interface ChatSessionItemProvider {
  onDidChangeChatSessionItems: Event<void>;
  onDidCommitChatSessionItem: Event<{original: ChatSessionItem; modified: ChatSessionItem}>;
  provideChatSessionItems(token: CancellationToken): ProviderResult<ChatSessionItem[]>;
  provideNewChatSessionItem?(options: {request: ChatRequest; metadata?: any}, token: CancellationToken): ProviderResult<ChatSessionItem>;
}
```

#### ChatSessionContentProvider
```typescript
interface ChatSessionContentProvider {
  provideChatSessionContent(sessionId: string, token: CancellationToken): ProviderResult<ChatSession>;
}
```

### Response Stream Methods

```typescript
interface ChatResponseStream {
  // Basic content
  markdown(value: string): void;
  
  // Interactive elements
  confirmation(title: string, message: string, data: any, buttons?: string[]): void;
  
  // Status updates
  progress(value: string): void;
  warning(message: string): void;
  
  // Advanced content
  reference(value: Uri | Location, iconPath?: Uri | ThemeIcon): void;
  codeCitation(value: Uri, license: string, snippet: string): void;
}
```

### Utility Functions

#### Session Creation
```typescript
function createSession(id: string, label: string, status: ChatSessionStatus): ChatSessionItem {
  return { id, label, status };
}
```

#### Response Part Construction
```typescript
function createMarkdownResponse(content: string): ChatResponseTurn2 {
  return new vscode.ChatResponseTurn2([
    new vscode.ChatResponseMarkdownPart(content)
  ], {}, CHAT_SESSION_TYPE);
}
```

---

## Security Considerations

### Data Handling
- **User Input**: All user prompts are processed locally
- **Session Data**: Stored in memory only (not persisted)
- **API Calls**: No external network requests in current implementation

### Proposed API Risks
- **API Changes**: Proposed APIs may change without notice
- **Breaking Changes**: Updates may break existing functionality
- **Experimental Features**: Some features may be unstable

### Best Practices
- **Input Validation**: Validate all user inputs
- **Error Handling**: Gracefully handle API failures
- **Resource Management**: Monitor memory usage and cleanup resources

---

## Contributing

### Code Style
- Follow TypeScript best practices
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Maintain consistent indentation and formatting

### Pull Request Process
1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Update documentation
5. Submit pull request with detailed description

### Testing
- Test all new features thoroughly
- Verify backward compatibility
- Check performance impact
- Test with different VS Code versions

---

## License

This extension is licensed under the MIT License. See the LICENSE file for full terms.

---

## Support

### Getting Help
- Check this documentation first
- Review troubleshooting section
- Search existing GitHub issues
- Create new issue with reproduction steps

### Reporting Issues
Include the following information:
- VS Code version
- Extension version
- Steps to reproduce
- Expected vs actual behavior
- Error messages or console logs

---

*This documentation covers version 1.3.0 of the JoshBot extension. For the latest updates, check the GitHub repository.*