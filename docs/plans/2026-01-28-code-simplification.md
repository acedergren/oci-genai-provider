# Code Simplification & Refactoring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce code complexity across packages by eliminating duplication, simplifying abstractions, and improving maintainability while preserving functionality and type safety.

**Architecture:** Apply the DRY principle to consolidate repeated patterns: (1) Create a generic registry factory to eliminate duplication across 5 model registry files; (2) Extract duplicate compartment ID retrieval logic into a shared utility; (3) Modernize error constructors to remove backward compatibility bloat; (4) Simplify role mapping with `as const` patterns; (5) Clean up public API exports; (6) Consolidate test setup boilerplate; (7) Create base config types for inheritance.

**Tech Stack:** TypeScript, Jest, pnpm monorepo, existing OCI SDK patterns

---

## Phase 1: Registry Pattern Consolidation (High Impact: -80 lines)

### Task 1: Create Generic Registry Factory

**Files:**
- Create: `packages/oci-genai-provider/src/shared/registries.ts`
- Test: `packages/oci-genai-provider/src/shared/__tests__/registries.test.ts`

**Step 1: Write the failing test**

Create: `packages/oci-genai-provider/src/shared/__tests__/registries.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';
import { createRegistry } from '../registries';

describe('createRegistry', () => {
  interface TestModel {
    id: string;
    name: string;
    category: 'test' | 'prod';
  }

  const testCatalog: TestModel[] = [
    { id: 'model-1', name: 'Model One', category: 'test' },
    { id: 'model-2', name: 'Model Two', category: 'prod' },
    { id: 'model-3', name: 'Model Three', category: 'test' },
  ];

  it('should create registry with isValid checker', () => {
    const registry = createRegistry(testCatalog);
    expect(registry.isValid('model-1')).toBe(true);
    expect(registry.isValid('model-999')).toBe(false);
  });

  it('should provide getMetadata lookup', () => {
    const registry = createRegistry(testCatalog);
    const meta = registry.getMetadata('model-1');
    expect(meta).toEqual({ id: 'model-1', name: 'Model One', category: 'test' });
  });

  it('should return undefined for missing metadata', () => {
    const registry = createRegistry(testCatalog);
    expect(registry.getMetadata('invalid')).toBeUndefined();
  });

  it('should provide getAll to list all items', () => {
    const registry = createRegistry(testCatalog);
    expect(registry.getAll()).toHaveLength(3);
  });

  it('should filter by property', () => {
    const registry = createRegistry(testCatalog);
    const testModels = registry.filterBy('category', 'test');
    expect(testModels).toHaveLength(2);
    expect(testModels.every(m => m.category === 'test')).toBe(true);
  });

  it('should validate and throw on invalid ID', () => {
    const registry = createRegistry(testCatalog, 'test model');
    expect(() => registry.validate('invalid')).toThrow('Invalid test model ID: invalid');
  });

  it('should return item on validate success', () => {
    const registry = createRegistry(testCatalog);
    const model = registry.validate('model-1');
    expect(model.id).toBe('model-1');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test packages/oci-genai-provider/src/shared/__tests__/registries.test.ts`
Expected: FAIL - "Cannot find module '../registries'"

**Step 3: Write minimal implementation**

Create: `packages/oci-genai-provider/src/shared/registries.ts`

```typescript
/**
 * Generic registry factory for managing collections of items
 * Eliminates duplicated registry patterns across model types
 */

export interface RegistryItem {
  id: string;
  [key: string]: any;
}

export interface Registry<T extends RegistryItem> {
  isValid(id: string): boolean;
  getMetadata(id: string): T | undefined;
  getAll(): T[];
  filterBy<K extends keyof T>(key: K, value: T[K]): T[];
  validate(id: string): T;
}

export function createRegistry<T extends RegistryItem>(
  catalog: T[],
  modelTypeName = 'model'
): Registry<T> {
  return {
    isValid(id: string): boolean {
      return catalog.some((item) => item.id === id);
    },

    getMetadata(id: string): T | undefined {
      return catalog.find((item) => item.id === id);
    },

    getAll(): T[] {
      return [...catalog];
    },

    filterBy<K extends keyof T>(key: K, value: T[K]): T[] {
      return catalog.filter((item) => item[key] === value);
    },

    validate(id: string): T {
      const item = catalog.find((item) => item.id === id);
      if (!item) {
        throw new Error(`Invalid ${modelTypeName} ID: ${id}`);
      }
      return item;
    },
  };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test packages/oci-genai-provider/src/shared/__tests__/registries.test.ts`
