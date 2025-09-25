# JoshBot - Quick Reference

## Architecture Overview

```
VS Code Chat UI
       ↓
Chat Participant Handler (josh-bot)
       ↓
Session Providers (dual implementation)
├── ChatSessionItemProvider (lists sessions)
└── ChatSessionContentProvider (provides content)
       ↓
Global State Management
├── _sessionItems[] (ordered list)
├── _chatSessions Map (fast lookup)
└── Event Emitters (lifecycle events)
```

## Key Files

| File | Purpose |
|------|---------|
| `src/extension.ts` | Main implementation |
| `package.json` | Extension manifest & configuration |
| `tsconfig.json` | TypeScript compilation settings |
| `DOCUMENTATION.md` | Comprehensive documentation |
| `.vscode/launch.json` | Debug configuration |

## API Quick Reference

### Chat Participant Handler
```typescript
vscode.chat.createChatParticipant(type, async (request, context, stream, token) => {
  // Handle confirmations first
  if (request.acceptedConfirmationData || request.rejectedConfirmationData) {
    return handleConfirmationData(request, context, stream, token);
  }
  
  // Context-sensitive responses
  if (context.chatSessionContext) {
    // Handle session-specific logic
  } else {
    // General interaction
    stream.markdown('Hello!');
    stream.confirmation('Title', 'Message', {step: 'ping'}, ['yes', 'no']);
  }
});
```

### Session Providers
```typescript
const provider = new class implements vscode.ChatSessionItemProvider, vscode.ChatSessionContentProvider {
  // List sessions
  async provideChatSessionItems(token): Promise<vscode.ChatSessionItem[]> {
    return [{
      id: 'session-1',
      label: 'My Session',
      status: vscode.ChatSessionStatus.Completed
    }];
  }
  
  // Provide session content
  async provideChatSessionContent(sessionId, token): Promise<vscode.ChatSession> {
    return {
      history: [/* conversation history */],
      requestHandler: undefined // or active handler
    };
  }
};
```

### Response Stream Methods
```typescript
// Basic responses
stream.markdown('Text response');
stream.progress('Working...');
stream.warning('Something went wrong');

// Interactive elements  
stream.confirmation('Title', 'Message', {step: 'action'}, ['yes', 'no']);

// Advanced content
stream.reference(uri, iconPath);
stream.codeCitation(uri, license, snippet);
```

## Session States

| State | Description | Handler |
|-------|-------------|---------|
| **Untitled** | Temporary session | `untitledChatSessionContent()` |
| **InProgress** | Active with ongoing responses | `inProgressChatSessionContent()` |
| **Completed** | Finished conversation | `completedChatSessionContent()` |

## Confirmation Flow

1. **Display**: `stream.confirmation(title, message, {step: 'id'}, buttons)`
2. **Process**: Check `request.acceptedConfirmationData` / `rejectedConfirmationData`
3. **Handle**: Switch on `data.step` to execute specific actions
4. **Update**: Fire events to update UI state

## Development Commands

```bash
# Setup
npm install

# Development
npm run watch    # Compile in watch mode
npm run compile  # One-time compilation
npm run lint     # Check code style

# Debug: Press F5 in VS Code
```

## Configuration

### package.json Key Sections
```json
{
  "engines": {"vscode": "^1.102.0"},
  "activationEvents": ["onChatSession:josh-bot", "*"],
  "enabledApiProposals": [
    "chatSessionsProvider@2",
    "chatParticipantAdditions", 
    "chatParticipantPrivate",
    "remoteCodingAgents",
    "languageModelThinkingPart"
  ]
}
```

### Settings
- `joshbot.contributeChatSessions`: Enable chat sessions
- `joshbot.contributeCloudButton`: Enable cloud button

## Common Patterns

### State Updates
```typescript
// Add new session
_sessionItems.push(newSession);
_chatSessions.set(sessionId, sessionContent);

// Notify VS Code
onDidCommitChatSessionItemEmitter.fire({original, modified});
```

### Error Handling
```typescript
try {
  const result = await operation();
  stream.markdown(`Success: ${result}`);
} catch (error) {
  console.error('Operation failed:', error);
  stream.warning(`Failed: ${error.message}`);
}
```

### Async Operations
```typescript
stream.progress('Starting work...');
await longRunningOperation();
stream.markdown('Work completed!');
```

## Debugging Tips

1. **Console Logs**: Check VS Code Developer Tools console
2. **Breakpoints**: Set in TypeScript source files
3. **State Inspection**: Log `_sessionItems` and `_chatSessions` 
4. **Event Tracing**: Log event emissions and handling
5. **API Availability**: Verify proposed APIs are loaded

For complete details, see [DOCUMENTATION.md](./DOCUMENTATION.md).