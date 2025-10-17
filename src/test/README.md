# JoshBot Extension Tests

This directory contains the test suite for the JoshBot VS Code extension.

## Test Structure

- `runTest.ts` - The main test runner that launches VS Code with the extension and runs the test suite
- `suite/index.ts` - The Mocha test suite configuration
- `suite/extension.test.ts` - Basic tests for the extension activation and functionality

## Running Tests

To run the tests locally:

```bash
npm test
```

**Note:** VS Code extension tests require a graphical environment. If running in a headless CI environment, you'll need to use xvfb or similar:

```bash
xvfb-run -a npm test
```

## Writing Tests

Tests are written using Mocha's TDD style. Add new test files to the `suite/` directory with the `.test.ts` extension.

Example:

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('My Test Suite', () => {
    test('My test', () => {
        assert.strictEqual(1 + 1, 2);
    });
});
```