Expected: PASS - 7 tests passing

**Step 5: Commit**

```bash
git add packages/oci-genai-provider/src/shared/registries.ts packages/oci-genai-provider/src/shared/__tests__/registries.test.ts
git commit -m "refactor(registries): create generic registry factory pattern

Create reusable registry factory function to eliminate duplication
across language-models, embedding-models, speech-models, transcription-models,
and reranking-models registries.

Benefits:
- Single source of truth for validation logic
- Consistent filtering and lookup patterns
- Reduces ~80 lines of duplicated code across 5 files
- Type-safe generic implementation

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

### Task 2: Refactor Language Models Registry

**Files:**
- Modify: `packages/oci-genai-provider/src/language-models/registry.ts`
- Test: `packages/oci-genai-provider/src/language-models/__tests__/registry.test.ts`

**Step 1: Review current implementation**

Read: `packages/oci-genai-provider/src/language-models/registry.ts`

Expected: Find `isValidModelId`, `getModelMetadata`, `getAllModels`, `getModelsByFamily` functions

**Step 2: Update registry to use factory**

Modify: `packages/oci-genai-provider/src/language-models/registry.ts`

```typescript
import { createRegistry } from '../shared/registries';
import type { ModelMetadata } from './index';
import { MODEL_CATALOG } from './catalog';

const registry = createRegistry(MODEL_CATALOG, 'language model');

// Re-export factory methods with original names
export const isValidModelId = registry.isValid;
export const getModelMetadata = registry.getMetadata;
export const getAllModels = registry.getAll;

// Keep specialized methods that are truly unique
export function getModelsByFamily(family: ModelMetadata['family']): ModelMetadata[] {
  return MODEL_CATALOG.filter((m) => m.family === family);
}

// Add new validate function for type safety
export function validateModelId(modelId: string): ModelMetadata {
  return registry.validate(modelId);
}
```

**Step 3: Verify existing tests still pass**

Run: `pnpm test packages/oci-genai-provider/src/language-models/__tests__/registry.test.ts`
Expected: PASS - All existing registry tests still passing

**Step 4: Commit**

```bash
git add packages/oci-genai-provider/src/language-models/registry.ts
git commit -m "refactor(language-models): use generic registry factory

Replace duplicated registry logic in language-models/registry.ts
with generic factory pattern. Maintains 100% backward compatibility
while reducing code duplication.

Changes:
- Use createRegistry() factory for validation and lookup
- Keep getModelsByFamily() as specialized method
- Add validateModelId() for type-safe validation

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

### Task 3: Refactor Embedding Models Registry

**Files:**
- Modify: `packages/oci-genai-provider/src/embedding-models/registry.ts`

**Step 1: Update registry to use factory**

Modify: `packages/oci-genai-provider/src/embedding-models/registry.ts`

```typescript
import { createRegistry } from '../shared/registries';
import type { EmbeddingModelMetadata } from './index';
import { EMBEDDING_MODELS } from './catalog';

const registry = createRegistry(EMBEDDING_MODELS, 'embedding model');

export const isValidEmbeddingModelId = registry.isValid;
export const getEmbeddingModelMetadata = registry.getMetadata;
export const getAllEmbeddingModels = registry.getAll;

export function validateEmbeddingModelId(modelId: string): EmbeddingModelMetadata {
  return registry.validate(modelId);
}
```

**Step 2: Verify tests**

Run: `pnpm test packages/oci-genai-provider/src/embedding-models/__tests__/registry.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add packages/oci-genai-provider/src/embedding-models/registry.ts
git commit -m "refactor(embedding-models): use generic registry factory"
```

---

### Task 4: Refactor Speech Models Registry

**Files:**
- Modify: `packages/oci-genai-provider/src/speech-models/registry.ts`

**Step 1: Update registry to use factory**

Modify: `packages/oci-genai-provider/src/speech-models/registry.ts`

