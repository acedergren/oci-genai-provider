# Testing Strategy & TDD Workflow

## Test Suite Overview

**Total Tests**: 121 comprehensive tests across 14 test files
**Coverage Target**: 80%+ (branches, functions, lines, statements)
**Test Framework**: Jest with @jest/globals
**Approach**: Test-Driven Development (TDD) with RED-GREEN-REFACTOR cycles

## Test Breakdown by Module

| Module             | Tests | File Location                                            |
| ------------------ | ----- | -------------------------------------------------------- |
| Type definitions   | 3     | `src/__tests__/types.test.ts`                            |
| Authentication     | 4     | `src/auth/__tests__/auth.test.ts`                        |
| Model registry     | 28    | `src/models/__tests__/registry.test.ts`                  |
| Message conversion | 9     | `src/converters/__tests__/messages.test.ts`              |
| doGenerate         | 22    | `src/models/__tests__/oci-language-model.test.ts`        |
| SSE parser         | 11    | `src/streaming/__tests__/sse-parser.test.ts`             |
| doStream           | 8     | `src/models/__tests__/oci-language-model.stream.test.ts` |
| Provider factory   | 16    | `src/__tests__/provider.test.ts`                         |
| Error handling     | 20    | `src/__tests__/errors.test.ts`                           |

## TDD Workflow (RED-GREEN-REFACTOR)

### Step-by-Step Cycle

1. **RED (Write failing test)**
   - Update test to import and call real implementation
   - Run `pnpm test`
   - Expected: FAIL with "Not implemented" or specific error

2. **GREEN (Write minimal code)**
   - Implement just enough code to make test pass
   - Run `pnpm test`
   - Expected: PASS

3. **REFACTOR (Improve code quality)**
   - Improve code without changing behavior
   - Run `pnpm test`
   - Expected: PASS

4. **COMMIT (Atomic commit)**
   - Commit with passing tests
   - Message format: `feat(module): description`
   - Include `Co-Authored-By: Claude <noreply@anthropic.com>`

## Test Utilities (@acedergren/test-utils)

### Shared Mocks

```typescript
// OCI SDK mocks are auto-available via jest.mock()
jest.mock('oci-common');
jest.mock('oci-generativeaiinference');

// No need to manually mock - test-utils provides:
// - ConfigFileAuthenticationDetailsProvider
// - InstancePrincipalsAuthenticationDetailsProviderBuilder
// - ResourcePrincipalAuthenticationDetailsProvider
// - GenerativeAiInferenceClient
```

### Test Fixtures

```typescript
import { TEST_CONFIG, TEST_MODEL_IDS, TEST_OCIDS } from '@acedergren/test-utils';

// TEST_CONFIG
{
  region: 'eu-frankfurt-1',
  compartmentId: 'ocid1.compartment.oc1..test',
  profile: 'DEFAULT',
}

// TEST_MODEL_IDS
{
  grok: 'xai.grok-4',
  llama: 'meta.llama-3.3-70b-instruct',
  cohere: 'cohere.command-r-plus',
  gemini: 'google.gemini-2.5-flash',
}

// TEST_OCIDS
{
  compartment: 'ocid1.compartment.oc1..test',
  user: 'ocid1.user.oc1..test',
  tenancy: 'ocid1.tenancy.oc1..test',
}
```

## Running Tests

```bash
# All packages
pnpm test

# Specific package with filter
pnpm --filter @acedergren/oci-genai-provider test

# Watch mode for development
pnpm --filter @acedergren/oci-genai-provider test -- --watch

# Coverage report
pnpm test:coverage

# Single test file
pnpm --filter @acedergren/oci-genai-provider test -- registry.test.ts
```

## Test Best Practices

### 1. Arrange-Act-Assert Pattern

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

### 2. Descriptive Test Names

```typescript
// ✅ Good
it('should return undefined for invalid model ID', () => {});
it('should add auth context to 401 errors', () => {});

// ❌ Bad
it('test model validation', () => {});
it('calls getModelMetadata', () => {});
```

### 3. One Concept Per Test

```typescript
// ✅ Good - separate tests
it('should map STOP to stop', () => {});
it('should map LENGTH to length', () => {});

// ❌ Bad - multiple concepts in one test
it('should map all finish reasons', () => {
  expect(mapFinishReason('STOP')).toBe('stop');
  expect(mapFinishReason('LENGTH')).toBe('length');
});
```

### 4. Test Both Success and Error Cases

```typescript
it('should create model with valid ID', () => {
  const model = new OCILanguageModel('cohere.command-r-plus', config);
  expect(model.modelId).toBe('cohere.command-r-plus');
});

it('should throw error for invalid model ID', () => {
  expect(() => new OCILanguageModel('invalid', config)).toThrow('Invalid model ID');
});
```

## Implementation Plans

- **TDD Plan**: `docs/plans/2026-01-27-core-provider-tdd-implementation.md`
- **Test Spec**: `docs/plans/2026-01-26-test-suite-specification.md`
- **Testing Guide**: `docs/testing/README.md`

## Current Status

**Phase**: Implementation in progress
**Approach**: Following strict TDD workflow with atomic commits
**Execution**: Tasks executed sequentially with RED-GREEN-REFACTOR-COMMIT cycles
