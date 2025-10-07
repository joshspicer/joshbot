# JoshBot

A dedicated coding assistant great at complex tasks.

## Features

- Chat sessions for interactive conversations
- Secret management with `/set-secret` and `/secrets` commands
- Debug mode for verbose logging

## Debug Mode

JoshBot includes a debug mode that provides verbose logging for troubleshooting and development purposes.

### Enabling Debug Mode

You can enable debug mode in several ways:

1. **Via Chat Command**: Use the `/debug` command in any JoshBot chat:
   - `/debug on` - Enable debug mode
   - `/debug off` - Disable debug mode
   - `/debug` - View current debug status

2. **Via Settings**: Open VS Code settings and set `joshbot.debugMode` to `true`

When debug mode is enabled, detailed logs will be output to the console, including:
- Extension activation details
- Request processing information
- Session management operations
- Command execution traces
- Confirmation handling

### Available Commands

- `/set-secret <key> <value>` - Store a secret securely
- `/secrets` - List all stored secret keys
- `/debug [on|off]` - Toggle or view debug mode status

