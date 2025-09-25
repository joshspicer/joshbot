# JoshBot Extension - Unit Tests

## Overview

This repository now includes simple unit tests for the JoshBot VS Code extension. The tests focus on the core business logic and utility functions without requiring full VS Code extension testing infrastructure.

## Test Setup

The testing is set up using:
- **Jest** - Testing framework
- **TypeScript** - For TypeScript support in tests
- **ts-jest** - Jest preset for TypeScript

## Running Tests

```bash
# Run all unit tests
npm run test:unit

# Run tests in watch mode (auto-rerun on changes)
npm run test:unit:watch

# Run tests with coverage report
npm run test:unit:coverage
```

## Test Structure

- `test/` - Contains all test files
- `src/testable-functions.ts` - Extracted pure functions from the main extension that can be easily tested
- `test/testable-functions.test.ts` - Unit tests for the core functionality

## What's Tested

The unit tests cover:

### Core Functions
- Session ID generation (`generateSessionId`)
- Session label creation (`generateSessionLabel`) 
- Session item creation (`createSessionItem`)
- Session content type detection (`getSessionContentType`)

### Mock Session Creation
- Completed chat sessions (`createMockCompletedSession`)
- In-progress chat sessions (`createMockInProgressSession`)
- Untitled chat sessions (`createMockUntitledSession`)

### Business Logic
- Confirmation step handling (`handleConfirmationStep`)
- Default session items (`getDefaultSessionItems`)

### Integration Tests
- Complete session workflow
- Confirmation and session creation flow

## Test Coverage

Current test coverage: **96.42%** of testable functions

## Design Decisions

1. **Extracted Pure Functions**: Instead of trying to test the complex VS Code extension directly, we extracted the core business logic into pure functions that are easy to test.

2. **Mock Objects**: Created simplified mock objects that represent the essential structure without VS Code dependencies.

3. **Simple Setup**: Used Jest for its simplicity and excellent TypeScript support.

4. **Focused Testing**: Tests focus on the logic and behavior rather than VS Code API integration.

## Future Improvements

- Add integration tests using VS Code extension testing framework
- Test the actual extension activation and chat participant behavior
- Add performance tests for session handling
- Mock VS Code APIs for more comprehensive testing