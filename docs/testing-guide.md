# Testing Guide

## Overview

This guide covers testing practices for the OCI GenAI Provider, including unit tests, integration tests, and E2E tests.

## Test Structure

```
src/
├── __tests__/
│   ├── utils/           # Shared test utilities
│   ├── mocks/           # Shared mock providers
│   ├── fixtures/        # Test data fixtures
│   ├── integration/     # Integration tests
│   └── e2e/             # End-to-end tests
├── provider.test.ts     # Provider tests
├── language-models/
│   └── __tests__/       # Language model tests
├── embedding-models/
│   └── __tests__/       # Embedding tests
└── (other model types...)
```

## Running Tests

### All Tests

```bash
pnpm test
```

### With Coverage

```bash
pnpm test:coverage
```

### Watch Mode

```bash
pnpm test:watch
```

### Unit Tests Only

```bash
pnpm test:unit
```

### Integration Tests Only

```bash
pnpm test:integration
```

### CI Mode

```bash
pnpm test:coverage:ci
```

## Writing Tests

### Unit Tests

**Location:** `src/<module>/__tests__/<file>.test.ts`

**Example:**

```typescript
import { describe, it, expect } from '@jest/globals';
import { mockOCIError } from '../utils/test-helpers';

describe('Error Handling', () => {
  it('should handle rate limit errors', () => {
    const error = mockOCIError('RateLimit', 'Too many requests');

    expect(error.statusCode).toBe(429);
    expect(error.message).toContain('Too many requests');
  });
});
```

### Integration Tests

**Location:** `src/__tests__/integration/<feature>.integration.test.ts`

**Example:**

```typescript
import { describe, it, expect } from '@jest/globals';
import { createMockOCIConfig } from '../utils/test-helpers';

describe('Language Models Integration', () => {
  it('should support all Cohere models', () => {
    const config = createMockOCIConfig();
    expect(config.region).toBe('eu-frankfurt-1');
  });
});
```

### Using Test Helpers

```typescript
import {
  createMockOCIConfig,
  createMockOCIResponse,
  mockOCIError,
  waitForCondition,
} from '../utils/test-helpers';

// Create mock config
const config = createMockOCIConfig({
  region: 'eu-frankfurt-1',
});

// Create mock response
const response = createMockOCIResponse('language', {
  text: 'Hello world',
});

// Create mock error
const error = mockOCIError('RateLimit', 'Too many requests');
```

### Using Fixtures

```typescript
import { LANGUAGE_MODEL_FIXTURES, EMBEDDING_FIXTURES, COMMON_SCENARIOS } from '../fixtures';

// Use predefined responses
const response = LANGUAGE_MODEL_FIXTURES.simpleCompletion;

// Use predefined configs
const config = COMMON_SCENARIOS.configs.frankfurt;

// Use predefined messages
const messages = COMMON_SCENARIOS.messages.simple;
```

## Coverage Requirements

- **Minimum:** 80% across all metrics (lines, branches, functions, statements)
- **Target:** 90%+ for critical paths
- **Excluded:** Type definitions, barrel exports

### Checking Coverage

```bash
pnpm test:coverage
```

Coverage report will be in `coverage/lcov-report/index.html`

## Mocking OCI SDK

```typescript
import { mockGenerativeAiInferenceClient, mockAuthProvider } from '../mocks/oci-mocks';

// Create custom mock
const mockClient = mockGenerativeAiInferenceClient({
  chatResponse: { text: 'Custom response' },
  shouldError: false,
});
```

## Best Practices

### 1. Test Isolation

- Each test should be independent
- Use `beforeEach` to reset state
- Don't rely on test execution order

### 2. Descriptive Names

```typescript
// ✅ Good
it('should throw error when model ID is invalid', () => {});

// ❌ Bad
it('test 1', () => {});
```

### 3. Arrange-Act-Assert

```typescript
it('should create mock config', () => {
  // Arrange
  const overrides = { region: 'us-ashburn-1' };

  // Act
  const config = createMockOCIConfig(overrides);

  // Assert
  expect(config.region).toBe('us-ashburn-1');
});
```

### 4. Test Both Happy and Error Paths

```typescript
describe('error handling', () => {
  it('should handle valid input', () => {
    // Happy path
  });

  it('should throw error with invalid input', () => {
    // Error path
  });
});
```

### 5. Use Test Fixtures

- Prefer fixtures over inline test data
- Keep fixtures in `src/__tests__/fixtures/`
- Update fixtures when API changes

### 6. Mock External Dependencies

- Always mock OCI SDK in unit tests
- Use real SDK only in manual integration tests
- Mock network calls to prevent flakiness

## CI/CD Integration

Tests run automatically on:

- Every push to main
- Every pull request
- Pre-commit (unit tests only)

### Pre-Commit Hook

```bash
# Runs automatically before commit
# - Type checking
# - Linting
# - Unit tests (fast)
```

### CI Pipeline

```bash
# Full test suite on PR/push
# - Unit tests
# - Integration tests
# - Coverage report
# - Coverage threshold check (80%)
```

## Troubleshooting

### Tests Timeout

- Increase timeout: `jest.setTimeout(30000)`
- Check for unresolved promises
- Ensure mocks are properly configured

### Coverage Below Threshold

```bash
# Find uncovered lines
pnpm test:coverage
open coverage/lcov-report/index.html
```

### Open Handles Warning

- OCI SDK clients may not close properly
- Use `forceExit: true` in jest.config.js
- Or manually close clients in `afterAll`

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://testingjavascript.com/)
- [AI SDK Testing Guide](https://sdk.vercel.ai/docs/testing)
