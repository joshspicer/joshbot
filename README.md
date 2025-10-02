# JoshBot

A VSCode extension that provides a dedicated coding assistant with chat session management.

## Features

- Chat participant with session management
- Slash commands for managing secrets
- Dynamic session creation and management
- Support for completed and in-progress sessions

## Development

### Building

```bash
npm install
npm run compile
```

### Testing

The extension includes comprehensive test infrastructure using Mocha and VSCode's test runner.

#### Unit Tests

Run standalone unit tests that don't require VSCode:

```bash
npm run test:unit
```

#### Integration Tests

Run full integration tests with VSCode (requires X11 or a headless environment):

```bash
npm test
```

To run tests in watch mode during development:

```bash
npm run watch
```

### Test Structure

- `src/test/runTest.ts` - Main test runner that launches VSCode for integration tests
- `src/test/suite/index.ts` - Test suite configuration for integration tests
- `src/test/suite/extension.test.ts` - Extension activation and functionality tests (requires VSCode)
- `src/test/unit/utils.test.ts` - Standalone unit tests for utility functions

## License

MIT
