# Test Suite

This directory contains the test suite for the JoshBot VS Code extension.

## Structure

- `runTest.ts`: Entry point for running tests, downloads VS Code and runs the test suite
- `suite/index.ts`: Mocha test runner configuration
- `suite/extension.test.ts`: Extension activation and basic functionality tests

## Running Tests

To run the tests, use:

```bash
npm test
```

This will:
1. Compile the TypeScript code
2. Run the linter
3. Download VS Code (if not already cached)
4. Run the test suite

## Writing Tests

Tests use Mocha with the TDD interface. To add new tests:

1. Create a new `.test.ts` file in the `suite/` directory
2. Import required modules (assert, vscode, etc.)
3. Use `suite()` to group tests and `test()` for individual test cases

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
