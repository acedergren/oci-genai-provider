# Code Standards & Naming Conventions

Codified conventions derived from the existing `oci-genai-provider` codebase. All contributors (human and AI) must follow these standards.

## File Naming

| Category | Convention | Example |
|----------|-----------|---------|
| Model classes | PascalCase matching class name | `OCISpeechModel.ts` |
| Utilities/helpers | kebab-case | `sse-parser.ts`, `retry.ts` |
| Barrel exports | `index.ts` | `shared/utils/index.ts` |
| Type definitions | `types.ts` | `src/types.ts` |
| Provider entry | `provider.ts` | `src/provider.ts` |
| Registries | `registry.ts` | `speech-models/registry.ts` |
| Test files | `{SourceFile}.test.ts` | `OCISpeechModel.test.ts` |
| Integration tests | `{feature}.integration.test.ts` | `speech-models.integration.test.ts` |
| E2E tests | `{scenario}.e2e.test.ts` | `full-workflow.e2e.test.ts` |
| Test fixtures | descriptive kebab-case | `language-model-responses.ts` |

**Decision**: Model class files use PascalCase to match the class name. All other files use kebab-case. Legacy files (`oci-language-model.ts`, `oci-embedding-model.ts`) are grandfathered but new model files must use PascalCase.

## Directory Structure

```
src/
├── {domain}-models/           # One directory per model domain
│   ├── __tests__/             # Co-located unit tests
│   │   └── {ClassName}.test.ts
│   ├── {ClassName}.ts         # Model implementation
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

Rules:
- Each model domain gets its own `{domain}-models/` directory (kebab-case)
- Tests live in `__tests__/` subdirectories co-located with source
- Shared code goes in `shared/` with further domain subdivision
- No more than one level of nesting under `shared/`

## Naming Conventions

### Classes

```typescript
// PascalCase, prefixed with OCI for provider-facing classes
class OCILanguageModel { }
class OCISpeechModel { }
class OCIGenAIProvider { }

// Error classes: PascalCase, suffix with Error
class OCIGenAIError extends Error { }
class NetworkError extends OCIGenAIError { }
class RateLimitError extends OCIGenAIError { }
class AuthenticationError extends OCIGenAIError { }
class ModelNotFoundError extends OCIGenAIError { }
```

### Interfaces & Types

```typescript
// PascalCase, no I- prefix, descriptive suffix
interface OCIConfig { }
interface OCILanguageModelSettings extends OCIConfig { }
interface ModelMetadata { }
interface RequestOptions { }

// Metadata interfaces scoped by domain
interface EmbeddingModelMetadata { }
interface SpeechModelMetadata { }
interface TranscriptionModelMetadata { }
interface RerankingModelMetadata { }

// Options interfaces for error constructors
interface OCIGenAIErrorOptions { }
interface NetworkErrorOptions { }

// Union/literal types: PascalCase name, snake_case values
type OCIAuthMethod = 'config_file' | 'instance_principal' | 'resource_principal';
```

### Functions

```typescript
// camelCase, verb-first
function isValidModelId(modelId: string): boolean { }
function getModelMetadata(modelId: string): ModelMetadata | undefined { }
function getAllModels(): ModelMetadata[] { }
function getModelsByFamily(family: string): ModelMetadata[] { }

// Utility wrappers: with- prefix
function withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> { }
function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> { }

// Predicates: is- prefix, returns boolean
function isRetryableError(error: unknown): boolean { }
function isRetryableStatusCode(statusCode: number): boolean { }

// Converters: convertTo- or map- prefix
function convertToOCIMessages(prompt: LanguageModelV3Prompt): OCIMessage[] { }
function mapFinishReason(reason: string): LanguageModelV3FinishReason { }

// Error handlers: handle- prefix
function handleOCIError(error: unknown): OCIGenAIError { }

// Factory functions: create- prefix
function createOCI(config?: OCIConfig): OCIGenAIProvider { }
function createAuthProvider(config: OCIConfig): Promise<AuthProvider> { }
```

### Constants

```typescript
// UPPER_SNAKE_CASE for module-level constants
const DEFAULT_REQUEST_OPTIONS: Required<RequestOptions> = { /* ... */ };
const RETRYABLE_ERROR_CODES = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'];
const ROLE_MAP: Record<string, string> = { user: 'USER', assistant: 'ASSISTANT' };
const FINISH_REASON_MAP: Record<string, string> = { STOP: 'stop', LENGTH: 'length' };

// Model catalogs: UPPER_SNAKE_CASE plural
const MODEL_CATALOG: ModelMetadata[] = [ /* ... */ ];
const EMBEDDING_MODELS: EmbeddingModelMetadata[] = [ /* ... */ ];
const SPEECH_MODELS: SpeechModelMetadata[] = [ /* ... */ ];
```

### Private Members

```typescript
class OCISpeechModel {
  private _client?: AIServiceSpeechClient;   // underscore prefix for lazily-initialized
  private _config: OCISpeechSettings;        // underscore prefix for internal state

  private async getClient(): Promise<AIServiceSpeechClient> {
    // Lazy initialization pattern -- no underscore on methods
  }
}
```

### Variables

```typescript
// camelCase for local variables and parameters
const modelId = 'cohere.command-r-plus';
const mergedConfig: OCIConfig = { ...this.config, ...settings };
const authProvider = await createAuthProvider(config);
```

## Registry Pattern

Every model domain must include a `registry.ts` that follows this structure:

```typescript
// 1. Metadata interface
export interface DomainModelMetadata {
  id: string;
  name: string;
  family: string;
  // domain-specific fields...
}

// 2. Model catalog constant
export const DOMAIN_MODELS: DomainModelMetadata[] = [ /* ... */ ];

