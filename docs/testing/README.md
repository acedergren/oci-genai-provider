# Testing Guide

This document describes the test suite organization and testing practices for the OCI GenAI monorepo.

## Quick Links

- **[Test Suite Specification](../plans/2026-01-26-test-suite-specification.md)** - Complete test specifications (121 tests)
- **[TDD Implementation Plan](../plans/2026-01-27-core-provider-tdd-implementation.md)** - RED-GREEN-REFACTOR implementation guide
- **[Core Implementation Plan](../plans/2026-01-27-core-provider-implementation.md)** - High-level implementation roadmap
- **[OpenCode Integration Plan](../plans/2026-01-27-opencode-integration-implementation.md)** - OpenCode wrapper implementation

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

## Test-Driven Development (TDD)

This project follows strict TDD practices with the RED-GREEN-REFACTOR cycle.

### TDD Workflow

```
┌─────────────┐
│  1. RED     │  Write failing test
│  (Fail)     │  Run: pnpm test
└──────┬──────┘  Expected: FAIL
       │
       ▼
┌─────────────┐
│  2. GREEN   │  Write minimal code to pass
│  (Pass)     │  Run: pnpm test
└──────┬──────┘  Expected: PASS
       │
       ▼
┌─────────────┐
│  3. REFACTOR│  Improve code quality
│  (Pass)     │  Run: pnpm test
└──────┬──────┘  Expected: PASS
       │
       ▼
┌─────────────┐
│  4. COMMIT  │  Atomic commit
│             │  git commit -m "feat: ..."
└─────────────┘
```

### Implementation Steps

Each task in the [TDD Plan](../plans/2026-01-27-core-provider-tdd-implementation.md) follows:

1. **RED**: Update test to call real implementation → FAIL
2. **GREEN**: Implement minimal code → PASS
3. **COMMIT**: Commit passing tests

### TDD Benefits

- **No drift** - Tests define behavior, implementation follows exactly
- **Atomic commits** - Every commit has passing tests
- **Design feedback** - Tests reveal design issues early
- **Confidence** - High coverage from day one
- **Documentation** - Tests serve as usage examples

## Best Practices

### 1. Test Structure

Follow **Arrange-Act-Assert** pattern:

```typescript
it('should convert user message', () => {
  // Arrange
  const input = [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }];

  // Act
  const result = convertToOCIMessages(input);

  // Assert
  expect(result[0].role).toBe('USER');
  expect(result[0].content[0].text).toBe('Hello');
});
```

### 2. Test Naming

Use descriptive names that explain **what** and **why**:

```typescript
// ✅ Good - describes behavior and expectation
it('should return undefined for invalid model ID', () => {});
it('should add auth context to 401 errors', () => {});

// ❌ Bad - vague or implementation-focused
it('test model validation', () => {});
it('calls getModelMetadata', () => {});
```

### 3. One Concept Per Test

Each test should verify one specific behavior:

```typescript
// ✅ Good - separate tests for each concept
it('should map STOP to stop', () => {});
it('should map LENGTH to length', () => {});
it('should map unknown to other', () => {});

// ❌ Bad - testing multiple concepts
it('should map all finish reasons', () => {
  expect(mapFinishReason('STOP')).toBe('stop');
  expect(mapFinishReason('LENGTH')).toBe('length');
  expect(mapFinishReason('OTHER')).toBe('other');
});
```

### 4. Use Shared Fixtures

Import from `@acedergren/test-utils`:

```typescript
import { TEST_CONFIG, TEST_MODEL_IDS, TEST_OCIDS } from '@acedergren/test-utils';

const model = oci(TEST_MODEL_IDS.grok, TEST_CONFIG);
```

### 5. Mock External Dependencies

Use mocks from `test-utils` for OCI SDK:

```typescript
jest.mock('oci-common');
jest.mock('oci-generativeaiinference');
```

### 6. Test Error Cases

Always test both success and error paths:

