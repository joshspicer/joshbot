# JoshBot

A dedicated coding assistant VS Code extension great at complex tasks.

## Development

### Setup

```bash
npm install
```

### Building

```bash
npm run compile
```

### Linting

```bash
npm run lint
```

### Testing

The extension includes a test suite using Mocha and the VS Code Test framework.

**Note:** Integration tests require VS Code to be installed and will launch a test instance of VS Code. They cannot run in a headless environment.

To run tests locally:

```bash
npm test
```

The test suite includes:
- Extension activation tests
- Basic functionality verification

Tests are located in `src/test/suite/`.

