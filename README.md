# JoshBot 

A dedicated coding assistant VS Code extension that provides a custom chat participant with advanced session management capabilities.

## Features

- **Custom Chat Participant**: Implements a chat participant called "Josh Bot" that responds to user queries
- **Session Management**: Provides chat session functionality with the ability to create, manage, and persist conversation sessions
- **Interactive Confirmations**: Supports confirmation dialogs for user interactions
- **Dynamic Session Creation**: Creates new sessions dynamically based on user interactions

## Building the Extension

### Prerequisites

- Node.js (16.x or later)
- npm

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

- **Compile**: `npm run compile`
- **Watch**: `npm run watch` (for development with automatic recompilation)
- **Lint**: `npm run lint`
- **Package**: `npm run package`

### Build Process

The build process includes:

1. TypeScript compilation to JavaScript (`tsc -p ./`)
2. ESLint code quality checks
3. VSIX package creation for distribution

### Testing

Currently, the extension doesn't have test infrastructure set up. The build process validates:
- TypeScript compilation
- Code linting
- Package creation

### VS Code Extension Development

To test the extension during development:

1. Open the project in VS Code
2. Press F5 to launch a new Extension Development Host window
3. The JoshBot extension will be loaded and ready for testing

## Architecture

The extension uses VS Code's proposed APIs for:
- Chat participants (`chatParticipantAdditions`)
- Chat sessions (`chatSessionsProvider`) 
- Experimental features (`chatParticipantPrivate`, `remoteCodingAgents`)

### Main Components

- **Chat Participant**: Handles user interactions and responses
- **Session Provider**: Manages session items and content
- **Session Management**: Creates and maintains conversation history