```typescript
it('should throw error for invalid model ID', () => {
  expect(() => new OCILanguageModel('invalid', config)).toThrow('Invalid model ID');
});
```

## Coverage Requirements

### Target: 80%+ on all metrics

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Checking Coverage

```bash
# Generate coverage report
pnpm test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

### Coverage Exclusions

Acceptable reasons to exclude code from coverage:

- Defensive error handling for "impossible" states
- Type guards that TypeScript proves are unnecessary
- Debug logging code

Mark with:

```typescript
/* istanbul ignore next */
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

## Test Utilities Package

The `@acedergren/test-utils` package provides shared testing infrastructure.

### What's Included

**OCI SDK Mocks:**

```typescript
// Automatically mocked by test-utils
import { ConfigFileAuthenticationDetailsProvider } from 'oci-common';
import { GenerativeAiInferenceClient } from 'oci-generativeaiinference';
```

**Test Fixtures:**

```typescript
import { TEST_CONFIG, TEST_MODEL_IDS, TEST_OCIDS } from '@acedergren/test-utils';

TEST_CONFIG = {
  region: 'eu-frankfurt-1',
  compartmentId: 'ocid1.compartment.oc1..test',
  profile: 'DEFAULT',
};

TEST_MODEL_IDS = {
  grok: 'xai.grok-4',
  llama: 'meta.llama-3.3-70b-instruct',
  cohere: 'cohere.command-r-plus',
  gemini: 'google.gemini-2.5-flash',
};

TEST_OCIDS = {
  compartment: 'ocid1.compartment.oc1..test',
  user: 'ocid1.user.oc1..test',
  tenancy: 'ocid1.tenancy.oc1..test',
};
```

### Usage in Tests

```typescript
import { describe, it, expect } from '@jest/globals';
import { TEST_CONFIG, TEST_MODEL_IDS } from '@acedergren/test-utils';
import { createOCI } from '../index';

describe('Provider Factory', () => {
  it('should create provider with test config', () => {
    const provider = createOCI(TEST_CONFIG);
    const model = provider.model(TEST_MODEL_IDS.cohere);
    expect(model.modelId).toBe(TEST_MODEL_IDS.cohere);
  });
});
```

### Why a Separate Package?

1. **Consistency** - Same mocks across all packages
2. **Reusability** - Both core and OpenCode packages use the same fixtures
3. **Clarity** - Clear separation between production and test code
4. **Maintainability** - Single place to update mocks when OCI SDK changes

## Test Data

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

Planned enhancements to the test suite:

- [ ] **Integration Tests** - Real OCI SDK without network calls
- [ ] **E2E Tests** - Example applications with full workflows
- [ ] **Performance Tests** - Latency and throughput benchmarks
- [ ] **Mutation Testing** - Verify test quality with Stryker
- [ ] **Property-based Testing** - Randomized input testing with fast-check
- [ ] **Visual Regression** - For any UI components (future)
- [ ] **Contract Testing** - Verify OCI API compatibility

## Contributing

When adding new features:

1. **Follow TDD** - Write tests first using [TDD Plan](../plans/2026-01-27-core-provider-tdd-implementation.md)
2. **Use RED-GREEN-REFACTOR** - Ensure tests fail before implementing
3. **Atomic commits** - Commit after each passing test batch
4. **80%+ coverage** - Check with `pnpm test:coverage`
5. **Update docs** - Keep this guide current
6. **Shared utilities** - Add new fixtures to `test-utils` if reusable

### Testing Checklist

Before submitting a PR:

- [ ] All tests pass (`pnpm test`)
- [ ] Coverage meets 80% threshold (`pnpm test:coverage`)
- [ ] Type checking passes (`pnpm type-check`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Tests follow naming conventions
- [ ] Error cases are tested
- [ ] Mocks use `test-utils` fixtures

---

**Last Updated**: 2026-01-27
**Test Count**: 121 tests across 14 files
**Coverage Target**: 80% (branches, functions, lines, statements)
**TDD Approach**: RED-GREEN-REFACTOR with atomic commits
