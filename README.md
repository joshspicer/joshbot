# JoshBot 

A dedicated coding assistant great at complex tasks. JoshBot is a VS Code extension that provides chat sessions and a dynamic chat participant.

## Features

- Chat sessions with session management
- Slash commands for secrets management (`/secrets`, `/set-secret`)
- Demo sessions to showcase functionality
- Session history and state management

## Development

### Building

```bash
npm install
npm run compile
```

### Testing

```bash
npm test
```

**Note:** Tests require a graphical environment. In CI environments, use xvfb:

```bash
xvfb-run -a npm test
```

See [src/test/README.md](src/test/README.md) for more details.

### Packaging

```bash
npm run package
```

## License

MIT
