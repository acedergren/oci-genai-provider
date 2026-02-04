# Code Standards & Quality Requirements

## Overview

**Source**: `.claude/code-standards.md`
**Last Updated**: 2026-01-28
**Applies To**: All contributors (human and AI)

These standards are codified from the existing codebase and are **mandatory** for all code contributions.

## Naming Conventions Reference

### Files

| Type              | Convention                      | Example                             |
| ----------------- | ------------------------------- | ----------------------------------- |
| Model classes     | PascalCase                      | `OCISpeechModel.ts`                 |
| Utilities         | kebab-case                      | `sse-parser.ts`, `retry.ts`         |
| Barrel exports    | `index.ts`                      | `shared/utils/index.ts`             |
| Type definitions  | `types.ts`                      | `src/types.ts`                      |
| Tests             | `{Source}.test.ts`              | `OCISpeechModel.test.ts`            |
| Integration tests | `{feature}.integration.test.ts` | `speech-models.integration.test.ts` |
| E2E tests         | `{scenario}.e2e.test.ts`        | `full-workflow.e2e.test.ts`         |

**Note**: Legacy files (`oci-language-model.ts`, `oci-embedding-model.ts`) use kebab-case but new model files must use PascalCase.

### Classes

```typescript
// PascalCase, OCI prefix for provider-facing classes
class OCILanguageModel {}
class OCISpeechModel {}
class OCIGenAIProvider {}

// Error classes: PascalCase, Error suffix
class OCIGenAIError extends Error {}
class NetworkError extends OCIGenAIError {}
class RateLimitError extends OCIGenAIError {}
```

### Interfaces & Types

```typescript
// PascalCase, NO I- prefix, descriptive suffix
interface OCIConfig {}
interface OCILanguageModelSettings extends OCIConfig {}
interface ModelMetadata {}

// Metadata interfaces scoped by domain
interface EmbeddingModelMetadata {}
interface SpeechModelMetadata {}

// Union types: PascalCase name, snake_case values
type OCIAuthMethod = 'config_file' | 'instance_principal' | 'resource_principal';
```

### Functions

```typescript
// camelCase, verb-first
function isValidModelId(modelId: string): boolean {}
function getModelMetadata(modelId: string): ModelMetadata | undefined {}

// Prefix patterns:
// is-     : Predicates returning boolean
// get-    : Retrievers returning data
// create- : Factory functions
// convert-: Format converters
// map-    : Mapping/transformation
// handle- : Error handlers
// with-   : Utility wrappers

function isRetryableError(error: unknown): boolean {}
function getModelsByFamily(family: string): ModelMetadata[] {}
function createAuthProvider(config: OCIConfig): Promise<AuthProvider> {}
function convertToOCIMessages(prompt: Prompt): OCIMessage[] {}
function mapFinishReason(reason: string): FinishReason {}
function handleOCIError(error: unknown): OCIGenAIError {}
function withRetry<T>(fn: () => Promise<T>): Promise<T> {}
```

### Constants

```typescript
// UPPER_SNAKE_CASE for module-level constants
const DEFAULT_REQUEST_OPTIONS: Required<RequestOptions> = {
  /* ... */
};
const RETRYABLE_ERROR_CODES = ['ECONNRESET', 'ETIMEDOUT'];
const ROLE_MAP: Record<string, string> = { user: 'USER' };

// Model catalogs: UPPER_SNAKE_CASE plural
const MODEL_CATALOG: ModelMetadata[] = [
  /* ... */
];
const EMBEDDING_MODELS: EmbeddingModelMetadata[] = [
  /* ... */
];
```

### Private Members

```typescript
class OCISpeechModel {
  private _client?: AIServiceSpeechClient; // underscore prefix for lazy-init
  private _config: OCISpeechSettings; // underscore prefix for state

  private async getClient() {} // NO underscore on methods
}
```

### Variables

```typescript
// camelCase for local variables and parameters
const modelId = 'cohere.command-r-plus';
const mergedConfig: OCIConfig = { ...this.config, ...settings };
```

## Directory Structure Pattern

```
src/
├── {domain}-models/           # One directory per model domain (kebab-case)
│   ├── __tests__/             # Co-located unit tests
│   │   └── {ClassName}.test.ts
│   ├── {ClassName}.ts         # Model implementation (PascalCase)
│   └── registry.ts            # Model catalog & lookup functions
├── shared/                    # Cross-cutting concerns
│   ├── errors/                # Error class hierarchy
│   ├── streaming/             # SSE/streaming utilities
│   ├── storage/               # Object Storage helpers
│   └── utils/                 # Retry, timeout, etc.
├── auth/                      # OCI authentication
├── index.ts                   # Public API barrel exports
├── provider.ts                # ProviderV3 implementation
└── types.ts                   # Shared type definitions
```

**Rules**:

- Each model domain → own `{domain}-models/` directory
- Tests co-located in `__tests__/` subdirectories
- Shared code in `shared/` with max one level of nesting
- No deep nesting beyond this structure

## Registry Pattern (Mandatory)

Every model domain **must** include a `registry.ts` with this structure:

```typescript
// 1. Metadata interface
export interface DomainModelMetadata {
  id: string;
  name: string;
  family: string;
  // domain-specific fields...
}

// 2. Model catalog constant
export const DOMAIN_MODELS: DomainModelMetadata[] = [
  /* ... */
];

// 3. Standard lookup functions (consistent naming across domains)
export function isValidDomainModelId(modelId: string): boolean {
  return DOMAIN_MODELS.some((model) => model.id === modelId);
}

export function getDomainModelMetadata(modelId: string): DomainModelMetadata | undefined {
  return DOMAIN_MODELS.find((model) => model.id === modelId);
}

export function getAllDomainModels(): DomainModelMetadata[] {
  return DOMAIN_MODELS;
}
```

## Import/Export Conventions

### Import Order

```typescript
// 1. External packages (alphabetical)
import { Region } from 'oci-common';
import { GenerativeAiInferenceClient } from 'oci-generativeaiinference';

// 2. Type-only imports
import type { LanguageModelV3 } from '@ai-sdk/provider';

// 3. Internal imports (relative paths with .js extension)
import { OCILanguageModel } from './language-models/oci-language-model.js';
import { handleOCIError } from '../shared/errors/index.js';
import type { OCIConfig } from '../types.js';
```

**Rules**:

- Never use path aliases; always relative paths
- Use `import type` for type-only imports
- Include `.js` extension on relative imports for ESM compatibility
- Order: externals → type-only externals → internals

### Barrel Exports

Organize `index.ts` exports with labeled sections:

```typescript
// ============================================================================
// Provider Exports
// ============================================================================

export { OCIGenAIProvider } from './provider.js';
export function createOCI(config?: OCIConfig): OCIGenAIProvider {}

// ============================================================================
// Type Exports
// ============================================================================

export type { OCIConfig, ModelMetadata } from './types.js';
```

**Rules**:

- Group by feature domain
- Use `export type` for type-only exports
- Re-export everything consumers need
- One barrel per shared subdirectory

## Error Handling Standards

### Error Hierarchy

```
OCIGenAIError (base)
├── NetworkError        (retryable: true)
├── RateLimitError      (retryable: true, has retryAfterMs)
├── AuthenticationError (retryable: false)
└── ModelNotFoundError  (retryable: false)
```

**Rules**:

- All custom errors extend `OCIGenAIError`
- Every error sets `retryable: boolean` explicitly
- Include contextual remediation hints in messages
- Use `handleOCIError()` to wrap unknown errors
- Never expose raw OCI SDK errors to consumers

### Error Messages

```typescript
// ✅ Good - includes context and remediation
throw new AuthenticationError('OCI authentication failed. Check credentials in ~/.oci/config');

// ❌ Bad - generic, no actionable guidance
throw new Error('Authentication failed');
```

## Required Design Patterns

### 1. Lazy Client Initialization

All OCI SDK clients **must** use lazy initialization:

```typescript
private _client?: SomeOCIClient;

private async getClient(): Promise<SomeOCIClient> {
  if (!this._client) {
    const authProvider = await createAuthProvider(this.config);
    this._client = new SomeOCIClient({
      authenticationDetailsProvider: authProvider
    });
    this._client.region = getRegion(this.config);
  }
  return this._client;
}
```

**Why**: Avoids blocking constructor with async auth, allows config validation before first use.

### 2. Retry Pattern

Use `withRetry()` wrapper for retryable operations:

```typescript
const result = await withRetry(() => client.chat(request), {
  maxRetries: 3,
  baseDelayMs: 100,
  maxDelayMs: 10000,
});
```

### 3. Config Merging Pattern

Provider merges default config with per-call settings:

```typescript
languageModel(modelId: string, settings?: OCILanguageModelSettings): LanguageModelV3 {
  const mergedConfig = { ...this.config, ...settings };
  return new OCILanguageModel(modelId, mergedConfig);
}
```

## TypeScript Quality Requirements

### Required `compilerOptions`

```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true,
  "noUncheckedIndexedAccess": true
}
```

**Target**: ES2020  
**Module Resolution**: bundler

### Type Safety Rules

- Never use `any` (use `unknown` for truly unknown types)
- All function return types must be explicit
- All public APIs must have full type annotations
- Use `type` for unions/aliases, `interface` for objects
- Prefer `readonly` for immutable data structures

## Testing Standards

### Test Structure

```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

describe('ClassName', () => {
  const mockConfig = { region: 'eu-frankfurt-1' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should return X when given Y', () => {
      // Arrange
      const input = /* ... */;

      // Act
      const result = fn(input);

      // Assert
      expect(result).toBe(expected);
    });

    it('should throw NetworkError on connection failure', async () => {
      await expect(fn()).rejects.toThrow(NetworkError);
    });
  });
});
```