```typescript
import { createRegistry } from '../shared/registries';
import type { SpeechModelMetadata } from './index';
import { SPEECH_MODELS } from './catalog';

const registry = createRegistry(SPEECH_MODELS, 'speech model');

export const isValidSpeechModelId = registry.isValid;
export const getSpeechModelMetadata = registry.getMetadata;
export const getAllSpeechModels = registry.getAll;

export function validateSpeechModelId(modelId: string): SpeechModelMetadata {
  return registry.validate(modelId);
}
```

**Step 2: Verify tests and commit**

Run: `pnpm test packages/oci-genai-provider/src/speech-models/__tests__/registry.test.ts`
Expected: PASS

```bash
git add packages/oci-genai-provider/src/speech-models/registry.ts
git commit -m "refactor(speech-models): use generic registry factory"
```

---

### Task 5: Refactor Transcription Models Registry

**Files:**
- Modify: `packages/oci-genai-provider/src/transcription-models/registry.ts`

**Step 1: Update registry to use factory**

Modify: `packages/oci-genai-provider/src/transcription-models/registry.ts`

```typescript
import { createRegistry } from '../shared/registries';
import type { TranscriptionModelMetadata } from './index';
import { TRANSCRIPTION_MODELS } from './catalog';

const registry = createRegistry(TRANSCRIPTION_MODELS, 'transcription model');

export const isValidTranscriptionModelId = registry.isValid;
export const getTranscriptionModelMetadata = registry.getMetadata;
export const getAllTranscriptionModels = registry.getAll;

export function validateTranscriptionModelId(modelId: string): TranscriptionModelMetadata {
  return registry.validate(modelId);
}
```

**Step 2: Verify tests and commit**

Run: `pnpm test packages/oci-genai-provider/src/transcription-models/__tests__/registry.test.ts`
Expected: PASS

```bash
git add packages/oci-genai-provider/src/transcription-models/registry.ts
git commit -m "refactor(transcription-models): use generic registry factory"
```

---

### Task 6: Refactor Reranking Models Registry

**Files:**
- Modify: `packages/oci-genai-provider/src/reranking-models/registry.ts`

**Step 1: Update registry to use factory**

Modify: `packages/oci-genai-provider/src/reranking-models/registry.ts`

```typescript
import { createRegistry } from '../shared/registries';
import type { RerankingModelMetadata } from './index';
import { RERANKING_MODELS } from './catalog';

const registry = createRegistry(RERANKING_MODELS, 'reranking model');

export const isValidRerankingModelId = registry.isValid;
export const getRerankingModelMetadata = registry.getMetadata;
export const getAllRerankingModels = registry.getAll;

export function validateRerankingModelId(modelId: string): RerankingModelMetadata {
  return registry.validate(modelId);
}
```

**Step 2: Verify tests and commit**

Run: `pnpm test packages/oci-genai-provider/src/reranking-models/__tests__/registry.test.ts`
Expected: PASS

```bash
git add packages/oci-genai-provider/src/reranking-models/registry.ts
git commit -m "refactor(reranking-models): use generic registry factory"
```

---

## Phase 2: Compartment ID Utility Consolidation (High Priority: -10 lines)

### Task 7: Create Shared Configuration Utility

**Files:**
- Create: `packages/oci-genai-provider/src/shared/config.ts`
- Test: `packages/oci-genai-provider/src/shared/__tests__/config.test.ts`

**Step 1: Write the failing test**

Create: `packages/oci-genai-provider/src/shared/__tests__/config.test.ts`

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { getCompartmentId } from '../config';