// 3. Standard lookup functions (consistent naming across domains)
export function isValidDomainModelId(modelId: string): boolean { }
export function getDomainModelMetadata(modelId: string): DomainModelMetadata | undefined { }
export function getAllDomainModels(): DomainModelMetadata[] { }
```

## Export Conventions

### Barrel Exports (`index.ts`)

Organize exports into labeled sections using `=====` comment separators:

```typescript
// ============================================================================
// Provider Exports
// ============================================================================

export { OCIGenAIProvider } from './provider';
export function createOCI(config?: OCIConfig): OCIGenAIProvider { }
export const oci = createOCI();

// ============================================================================
// Type Exports
// ============================================================================

export type { OCIConfig, ModelMetadata } from './types';
```

Rules:
- Group by feature domain (Provider, Types, Language Models, Embeddings, etc.)
- `export type` for type-only exports
- Re-export everything the consumer needs; no deep imports into internals
- One barrel `index.ts` per shared subdirectory (`shared/utils/index.ts`, `shared/errors/index.ts`)

### Package Exports (`package.json`)

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  }
}
```

## Import Conventions

```typescript
// 1. External packages first (alphabetical)
import { Region } from 'oci-common';
import { GenerativeAiInferenceClient } from 'oci-generativeaiinference';

// 2. Type-only imports (use `import type`)
import type { LanguageModelV3 } from '@ai-sdk/provider';

// 3. Internal imports (relative paths, include .js for ESM)
import { OCILanguageModel } from './language-models/oci-language-model';
import { handleOCIError } from '../shared/errors/index.js';
import type { OCIConfig } from '../types';
```

Rules:
- Never use path aliases; always relative paths
- Use `import type` for type-only imports
- Include `.js` extension on relative imports for ESM compatibility
- Group: externals, then type-only externals, then internals

## Error Handling

### Error Class Hierarchy

```
OCIGenAIError (base)
├── NetworkError        (retryable: true)
├── RateLimitError      (retryable: true, has retryAfterMs)
├── AuthenticationError (retryable: false)
└── ModelNotFoundError  (retryable: false)
```

Rules:
- All custom errors extend `OCIGenAIError`
- Every error class sets `retryable: boolean` explicitly
- Include contextual remediation hints in error messages
- Use `handleOCIError()` to wrap unknown errors with OCI context
- Never expose raw OCI SDK errors to consumers

### Retry Pattern

```typescript
const result = await withRetry(
  () => client.chat(request),
  { maxRetries: 3, baseDelayMs: 100, maxDelayMs: 10000 }
);
```

## TypeScript Configuration

Required `compilerOptions` for all packages:

```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true,
  "noUncheckedIndexedAccess": true
}
```

Target: `ES2020`. Module resolution: `bundler`.

## Testing Standards

### Structure

```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

describe('ClassName', () => {
  // Shared fixtures at describe scope
  const mockConfig = { region: 'eu-frankfurt-1' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should return X when given Y', () => {
      // Arrange, Act, Assert
    });

    it('should throw NetworkError on connection failure', async () => {
      await expect(fn()).rejects.toThrow(NetworkError);
    });
  });
});
```

Rules:
- Test framework: Jest with `ts-jest` preset
- Import test utilities from `@jest/globals`
- `describe` blocks match class/module name
- Nested `describe` for method/feature grouping
- Test names start with "should" and describe expected behavior
- `beforeEach` clears mocks; avoid `afterEach` cleanup when possible
- Mock OCI SDK modules at the top of test files with `jest.mock()`

### Coverage

- Minimum threshold: **80%** (branches, functions, lines, statements)
- Exclude from coverage: `index.ts`, `types.ts`, `__tests__/`, `__mocks__/`

### Test Categories

| Suffix | Location | Purpose |
|--------|----------|---------|
| `.test.ts` | `{module}/__tests__/` | Unit tests |
| `.integration.test.ts` | `__tests__/integration/` | OCI service integration |
| `.e2e.test.ts` | `__tests__/e2e/` | Full workflow validation |

## Lazy Client Initialization

All OCI SDK clients must use the lazy initialization pattern:

```typescript
private _client?: SomeOCIClient;

private async getClient(): Promise<SomeOCIClient> {
  if (!this._client) {
    const authProvider = await createAuthProvider(this.config);
    this._client = new SomeOCIClient({ authenticationDetailsProvider: authProvider });
    this._client.region = getRegion(this.config);
  }
  return this._client;
}
```

This avoids blocking the constructor with async auth and allows config validation before first use.

## Vercel AI SDK Integration

Model classes implement ProviderV3 method contracts:

| Provider Method | Model Class Method | Returns |
|----------------|-------------------|---------|
| `languageModel()` | `doGenerate()`, `doStream()` | `LanguageModelV3` |
| `embeddingModel()` | `doEmbed()` | `EmbeddingModelV3` |
| `speechModel()` | `doGenerate()` | `SpeechModelV3` |
| `transcriptionModel()` | `doTranscribe()` | `TranscriptionModelV3` |
| `rerankingModel()` | `doRerank()` | `RerankingModelV3` |

The provider class (`OCIGenAIProvider`) merges default config with per-call settings:

```typescript
languageModel(modelId: string, settings?: OCILanguageModelSettings): LanguageModelV3 {
  const mergedConfig = { ...this.config, ...settings };
  return new OCILanguageModel(modelId, mergedConfig);
}
```

## Documentation

- JSDoc on all public exports (classes, functions, types)
- `@example` blocks with runnable TypeScript snippets
- `@default` tags for optional parameters with defaults
- No inline comments unless the logic is non-obvious
- No auto-generated doc files; keep docs in `.claude/` or package `README.md`

---

**Last Updated**: 2026-01-28
