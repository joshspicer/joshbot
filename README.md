# JoshBot - VS Code Chat Extension

A sophisticated VS Code extension demonstrating advanced chat session management using cutting-edge proposed APIs.

## Quick Start

1. **Requirements**: VS Code 1.102.0 or higher
2. **Install**: Clone repository and run `npm install`
3. **Development**: Run `npm run watch` then press F5 to launch
4. **Usage**: Open VS Code chat panel and interact with Josh Bot

## Features

- 🤖 **Interactive Chat Participant** - Responds to user prompts with confirmations
- 📝 **Session Management** - Persistent chat sessions with different states  
- 🔄 **Dynamic Content** - In-progress responses and real-time updates
- ⚙️ **Advanced APIs** - Uses 5 proposed VS Code APIs
- 🎯 **Context Menus** - Custom commands in chat interfaces

## Architecture

- **Dual Provider Pattern**: Single class implements both session listing and content provision
- **Event-Driven**: Uses VS Code's event system for session lifecycle management  
- **State Management**: Centralized session storage with O(1) lookups
- **Confirmation System**: Interactive yes/no dialogs with step processing

## 📖 Complete Documentation

For comprehensive documentation covering architecture, APIs, development guide, troubleshooting, and more, see:

**[DOCUMENTATION.md](./DOCUMENTATION.md)**

This detailed guide covers:
- Complete architecture analysis
- File-by-file explanations  
- Proposed APIs deep dive
- Development and debugging guide
- User instructions and troubleshooting
- API reference and examples

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript  
npm run compile

# Watch mode for development
npm run watch

# Launch extension (F5 or Run Extension config)
```

## Repository Structure

```
joshbot/
├── src/extension.ts              # Main implementation
├── package.json                  # Extension manifest  
├── tsconfig.json                # TypeScript config
├── vscode.proposed.*.d.ts       # Proposed API definitions
├── DOCUMENTATION.md             # Comprehensive documentation
└── README.md                    # This file
```

## License

MIT License - see LICENSE file for details.