describe('getCompartmentId', () => {
  beforeEach(() => {
    delete process.env.OCI_COMPARTMENT_ID;
  });

  it('should return config compartmentId if provided', () => {
    const config = { compartmentId: 'ocid1.compartment.oc1..test' };
    expect(getCompartmentId(config)).toBe('ocid1.compartment.oc1..test');
  });

  it('should fallback to environment variable', () => {
    process.env.OCI_COMPARTMENT_ID = 'ocid1.compartment.oc1..env';
    const config = {};
    expect(getCompartmentId(config)).toBe('ocid1.compartment.oc1..env');
  });

  it('should prefer config over environment variable', () => {
    process.env.OCI_COMPARTMENT_ID = 'ocid1.compartment.oc1..env';
    const config = { compartmentId: 'ocid1.compartment.oc1..config' };
    expect(getCompartmentId(config)).toBe('ocid1.compartment.oc1..config');
  });

  it('should throw error if no compartmentId available', () => {
    const config = {};
    expect(() => getCompartmentId(config)).toThrow(
      'OCI compartment ID must be provided'
    );
  });

  it('should support custom environment variable name', () => {
    process.env.CUSTOM_COMPARTMENT = 'ocid1.compartment.oc1..custom';
    const config = {};
    expect(getCompartmentId(config, 'CUSTOM_COMPARTMENT')).toBe(
      'ocid1.compartment.oc1..custom'
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test packages/oci-genai-provider/src/shared/__tests__/config.test.ts`
Expected: FAIL - "Cannot find module '../config'"

**Step 3: Write minimal implementation**

Create: `packages/oci-genai-provider/src/shared/config.ts`

```typescript
/**
 * Shared configuration utilities for OCI services
 */

export interface ConfigWithCompartment {
  compartmentId?: string;
}

/**
 * Extract compartment ID from config or environment variable
 * @throws Error if compartment ID is not available
 */
export function getCompartmentId(
  config: ConfigWithCompartment,
  envVar = 'OCI_COMPARTMENT_ID'
): string {
  const compartmentId = config.compartmentId || process.env[envVar];

  if (!compartmentId) {
    throw new Error(
      `OCI compartment ID must be provided via config or ${envVar} environment variable`
    );
  }

  return compartmentId;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test packages/oci-genai-provider/src/shared/__tests__/config.test.ts`
Expected: PASS - 5 tests passing

**Step 5: Commit**

```bash
git add packages/oci-genai-provider/src/shared/config.ts packages/oci-genai-provider/src/shared/__tests__/config.test.ts
git commit -m "refactor(shared): extract compartment ID utility

Create shared getCompartmentId() utility to eliminate duplication
between oci-openai-compatible and oci-genai-provider packages.

Benefits:
- Single source of truth for config resolution
- Supports custom environment variable names
- Type-safe configuration interface
- Reduces code duplication

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

### Task 8: Update oci-genai-provider to Use Shared Utility

**Files:**
- Modify: `packages/oci-genai-provider/src/auth/index.ts`

**Step 1: Replace getCompartmentId implementation**

Modify: `packages/oci-genai-provider/src/auth/index.ts`

Replace the current `getCompartmentId` function with:

```typescript
export { getCompartmentId } from '../shared/config';
```

Or if there's additional logic, simplify to:

```typescript
import { getCompartmentId as getCompartmentIdInternal } from '../shared/config';

export function getCompartmentId(config: OCIConfig): string {
  return getCompartmentIdInternal(config);
}
```

**Step 2: Verify tests**

Run: `pnpm test packages/oci-genai-provider/src/auth/__tests__/`
Expected: PASS - All auth tests still passing

**Step 3: Commit**

```bash
git add packages/oci-genai-provider/src/auth/index.ts
git commit -m "refactor(auth): use shared getCompartmentId utility

Replace duplicated getCompartmentId logic with shared utility
from packages/oci-genai-provider/src/shared/config.ts.

Maintains backward compatibility while eliminating duplication.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

### Task 9: Update oci-openai-compatible to Use Shared Utility

**Files:**
- Modify: `packages/oci-openai-compatible/src/auth.ts`

**Step 1: Replace getCompartmentId implementation**

Modify: `packages/oci-openai-compatible/src/auth.ts`

```typescript
import { getCompartmentId as getCompartmentIdShared } from '@acedergren/oci-genai-provider/shared/config';

export function getCompartmentId(config: OCIOpenAIConfig): string {
  return getCompartmentIdShared(config);
}

export function createOCIAuthHeaders(config: OCIOpenAIConfig): Record<string, string> {
  // ... existing implementation, but now uses shared getCompartmentId
  const compartmentId = getCompartmentId(config);
  // ...
}
```

**Step 2: Verify tests**

Run: `pnpm test packages/oci-openai-compatible/src/__tests__/auth.test.ts`
Expected: PASS - All auth tests still passing

**Step 3: Commit**

```bash
git add packages/oci-openai-compatible/src/auth.ts
git commit -m "refactor(oci-openai-compatible): use shared getCompartmentId

Replace local getCompartmentId with shared utility from
packages/oci-genai-provider. Reduces duplication between packages.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Phase 3: Public Export Cleanup (Quick Win: -3 lines)

### Task 10: Remove Internal Utilities from Public API

**Files:**
- Modify: `packages/oci-openai-compatible/src/index.ts`

**Step 1: Review current exports**

Read: `packages/oci-openai-compatible/src/index.ts`

Expected: Find exports of `getBaseURL`, `createOCIAuthHeaders`, `getCompartmentId`

**Step 2: Remove internal utility exports**

Modify: `packages/oci-openai-compatible/src/index.ts`

Remove these lines:

```typescript
export { getBaseURL } from './endpoint';
export { createOCIAuthHeaders, getCompartmentId } from './auth';
```

Keep only:

```typescript
export { createOCIOpenAI } from './client';
export type {
  OCIOpenAIConfig,
  OCIRegion,
  OCIAuthMethod,
  OCIModelId,
} from './types';
export { REGION_ENDPOINTS, OCI_OPENAI_API_VERSION } from './types';

// Default instance
export const ociOpenAI = createOCIOpenAI({ ... });
export default ociOpenAI;
```

**Step 3: Verify tests**

Run: `pnpm test packages/oci-openai-compatible/src/__tests__/index.test.ts`
Expected: PASS - All index tests still passing (they test public API)

**Step 4: Commit**

```bash
git add packages/oci-openai-compatible/src/index.ts
git commit -m "refactor(oci-openai-compatible): remove internal utilities from public API

Remove exports of internal functions (getBaseURL, createOCIAuthHeaders,
getCompartmentId) that shouldn't be part of public API surface.

Benefits:
- Cleaner public API
- Less documentation burden
- Easier to maintain backward compatibility
- Reduces surface area for breaking changes

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Phase 4: Error Constructor Modernization (Medium: -15 lines)

### Task 11: Modernize OCIGenAIError Constructor

**Files:**
- Modify: `packages/oci-genai-provider/src/shared/errors/index.ts`

**Step 1: Review current implementation**

Read: `packages/oci-genai-provider/src/shared/errors/index.ts`

Expected: Find `OCIGenAIError` with overloaded constructor parameters

**Step 2: Write test for new constructor pattern**

Create test in: `packages/oci-genai-provider/src/shared/errors/__tests__/errors.test.ts`

```typescript
it('should construct with options object pattern', () => {
  const cause = new Error('Network error');
  const error = new OCIGenAIError('Request failed', {
    cause,
    retryable: true,
    statusCode: 429,
  });

  expect(error.message).toBe('Request failed');
  expect(error.cause).toBe(cause);
  expect(error.retryable).toBe(true);
  expect(error.statusCode).toBe(429);
});

it('should work with empty options', () => {
  const error = new OCIGenAIError('Simple error');
  expect(error.retryable).toBe(false);
  expect(error.statusCode).toBeUndefined();
});
```

**Step 3: Modernize constructor implementation**

Modify: `packages/oci-genai-provider/src/shared/errors/index.ts`

```typescript
export interface OCIErrorOptions {
  cause?: Error;
  retryable?: boolean;
  statusCode?: number;
}

export class OCIGenAIError extends Error {
  override readonly name = 'OCIGenAIError';
  readonly cause?: Error;
  readonly retryable: boolean;
  readonly statusCode?: number;

  constructor(message: string, options: OCIErrorOptions = {}) {
    super(message);
    this.cause = options.cause;
    this.retryable = options.retryable ?? false;
    this.statusCode = options.statusCode;

    // Maintain stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class RateLimitError extends OCIGenAIError {
  override readonly name = 'RateLimitError';
  readonly retryAfterMs?: number;

  constructor(message: string, options: OCIErrorOptions & { retryAfterMs?: number } = {}) {
    super(message, { ...options, retryable: true });
    this.retryAfterMs = options.retryAfterMs;
  }
}

export class NetworkError extends OCIGenAIError {
  override readonly name = 'NetworkError';

  constructor(message: string, options: OCIErrorOptions = {}) {
    super(message, { ...options, retryable: true });
  }
}

export class AuthenticationError extends OCIGenAIError {
  override readonly name = 'AuthenticationError';

  constructor(message: string, options: OCIErrorOptions = {}) {
    super(message, { ...options, retryable: false });
  }
}
```

**Step 4: Run full error tests**

Run: `pnpm test packages/oci-genai-provider/src/shared/errors/__tests__/errors.test.ts`
Expected: PASS - All error tests passing

**Step 5: Search for old constructor calls**

Run: `grep -r "new OCIGenAIError.*,.*,.*)" packages/oci-genai-provider/src --include="*.ts"`
Expected: Find any uses of old pattern (statusCode, retryable positional args)

**Step 6: Update any found calls to options pattern**

If old pattern found, update to:

```typescript
// Old: new OCIGenAIError('msg', 429, true)
// New:
new OCIGenAIError('msg', { statusCode: 429, retryable: true })
```

**Step 7: Run full test suite**

Run: `pnpm test packages/oci-genai-provider/`
Expected: PASS - All tests passing

**Step 8: Commit**

```bash
git add packages/oci-genai-provider/src/shared/errors/index.ts
git commit -m "refactor(errors): modernize error constructors to options pattern

Update OCIGenAIError and subclasses to use single options object
pattern instead of overloaded positional parameters.

Benefits:
- Simpler constructor signatures
- Better readability
- Easier to extend with new options
- Removes 15 lines of parameter handling code

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Phase 5: Role Mapping Simplification (Quick: -8 lines)

### Task 12: Simplify Role Mapping with as const

**Files:**
- Modify: `packages/oci-genai-provider/src/language-models/converters/messages.ts`

**Step 1: Review current implementation**

Read: `packages/oci-genai-provider/src/language-models/converters/messages.ts`

Expected: Find redundant `RoleMap` type definition

**Step 2: Write test for new implementation**

```typescript
it('should convert roles correctly with simplified mapping', () => {
  const message = {
    role: 'user' as const,
    content: [{ type: 'text' as const, text: 'Hello' }],
  };

  const converted = convertMessageRole(message.role);
  expect(converted).toBe('USER');
});

it('should handle all valid roles', () => {
  expect(convertMessageRole('user')).toBe('USER');
  expect(convertMessageRole('assistant')).toBe('ASSISTANT');
  expect(convertMessageRole('system')).toBe('SYSTEM');
});
```

**Step 3: Implement simplified role mapping**

Modify: `packages/oci-genai-provider/src/language-models/converters/messages.ts`

```typescript
// OLD: 15 lines with RoleMap type
// NEW:

const ROLE_MAP = {
  user: 'USER',
  assistant: 'ASSISTANT',
  system: 'SYSTEM',
} as const;

export type AIRole = keyof typeof ROLE_MAP;
export type OCIRole = typeof ROLE_MAP[AIRole];

export function convertMessageRole(role: AIRole): OCIRole {
  return ROLE_MAP[role];
}
```

**Step 4: Update converter function to use simplified version**

Modify message converter to use:

```typescript
export function convertToOCIMessages(prompt: LanguageModelV3Prompt): OCIMessage[] {
  return prompt.map((message) => ({
    role: convertMessageRole(message.role as AIRole),
    content: convertContent(message.content),
  }));
}
```

**Step 5: Run tests**

Run: `pnpm test packages/oci-genai-provider/src/language-models/__tests__/converters.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add packages/oci-genai-provider/src/language-models/converters/messages.ts
git commit -m "refactor(language-models): simplify role mapping with as const

Replace verbose RoleMap type with const assertion pattern.

Changes:
- Remove redundant RoleMap interface
- Use 'as const' for type-safe mapping
- Derive types from mapping with typeof
- Simplify converter function

Benefits:
- 8 fewer lines of code
- Single source of truth for roles
- Same type safety with less boilerplate

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Phase 6: Configuration Type Consolidation (Medium: -20 lines)

### Task 13: Create Base OCI Configuration Type

**Files:**
- Create: `packages/oci-genai-provider/src/shared/config-types.ts`
- Modify: `packages/oci-genai-provider/src/types.ts`
- Modify: `packages/oci-openai-compatible/src/types.ts`

**Step 1: Write test for base config types**

Create: `packages/oci-genai-provider/src/shared/__tests__/config-types.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';
import type { BaseOCIConfig, OCIConfig } from '../config-types';
import type { OCIOpenAIConfig } from '@acedergren/oci-openai-compatible';

describe('Config Types', () => {
  it('should allow BaseOCIConfig in both variants', () => {
    const baseConfig: BaseOCIConfig = {
      compartmentId: 'ocid1.compartment.oc1..test',
      endpoint: 'https://custom.endpoint',
      auth: 'api_key',
    };

    expect(baseConfig.compartmentId).toBeDefined();
  });

  it('should extend OCIConfig with provider specifics', () => {
    const config: OCIConfig = {
      compartmentId: 'ocid1.compartment.oc1..test',
      region: 'us-ashburn-1',
      profile: 'DEFAULT',
      configPath: '~/.oci/config',
    };

    expect(config.region).toBeDefined();
    expect(config.profile).toBeDefined();
  });

  it('should extend OCIOpenAIConfig with API key specifics', () => {
    const config: OCIOpenAIConfig = {
      compartmentId: 'ocid1.compartment.oc1..test',
      region: 'us-ashburn-1',
      apiKey: 'test-key',
    };

    expect(config.apiKey).toBeDefined();
  });
});
```

**Step 2: Create base config types**

Create: `packages/oci-genai-provider/src/shared/config-types.ts`

```typescript
/**
 * Base configuration shared across OCI packages
 */

export type OCIAuthMethod = 'api_key' | 'instance_principal' | 'resource_principal';

export interface BaseOCIConfig {
  /** OCI compartment OCID for authorization */
  compartmentId?: string;

  /** Custom endpoint URL for testing or dedicated clusters */
  endpoint?: string;

  /** Authentication method to use */
  auth?: OCIAuthMethod;
}

export interface RequestOptions {
  timeout?: number;
  retries?: number;
  retryDelayMs?: number;
}
```

**Step 2: Update oci-genai-provider types**

Modify: `packages/oci-genai-provider/src/types.ts`

```typescript
import type { BaseOCIConfig, RequestOptions } from './shared/config-types';

export type OCIAuthMethod = 'api_key' | 'instance_principal' | 'resource_principal';

export interface OCIConfig extends BaseOCIConfig {
  /** OCI region (e.g., 'us-ashburn-1') */
  region?: string;

  /** OCI profile name in ~/.oci/config */
  profile?: string;

  /** Path to OCI config file */
  configPath?: string;

  /** Request options (timeout, retries, etc.) */
  requestOptions?: RequestOptions;
}

// ... rest of types
```

**Step 3: Update oci-openai-compatible types**

Modify: `packages/oci-openai-compatible/src/types.ts`

```typescript
import type { BaseOCIConfig, OCIAuthMethod } from '@acedergren/oci-genai-provider/shared/config-types';

export type { OCIAuthMethod } from '@acedergren/oci-genai-provider/shared/config-types';

export type OCIRegion = 'us-ashburn-1' | 'us-chicago-1' | 'us-phoenix-1' | 'eu-frankfurt-1' | 'ap-hyderabad-1' | 'ap-osaka-1';

export interface OCIOpenAIConfig extends BaseOCIConfig {
  /** OCI region (OpenAI-compatible endpoints only) */
  region?: OCIRegion;

  /** OCI API key for authentication */
  apiKey?: string;
}

// ... rest of types
```

**Step 4: Run all tests**

Run: `pnpm test`
Expected: PASS - All tests still passing

**Step 5: Commit**

```bash
git add packages/oci-genai-provider/src/shared/config-types.ts packages/oci-genai-provider/src/types.ts packages/oci-openai-compatible/src/types.ts
git commit -m "refactor(config): consolidate base configuration types

Create shared BaseOCIConfig interface for common OCI configuration.
Both oci-genai-provider and oci-openai-compatible extend this base.

Benefits:
- Single source of truth for shared config options
- Type inheritance reduces duplication
- Easier to add new shared config options
- Clearer separation of package-specific vs shared config

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Phase 7: Test Setup Simplification (Optional: -100 lines)

### Task 14: Create Reusable Test Setup Helper

**Files:**
- Create: `packages/oci-genai-provider/src/__tests__/setup-mocks.ts`
- Modify: Test files to use helper

**Step 1: Create test setup helper**

Create: `packages/oci-genai-provider/src/__tests__/setup-mocks.ts`

```typescript
/**
 * Reusable mock setup for OCI tests
 * Reduces 20+ lines of duplicate mock code across test files
 */

import { jest } from '@jest/globals';

export interface MockOCISetup {
  createAuthProvider: jest.Mock;
  getRegion: jest.Mock;
  getCompartmentId: jest.Mock;
  makeRequest: jest.Mock;
}

export function setupOCIMocks(): MockOCISetup {
  const mocks = {
    createAuthProvider: jest.fn(),
    getRegion: jest.fn(),
    getCompartmentId: jest.fn(),
    makeRequest: jest.fn(),
  };

  // Mock auth module
  jest.mock('../../auth/index.js', () => ({
    createAuthProvider: mocks.createAuthProvider,
    getRegion: mocks.getRegion,
    getCompartmentId: mocks.getCompartmentId,
  }));

  // Mock request module
  jest.mock('../../shared/request.js', () => ({
    makeRequest: mocks.makeRequest,
  }));

  return mocks;
}

export function setupDefaultMocks(): {
  mocks: MockOCISetup;
  resetMocks: () => void;
} {
  const mocks = setupOCIMocks();

  // Set default return values
  mocks.getCompartmentId.mockReturnValue('ocid1.compartment.oc1..test');
  mocks.getRegion.mockReturnValue('us-ashburn-1');
  mocks.createAuthProvider.mockResolvedValue({
    // auth provider stub
  });

  return {
    mocks,
    resetMocks: () => {
      jest.clearAllMocks();
    },
  };
}
```

**Step 2: Identify test files using manual mock setup**

Run: `grep -l "jest.mock.*auth" packages/oci-genai-provider/src/**/__tests__/*.test.ts`

Expected: Find 5-10 test files with repetitive mock setup

**Step 3: Update first test file**

Modify: First identified test file

Replace mock setup section with:

```typescript
import { setupDefaultMocks } from '../setup-mocks';

const { mocks, resetMocks } = setupDefaultMocks();

beforeEach(() => {
  resetMocks();
});
```

**Step 4: Run test to verify**

Run: `pnpm test path/to/test.test.ts`
Expected: PASS

**Step 5: Update remaining test files**

Repeat steps 3-4 for remaining test files (one commit per file to keep diffs clean)

**Step 6: Final commit**

```bash
git add packages/oci-genai-provider/src/__tests__/setup-mocks.ts
git commit -m "refactor(tests): create reusable mock setup helper

Extract common mock setup pattern into setupOCIMocks() and
setupDefaultMocks() helpers to eliminate duplication across
5+ test files.

Benefits:
- DRY principle: single source of truth for test mocks
- Easier to update mock setup globally
- Reduces ~100 lines of boilerplate across test files
- Clearer test intent (setup code → mock code)

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Verification Checklist

After all tasks complete:

- [ ] `pnpm test` — All tests passing (28+ tests in oci-openai-compatible, 121+ in oci-genai-provider)
- [ ] `pnpm type-check` — No TypeScript errors
- [ ] `pnpm lint` — No linting issues
- [ ] `pnpm build` — All packages build successfully
- [ ] Git log shows 15 clean commits with clear messages
- [ ] No reduction in test coverage
- [ ] Code review shows >40% reduction in duplication

## Summary of Changes

| Phase | Changes | Files | Lines Saved | Breaking |
|-------|---------|-------|------------|----------|
| 1 | Registry consolidation | 6 registry files | ~80 | No |
| 2 | Config utilities | 3 files | ~10 | No |
| 3 | API exports | 1 file | ~3 | Minor¹ |
| 4 | Error constructors | 1 file | ~15 | Yes² |
| 5 | Role mapping | 1 file | ~8 | No |
| 6 | Config types | 3 files | ~20 | No |
| 7 | Test setup | 7 test files | ~100 | No |
| **Total** | — | 22 files | ~236 | — |

¹ Only affects undocumented internal utilities
² Consider version bump (v1.0.0 → v2.0.0) for breaking error constructor changes
