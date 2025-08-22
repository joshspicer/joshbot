# JoshBot 

A VS Code extension that provides an AI-powered chat assistant with German translation capabilities and enhanced pull request management.

## Features

- **Chat Sessions**: Interactive chat sessions with JoshBot
- **German Translation**: Translate text to German using the chat interface or command palette
- **Pull Request Management**: Browse, search, and manage pull requests directly in chat
- **Commands**: Various utility commands including Snake, Squirrel, and Hello

## Usage

### Pull Request Management

JoshBot now includes comprehensive pull request management capabilities:

**Chat Commands:**
- **"show pull requests"** - List all pull requests with rich formatting
- **"show open pull requests"** - Filter pull requests by status (open, merged, closed)
- **"search pr translation"** - Search pull requests by keywords
- **"pr status"** - Get a summary of pull request statistics

**Command Palette:**
- **"JoshBot: Show Pull Requests"** - Interactive UI with filtering options

**Features:**
- Rich pull request display using VS Code's native ChatResponsePullRequestPart
- Clickable links and structured information for each PR
- Status filtering and keyword search capabilities
- Real-time pull request statistics and summaries

### German Translation

You can translate text to German in two ways:

1. **Chat Interface**: Type translation requests in the chat, such as:
   - "translate hello to german"
   - "translate thank you"
   - "please translate good morning to german"

2. **Command Palette**: Use the "JoshBot: Translate to German" command from the command palette (Ctrl+Shift+P)

### Supported Translations

JoshBot includes translations for common words and phrases:
- Greetings: hello → hallo, good morning → guten morgen
- Basic phrases: thank you → danke, please → bitte
- Common words: water → wasser, dog → hund, cat → katze
- And many more!
