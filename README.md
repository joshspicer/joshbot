# JoshBot

A dedicated coding assistant extension for Visual Studio Code that provides interactive chat sessions and helpful commands to enhance your development workflow.

## Overview

JoshBot is a VS Code extension that integrates with VS Code's chat functionality to provide an intelligent coding assistant experience. Built using VS Code's proposed chat APIs, JoshBot offers interactive chat sessions, custom commands, and seamless integration with your development environment.

## Features

### 🤖 Interactive Chat Sessions
- **Smart Chat Interface**: Engage with JoshBot through VS Code's native chat panel
- **Multiple Session Types**: Support for default and ongoing chat sessions
- **Dynamic Session Creation**: Create new chat sessions on-demand with custom prompts
- **Real-time Responses**: Get immediate feedback and assistance with your coding questions

### 🎯 Quick Commands
- **Hello Command** (`joshbot.hello`): Quick greeting and connection test
- **Snake Command** (`joshbot.snake`): Fun snake emoji response 🐍
- **Squirrel Command** (`joshbot.squirrel`): Playful squirrel emoji response 🐿️
- **Cloud Button** (`joshbot.cloudButton`): Create pull request content and launch chat sessions

### 🔧 Advanced Capabilities
- **URI Handling**: Custom URI scheme support for deep linking (`joshbot://`)
- **Multi-Diff Support**: View and interact with code differences directly in chat
- **Pull Request Integration**: Generate and manage pull request content
- **Remote Coding Agents**: Support for cloud-based coding assistance

### ⚙️ Customizable Configuration
- **Chat Sessions Toggle**: Enable/disable chat session contributions
- **Cloud Button Toggle**: Control visibility of cloud integration features
- **Context Menu Integration**: Access commands directly from chat interfaces

## Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "JoshBot"
4. Click Install

### Manual Installation
1. Download the `.vsix` file from the releases page
2. In VS Code, press Ctrl+Shift+P / Cmd+Shift+P
3. Type "Extensions: Install from VSIX"
4. Select the downloaded `.vsix` file

## Usage

### Starting a Chat Session
1. Open the Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Type "Chat: Open Chat" or look for the chat icon in the activity bar
3. Select "JoshBot" as your chat participant
4. Start typing your questions or requests

### Using Quick Commands
Access JoshBot commands through:
- **Command Palette**: Press Ctrl+Shift+P / Cmd+Shift+P and search for "JoshBot"
- **Chat Context Menu**: Right-click in chat sessions for quick access
- **Keyboard Shortcuts**: Use default VS Code shortcuts for registered commands

### Example Interactions
```
You: "Help me understand this JavaScript function"
JoshBot: "You said: 'Help me understand this JavaScript function'"

You: "Create a new React component"
JoshBot: "You said: 'Create a new React component'"
```

## Configuration

Configure JoshBot through VS Code settings:

### Available Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `joshbot.contributeChatSessions` | boolean | `true` | Enable chat sessions and dynamic chat participant |
| `joshbot.contributeCloudButton` | boolean | `true` | Enable cloud button for JoshBot integration |

### Accessing Settings
1. Open VS Code Settings (Ctrl+, / Cmd+,)
2. Search for "JoshBot"
3. Modify settings as needed

## Development

### Prerequisites
- Node.js (16.x or higher)
- npm or yarn
- VS Code (1.102.0 or higher)

### Setup
```bash
# Clone the repository
git clone https://github.com/joshspicer/joshbot.git
cd joshbot

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes during development
npm run watch
```

### Building
```bash
# Compile the extension
npm run compile

# Package for distribution
npm run package
```

### Running in Development
1. Open the project in VS Code
2. Press F5 to launch a new Extension Development Host window
3. Test your changes in the new window

### Proposed APIs
This extension uses several VS Code proposed APIs:
- `chatSessionsProvider`
- `chatParticipantAdditions`
- `chatParticipantPrivate`
- `remoteCodingAgents`
- `languageModelThinkingPart`

## Architecture

### Core Components
- **Extension Activation**: Initializes commands and chat providers
- **Session Manager**: Handles multiple chat sessions and their lifecycle
- **URI Handler**: Processes custom joshbot:// URIs
- **Command Registry**: Manages all available commands and their implementations
- **Chat Provider**: Integrates with VS Code's chat API for interactive sessions

### File Structure
```
├── src/
│   └── extension.ts          # Main extension logic
├── package.json              # Extension manifest and configuration
├── tsconfig.json            # TypeScript configuration
├── vscode.proposed.*.d.ts   # VS Code proposed API definitions
└── README.md                # This file
```

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork the Repository**: Create your own fork on GitHub
2. **Create a Branch**: `git checkout -b feature/your-feature-name`
3. **Make Changes**: Implement your improvements
4. **Test Thoroughly**: Ensure all functionality works as expected
5. **Submit a Pull Request**: Describe your changes clearly

### Contribution Guidelines
- Follow existing code style and conventions
- Add appropriate documentation for new features
- Test your changes in a real VS Code environment
- Keep commits focused and well-described

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: Report bugs or request features on [GitHub Issues](https://github.com/joshspicer/joshbot/issues)
- **Discussions**: Join conversations on [GitHub Discussions](https://github.com/joshspicer/joshbot/discussions)

## Changelog

### Version 1.3.0
- Enhanced chat session management
- Improved URI handling
- Added multi-diff support
- Updated VS Code API compatibility

---

**Made with ❤️ for the VS Code community**