### Test Naming

```typescript
// ✅ Good - describes expected behavior
it('should return undefined for invalid model ID', () => {});
it('should throw AuthenticationError when credentials missing', () => {});

// ❌ Bad - vague or implementation-focused
it('test model validation', () => {});
it('calls getModelMetadata', () => {});
```

### Coverage Requirements

**Minimum**: 80% coverage (branches, functions, lines, statements)

**Excluded from coverage**:

- `index.ts` (barrel exports)
- `types.ts` (type definitions)
- `__tests__/` (test files)
- `__mocks__/` (mock files)

### Test Categories

| Suffix                 | Location                 | Purpose                  |
| ---------------------- | ------------------------ | ------------------------ |
| `.test.ts`             | `{module}/__tests__/`    | Unit tests               |
| `.integration.test.ts` | `__tests__/integration/` | OCI service integration  |
| `.e2e.test.ts`         | `__tests__/e2e/`         | Full workflow validation |

## Documentation Requirements

### JSDoc Standards

````typescript
/**
 * Creates an OCI GenAI provider instance.
 *
 * @param config - Optional configuration overrides
 * @returns Provider instance with model factory methods
 *
 * @example
 * ```typescript
 * const provider = createOCI({
 *   region: 'eu-frankfurt-1',
 *   compartmentId: 'ocid1.compartment.oc1...'
 * });
 * const model = provider.languageModel('cohere.command-r-plus');
 * ```
 */
export function createOCI(config?: OCIConfig): OCIGenAIProvider {
  // implementation
}
````

**Requirements**:

- JSDoc on all public exports (classes, functions, types)
- `@example` blocks with runnable TypeScript
- `@default` tags for optional parameters with defaults
- No inline comments unless logic is non-obvious
- No auto-generated doc files

## Vercel AI SDK Integration

Model classes implement ProviderV3 method contracts:

| Provider Method        | Model Class Method           | Returns                |
| ---------------------- | ---------------------------- | ---------------------- |
| `languageModel()`      | `doGenerate()`, `doStream()` | `LanguageModelV3`      |
| `embeddingModel()`     | `doEmbed()`                  | `EmbeddingModelV3`     |
| `speechModel()`        | `doGenerate()`               | `SpeechModelV3`        |
| `transcriptionModel()` | `doTranscribe()`             | `TranscriptionModelV3` |
| `rerankingModel()`     | `doRerank()`                 | `RerankingModelV3`     |

## Quality Checklist

Before committing code, verify:

- [ ] File naming follows conventions (PascalCase for models, kebab-case for utils)
- [ ] All classes/functions have correct naming prefix/suffix
- [ ] Imports ordered correctly (external → type-only → internal)
- [ ] All imports use `.js` extension for ESM compatibility
- [ ] Error classes extend OCIGenAIError with retryable flag
- [ ] OCI clients use lazy initialization pattern
- [ ] All public APIs have JSDoc with examples
- [ ] Test coverage ≥ 80%
- [ ] Test names start with "should" and describe behavior
- [ ] TypeScript strict mode enabled, no type errors
- [ ] No `any` types (use `unknown` instead)
- [ ] All function return types explicit

## Common Violations to Avoid

### ❌ Bad Practices

```typescript
// 1. Missing .js extension
import { foo } from './utils/foo';  // ❌ Missing .js

// 2. Using 'any' type
function process(data: any) { }  // ❌ Use unknown

// 3. I-prefix on interfaces
interface IConfig { }  // ❌ No I-prefix

// 4. Path aliases
import { foo } from '@/utils/foo';  // ❌ Use relative paths

// 5. Vague test names
it('works', () => {});  // ❌ Describe expected behavior

// 6. Sync client initialization
constructor() {
  this.client = new OCI.Client();  // ❌ Use lazy pattern
}

// 7. Generic error messages
throw new Error('Failed');  // ❌ Add context and remediation
```

### ✅ Good Practices

```typescript
// 1. Include .js extension
import { foo } from './utils/foo.js';  // ✅

// 2. Use unknown for unknown types
function process(data: unknown) { }  // ✅

// 3. No I-prefix
interface Config { }  // ✅

// 4. Relative paths
import { foo } from '../utils/foo.js';  // ✅

// 5. Descriptive test names
it('should return user data when ID is valid', () => {});  // ✅

// 6. Lazy client initialization
private async getClient() { }  // ✅

// 7. Contextual error messages
throw new AuthenticationError(
  'OCI authentication failed. Check ~/.oci/config'
);  // ✅
```

## Related Documentation

- **Full Standards**: `.claude/code-standards.md`
- **Testing Guide**: `docs/testing/README.md`
- **Architecture**: `docs/architecture/README.md`
