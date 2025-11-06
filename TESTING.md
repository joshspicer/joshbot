# Testing

This extension includes a basic test suite to verify the extension functionality.

## Test Structure

- `src/test/runTest.ts` - Test runner that downloads VS Code and executes the tests
- `src/test/suite/index.ts` - Test suite configuration using Mocha
- `src/test/suite/extension.test.ts` - Basic tests that verify the extension can be loaded and activated

## Running Tests

To run the tests:

```bash
npm test
```

This will:
1. Compile the TypeScript code
2. Run the linter
3. Download a test instance of VS Code (if not already present)
4. Execute the tests in the VS Code environment

## Requirements

- The tests require internet access to download VS Code on first run
- Tests are run in a headless VS Code instance
- The test suite uses Mocha with the TDD interface

## Writing Tests

Tests follow the Mocha TDD style. Example:

```typescript
suite('My Test Suite', () => {
    test('My test case', () => {
        // Test code here
    });
});
```

See `src/test/suite/extension.test.ts` for examples.
