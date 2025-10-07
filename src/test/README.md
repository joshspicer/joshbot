# JoshBot Extension Tests

This directory contains the test suite for the JoshBot VS Code extension.

## Test Structure

- `runTest.ts` - Entry point for running tests. Downloads VS Code and executes the test suite.
- `suite/index.ts` - Mocha test suite configuration and test file loader.
- `suite/extension.test.ts` - Extension functionality tests.

## Running Tests

### Locally

To run the tests locally:

```bash
npm test
```

This will:
1. Compile the TypeScript code (`npm run compile`)
2. Run the linter (`npm run lint`)
3. Download a test instance of VS Code
4. Execute the test suite

### In CI

The tests are designed to run in CI environments with xvfb for headless testing:

```bash
xvfb-run -a npm test
```

## Writing New Tests

Tests use the Mocha test framework with the TDD interface. Create new test files in the `suite/` directory following the pattern `*.test.ts`.

Example:

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('My Test Suite', () => {
    test('My test case', () => {
        assert.ok(true);
    });
});
```

## Test Coverage

Current tests cover:
- Extension presence verification
- Extension activation
- Chat participant registration

## Dependencies

- `mocha` - Test framework
- `@vscode/test-electron` - VS Code extension testing utilities
- `glob` - Test file discovery
