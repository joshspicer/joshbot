# Testing

This extension includes automated tests using VS Code's extension testing framework.

## Test Structure

- `src/test/runTest.ts` - Entry point for running tests
- `src/test/suite/index.ts` - Mocha test suite configuration
- `src/test/suite/extension.test.ts` - Extension activation tests

## Running Tests

To run the tests locally:

```bash
npm test
```

This will:
1. Compile the TypeScript code
2. Run the linter
3. Download VS Code (if not already cached)
4. Run the tests in a VS Code instance

## Prerequisites

- Node.js and npm installed
- On Linux systems, you may need X11 or Xvfb for headless testing
- Internet connection to download VS Code on first run

## Writing Tests

Tests are written using Mocha with the TDD interface. Place test files in `src/test/suite/` with the `.test.ts` extension.

Example test:

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('My Test Suite', () => {
  test('Sample test', () => {
    assert.strictEqual(1 + 1, 2);
  });
});
```
