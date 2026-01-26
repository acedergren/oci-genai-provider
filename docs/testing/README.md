# Testing Guide

This document describes the test suite organization and testing practices for the OCI GenAI monorepo.

## Test Suite Structure

```
packages/
├── test-utils/                    # Shared test utilities (private)
│   ├── src/
│   │   ├── oci-common.ts         # OCI auth mocks
│   │   ├── oci-generativeaiinference.ts  # OCI GenAI mocks
│   │   └── index.ts              # Test fixtures
│   └── README.md
│
├── oci-genai-provider/            # Core provider tests
│   └── src/
│       ├── __tests__/            # Unit tests
│       │   ├── setup.ts          # Global test setup
│       │   ├── types.test.ts     # Type definitions
│       │   ├── provider.test.ts  # Provider factory
│       │   └── errors.test.ts    # Error handling
│       ├── auth/__tests__/       # Auth module tests
│       ├── models/__tests__/     # Model tests
│       ├── converters/__tests__/ # Converter tests
│       └── streaming/__tests__/  # Streaming tests
│
└── opencode-integration/          # Integration tests
    └── __tests__/                # OpenCode-specific tests
        └── (to be added)
```

## Test Categories

### Unit Tests

Located in `src/__tests__/` and module `__tests__/` directories.

- **Fast** - Run in milliseconds
- **Isolated** - No external dependencies
- **Mocked** - Use test-utils mocks for OCI SDK

```bash
# Run all unit tests
pnpm test

# Run unit tests for specific package
pnpm --filter @acedergren/oci-genai-provider test
```

### Integration Tests

Located in `src/__tests__/integration/` (to be added).

- **Moderate speed** - Run in seconds
- **Real OCI SDK** - Use actual SDK without network calls
- **End-to-end flows** - Test complete provider workflows

```bash
# Run integration tests
pnpm test:integration
```

### Manual Tests

Located in `src/__tests__/manual/` (optional).

- **Require credentials** - Need real OCI account
- **Network calls** - Hit actual OCI GenAI API
- **Skipped in CI** - Run manually for verification

```bash
# Run manual tests (requires OCI credentials)
OCI_COMPARTMENT_ID=ocid1... pnpm test:manual
```

## Test Organization

### Current Test Coverage

**Total: 121 tests across 9 test files**

#### Core Provider (`@acedergren/oci-genai-provider`)

1. **Type Definitions** (`types.test.ts`) - 3 tests
   - OCIConfig validation
   - OCIProvider interface
   - ModelMetadata structure

2. **Authentication** (`auth/__tests__/auth.test.ts`) - 4 tests
   - Config file auth
   - Instance principal auth
   - Resource principal auth
   - Custom profiles

3. **Model Registry** (`models/__tests__/registry.test.ts`) - 28 tests
   - Model ID validation (Grok, Llama, Cohere, Gemini)
   - Model metadata retrieval
   - Family-based filtering
   - Model capabilities

4. **Message Conversion** (`converters/__tests__/messages.test.ts`) - 9 tests
   - AI SDK → OCI format conversion
   - Role mapping (user, assistant, system)
   - Content format handling (string, array)
   - Multi-turn conversations

5. **Language Model** (`models/__tests__/oci-language-model.test.ts`) - 22 tests
   - Model construction
   - doGenerate method
   - Parameter handling (temperature, maxTokens, etc.)
   - Finish reason mapping
   - Client initialization

6. **Streaming** (`streaming/__tests__/sse-parser.test.ts`, `models/__tests__/oci-language-model.stream.test.ts`) - 19 tests
   - SSE parser (text deltas, finish events)
   - doStream method
   - ReadableStream creation
   - Error handling

7. **Provider Factory** (`provider.test.ts`) - 16 tests
   - Factory creation
   - Model creation
   - Configuration cascade
   - AI SDK integration patterns

8. **Error Handling** (`errors.test.ts`) - 20 tests
   - OCIGenAIError creation
   - Retry detection (429, 5xx)
   - Status code handling
   - Contextual error messages

#### Integration Package (`@acedergren/opencode-oci-genai`)

- **No tests yet** - Package under development

## Test Configuration

### Jest Configuration

Each package has its own `jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Coverage Goals

- **80% minimum** for all metrics (branches, functions, lines, statements)
- **Public API** - 100% coverage required
- **Edge cases** - All error conditions tested
- **Integration points** - AI SDK integration verified

## Writing Tests

### Test Structure

```typescript
import { describe, it, expect } from '@jest/globals';
import { TEST_CONFIG, TEST_MODEL_IDS } from '@acedergren/test-utils';

describe('Feature Name', () => {
  describe('Specific Function', () => {
    it('should handle success case', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = myFunction(input);

      // Assert
      expect(result).toBe('expected');
    });

    it('should handle error case', () => {
      expect(() => {
        myFunction(null);
      }).toThrow('Expected error message');
    });
  });
});
```

### Best Practices

1. **Descriptive names** - Test names should explain what is being tested
2. **Arrange-Act-Assert** - Clear test structure
3. **One assertion per test** - Or closely related assertions
4. **Test behavior, not implementation** - Focus on outcomes
5. **Use test fixtures** - Import from `@acedergren/test-utils`

### Mocking

```typescript
import { jest } from '@jest/globals';

// Mock OCI SDK calls
jest.mock('oci-generativeaiinference');

// Use shared mocks from test-utils
import { TEST_CONFIG } from '@acedergren/test-utils';
```

## Running Tests

```bash
# All tests across all packages
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage

# Specific package
pnpm --filter @acedergren/oci-genai-provider test

# Specific test file
pnpm --filter @acedergren/oci-genai-provider test -- auth.test.ts
```

## Continuous Integration

Tests run automatically on:

- **Pull requests** - All tests must pass
- **Main branch commits** - Regression detection
- **Release tags** - Pre-publish validation

### CI Configuration

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test
      - run: pnpm test:coverage
```

## Test Data

### Fixtures

Common test data is available from `@acedergren/test-utils`:

```typescript
import { TEST_CONFIG, TEST_MODEL_IDS, TEST_OCIDS } from '@acedergren/test-utils';

// Use in tests
const model = oci(TEST_MODEL_IDS.grok, TEST_CONFIG);
```

### Environment Variables

Test environment variables (set in `setup.ts`):

- `OCI_REGION=eu-frankfurt-1`
- `OCI_COMPARTMENT_ID=ocid1.compartment.oc1..test`

## Troubleshooting

### Tests Failing Locally

1. **Install dependencies**: `pnpm install`
2. **Clear Jest cache**: `pnpm test --clearCache`
3. **Check Node version**: `node --version` (should be >=18)

### Coverage Below Threshold

1. Check uncovered lines: `pnpm test:coverage --verbose`
2. Add tests for uncovered code paths
3. Consider if code is testable (may need refactoring)

### Flaky Tests

1. Avoid timeouts and delays
2. Mock all external dependencies
3. Don't rely on execution order
4. Use deterministic test data

## Future Improvements

- [ ] Add integration tests with real SDK (no network)
- [ ] Create example applications with E2E tests
- [ ] Set up visual regression testing
- [ ] Add performance benchmarking
- [ ] Implement mutation testing

## Contributing

When adding new features:

1. Write tests first (TDD)
2. Ensure 80%+ coverage
3. Update this documentation
4. Run full test suite before committing
