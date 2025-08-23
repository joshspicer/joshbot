# JoshBot Tests

This directory contains the test infrastructure for the JoshBot VS Code extension.

## Test Structure

- `runTest.ts` - Integration test runner (requires VS Code to be downloaded)
- `runUnitTests.ts` - Unit test runner (runs standalone without VS Code)
- `suite/extension.test.ts` - Integration tests for VS Code extension functionality
- `suite/unit.test.ts` - Unit tests for core functionality

## Running Tests

### Unit Tests (Recommended)
```bash
npm test
# or
npm run test:unit
```

### Integration Tests 
```bash
npm run test:integration
```
*Note: Integration tests require VS Code to be downloaded and may fail in environments without internet access.*

## Test Coverage

The unit tests cover:
- ✅ Translation function with exact matches
- ✅ Case-insensitive translation
- ✅ Partial word replacement
- ✅ Multiple word replacement
- ✅ Phrase translation
- ✅ Unknown word handling
- ✅ Edge cases and word boundaries
- ✅ Module export validation

The integration tests cover:
- Extension activation
- Command registration
- VS Code API integration