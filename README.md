# JoshBot 

A VS Code extension that provides a dedicated coding assistant great at complex tasks.

## Features

- Chat session management with multiple session support
- Command handlers for various bot interactions:
  - `joshbot.hello` - Simple greeting
  - `joshbot.snake` - Snake emoji response 🐍
  - `joshbot.squirrel` - Squirrel emoji response 🐿️
  - `joshbot.cloudButton` - Creates pull request content and opens chat session
- URI handling for external integrations
- Multi-diff display capabilities

## Development

### Building
```bash
npm run compile
```

### Testing
The project includes comprehensive unit tests:

```bash
# Run unit tests
npm test

# Run integration tests (requires VS Code)
npm run test:integration
```

### Linting
```bash
npm run lint
```

### Packaging
```bash
npm run package
```

## Configuration

The extension can be configured via VS Code settings:
- `joshbot.contributeChatSessions` - Enable chat sessions (default: true)
- `joshbot.contributeCloudButton` - Enable cloud button (default: true)
