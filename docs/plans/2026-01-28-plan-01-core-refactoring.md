# Plan 1: Core Provider Refactoring

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the provider to implement ProviderV3 interface with proper factory pattern, enabling support for multiple model types.

**Architecture:** Refactor the existing language-model-only provider into a ProviderV3-compliant structure with a provider class, factory function, and model-specific settings interfaces. Reorganize code into language-models/ folder and shared/ utilities.

**Tech Stack:** TypeScript, @ai-sdk/provider@^3.0.5, Jest, OCI SDK

---

## Dependencies

**Required:**

- `@ai-sdk/provider`: ^3.0.5
- `oci-common`: ^2.94.0
- `oci-generativeaiinference`: ^2.94.0

**Update package.json:**

```json
{
  "dependencies": {
    "@ai-sdk/provider": "^3.0.5",
    "@ai-sdk/provider-utils": "^4.0.10"
  }
}
```

---

## Task 1: Update Dependencies

**Files:**

- Modify: `packages/oci-genai-provider/package.json`

**Step 1: Update @ai-sdk/provider to latest**

```bash
cd packages/oci-genai-provider
pnpm add @ai-sdk/provider@^3.0.5
```

**Step 2: Verify installation**

Run: `pnpm list @ai-sdk/provider`
Expected: `@ai-sdk/provider 3.0.5`

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: update @ai-sdk/provider to 3.0.5"
```

---

## Task 2: Create Provider Types

**Files:**

- Modify: `packages/oci-genai-provider/src/types.ts`

**Step 1: Write test for OCIBaseConfig**

Create: `packages/oci-genai-provider/src/__tests__/types.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';
import type { OCIBaseConfig, OCILanguageModelSettings } from '../types';

describe('OCIBaseConfig', () => {
  it('should accept all optional configuration fields', () => {
    const config: OCIBaseConfig = {
      region: 'eu-frankfurt-1',
      profile: 'FRANKFURT',
      auth: 'config_file',
      compartmentId: 'ocid1.compartment.oc1..test',
      endpoint: 'https://test.com',
      configPath: '/custom/path/config',
    };

    expect(config.region).toBe('eu-frankfurt-1');
    expect(config.auth).toBe('config_file');
  });

  it('should allow empty config', () => {
    const config: OCIBaseConfig = {};
    expect(config).toBeDefined();
  });
});

describe('OCILanguageModelSettings', () => {
  it('should extend OCIBaseConfig with requestOptions', () => {
    const settings: OCILanguageModelSettings = {
      region: 'eu-stockholm-1',
      requestOptions: {
        timeoutMs: 60000,
        retry: {
          enabled: true,
          maxRetries: 5,
        },
      },
    };

    expect(settings.region).toBe('eu-stockholm-1');
    expect(settings.requestOptions?.timeoutMs).toBe(60000);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/__tests__/types.test.ts`
Expected: FAIL - "Cannot find module '../types'"

**Step 3: Add new type definitions to types.ts**

Add to `packages/oci-genai-provider/src/types.ts`:

```typescript
/**
 * Base configuration shared across all OCI model types
 */
export interface OCIBaseConfig {
  /** OCI region (e.g., 'eu-frankfurt-1') */
  region?: string;
  /** OCI config profile name */
  profile?: string;
  /** Authentication method */
  auth?: 'config_file' | 'instance_principal' | 'resource_principal';
  /** OCI compartment OCID */
  compartmentId?: string;
  /** Custom endpoint URL (for testing or dedicated clusters) */
  endpoint?: string;
  /** Path to OCI config file */
  configPath?: string;
}

/**
 * Settings specific to language models
 */
export interface OCILanguageModelSettings extends OCIBaseConfig {
  /** Request options for timeout and retry behavior */
  requestOptions?: RequestOptions;
}

/**
 * Settings for embedding models
 */
export interface OCIEmbeddingSettings extends OCIBaseConfig {
  /** Embedding dimensions (384 for light, 1024 for standard) */
  dimensions?: 384 | 1024;
  /** How to truncate input text if it exceeds model limits */
  truncate?: 'START' | 'END' | 'NONE';
  /** Input type optimization */
  inputType?: 'QUERY' | 'DOCUMENT';
}

/**
 * Settings for speech models (TTS)
 */
export interface OCISpeechSettings extends OCIBaseConfig {
  /** Voice ID */
  voice?: string;
  /** Speech speed multiplier (0.5 to 2.0) */
  speed?: number;
  /** Audio output format */
  format?: 'mp3' | 'wav' | 'pcm';
}

/**
 * Settings for transcription models (STT)
 */
export interface OCITranscriptionSettings extends OCIBaseConfig {
  /** Language code (e.g., 'en', 'es', 'de') */
  language?: string;
  /** Transcription model to use */
  model?: 'standard' | 'whisper';
  /** Custom vocabulary words */
  vocabulary?: string[];
}

/**
 * Settings for reranking models
 */
export interface OCIRerankingSettings extends OCIBaseConfig {
  /** Return only top N results */
  topN?: number;
  /** Include document text in response */
  returnDocuments?: boolean;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test src/__tests__/types.test.ts`
Expected: PASS - All tests passing

**Step 5: Commit**

```bash
git add src/types.ts src/__tests__/types.test.ts
git commit -m "feat: add model-specific settings types for ProviderV3"
```

---

## Task 3: Create OCIProvider Class

**Files:**

- Create: `packages/oci-genai-provider/src/provider.ts`
- Create: `packages/oci-genai-provider/src/__tests__/provider.test.ts`

**Step 1: Write test for OCIProvider class**

Create: `packages/oci-genai-provider/src/__tests__/provider.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';
import { NoSuchModelError } from '@ai-sdk/provider';
import { OCIProvider } from '../provider';

describe('OCIProvider', () => {
  it('should have specificationVersion v3', () => {
    const provider = new OCIProvider();
    expect(provider.specificationVersion).toBe('v3');
  });

  it('should create language model', () => {
    const provider = new OCIProvider({ region: 'eu-frankfurt-1' });
    const model = provider.languageModel('cohere.command-r-plus');

    expect(model).toBeDefined();
    expect(model.provider).toBe('oci-genai');
    expect(model.modelId).toBe('cohere.command-r-plus');
  });

  it('should throw NoSuchModelError for image models', () => {
    const provider = new OCIProvider();

    expect(() => provider.imageModel('dalle-3')).toThrow(NoSuchModelError);
  });

  it('should pass config to language models', () => {
    const provider = new OCIProvider({
      region: 'eu-stockholm-1',
      compartmentId: 'ocid1.compartment.test',
    });

    const model = provider.languageModel('meta.llama-3.3-70b');
    expect(model).toBeDefined();
  });

  it('should merge provider config with model-specific settings', () => {
    const provider = new OCIProvider({ region: 'eu-frankfurt-1' });
    const model = provider.languageModel('cohere.command-r-08-2024', {
      region: 'us-ashburn-1', // Override
      requestOptions: { timeoutMs: 60000 },
    });

    expect(model).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/__tests__/provider.test.ts`
Expected: FAIL - "Cannot find module '../provider'"

**Step 3: Implement OCIProvider class**

Create: `packages/oci-genai-provider/src/provider.ts`

```typescript
import {
  ProviderV3,
  LanguageModelV3,
  EmbeddingModelV3,
  ImageModelV3,
  TranscriptionModelV3,
  SpeechModelV3,
  RerankingModelV3,
  NoSuchModelError,
} from '@ai-sdk/provider';
import { OCILanguageModel } from './language-models/OCILanguageModel';
import type {
  OCIBaseConfig,
  OCILanguageModelSettings,
  OCIEmbeddingSettings,
  OCISpeechSettings,
  OCITranscriptionSettings,
  OCIRerankingSettings,
} from './types';

/**
 * OCI Provider implementing ProviderV3 interface
 * Supports language models, embeddings, speech, transcription, and reranking
 */
export class OCIProvider implements ProviderV3 {
  readonly specificationVersion = 'v3' as const;

  constructor(private config: OCIBaseConfig = {}) {}

  /**
   * Create a language model instance
   */
  languageModel(modelId: string, settings?: OCILanguageModelSettings): LanguageModelV3 {
    const mergedConfig = { ...this.config, ...settings };
    return new OCILanguageModel(modelId, mergedConfig);
  }

  /**
   * Create an embedding model instance
   * @throws {NoSuchModelError} Not yet implemented
   */
  embeddingModel(modelId: string, settings?: OCIEmbeddingSettings): EmbeddingModelV3 {
    throw new NoSuchModelError({
      modelId,
      modelType: 'embeddingModel',
      message: 'Embedding models not yet implemented. Coming in Plan 2.',
    });
  }

  /**
   * Image generation is not supported by OCI
   * @throws {NoSuchModelError} Always throws - no OCI image generation service
   */
  imageModel(modelId: string): ImageModelV3 {
    throw new NoSuchModelError({
      modelId,
      modelType: 'imageModel',
      message: 'OCI does not provide image generation models',
    });
  }

  /**
   * Create a transcription model instance (STT)
   * @throws {NoSuchModelError} Not yet implemented
   */
  transcriptionModel(modelId: string, settings?: OCITranscriptionSettings): TranscriptionModelV3 {
    throw new NoSuchModelError({
      modelId,
      modelType: 'transcriptionModel',
      message: 'Transcription models not yet implemented. Coming in Plan 4.',
    });
  }

  /**
   * Create a speech model instance (TTS)
   * @throws {NoSuchModelError} Not yet implemented
   */
  speechModel(modelId: string, settings?: OCISpeechSettings): SpeechModelV3 {
    throw new NoSuchModelError({
      modelId,
      modelType: 'speechModel',
      message: 'Speech models not yet implemented. Coming in Plan 3.',
    });
  }

  /**
   * Create a reranking model instance
   * @throws {NoSuchModelError} Not yet implemented
   */
  rerankingModel(modelId: string, settings?: OCIRerankingSettings): RerankingModelV3 {
    throw new NoSuchModelError({
      modelId,
      modelType: 'rerankingModel',
      message: 'Reranking models not yet implemented. Coming in Plan 5.',
    });
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test src/__tests__/provider.test.ts`
Expected: PASS - All tests passing

**Step 5: Commit**

```bash
git add src/provider.ts src/__tests__/provider.test.ts
git commit -m "feat: implement OCIProvider class with ProviderV3 interface"
```

---

## Task 4: Reorganize Language Models

**Files:**

- Rename: `src/models/` → `src/language-models/`
- Update: All import paths

**Step 1: Create language-models directory and move files**

```bash
cd packages/oci-genai-provider
mkdir -p src/language-models
git mv src/models/* src/language-models/
rmdir src/models
```

**Step 2: Update imports in OCILanguageModel**

Modify: `packages/oci-genai-provider/src/language-models/OCILanguageModel.ts`

Find and replace:

- `from '../converters/` → `from './converters/`
- `from '../streaming/` → `from '../shared/streaming/`
- `from '../errors/` → `from '../shared/errors/`
- `from '../utils/` → `from '../shared/utils/`

**Step 3: Run tests to verify nothing broke**

Run: `pnpm test`
Expected: FAIL - Import errors for shared utilities

**Step 4: Move shared utilities**

```bash
mkdir -p src/shared
git mv src/streaming src/shared/
git mv src/errors src/shared/
git mv src/utils src/shared/
```

**Step 5: Update all import paths**

In `src/language-models/OCILanguageModel.ts`, update imports:

```typescript
import { parseSSEStream } from '../shared/streaming/sse-parser';
import { handleOCIError, isRetryableError } from '../shared/errors';
import { withRetry } from '../shared/utils/retry';
import { withTimeout } from '../shared/utils/timeout';
```

**Step 6: Update auth imports**

In `src/language-models/OCILanguageModel.ts`:

```typescript
import { createAuthProvider, getCompartmentId, getRegion } from '../auth';
```

**Step 7: Run all tests**

Run: `pnpm test`
Expected: PASS - All tests passing with new structure

**Step 8: Commit**

```bash
git add -A
git commit -m "refactor: reorganize into language-models/ and shared/ folders"
```

---

## Task 5: Update Provider Factory and Exports

**Files:**

- Modify: `packages/oci-genai-provider/src/index.ts`

**Step 1: Write test for new factory pattern**

Add to `packages/oci-genai-provider/src/__tests__/provider.test.ts`:

```typescript
import { createOCI, oci } from '../index';

describe('createOCI factory', () => {
  it('should create provider with custom config', () => {
    const provider = createOCI({
      region: 'us-ashburn-1',
      compartmentId: 'ocid1.test',
    });

    expect(provider).toBeInstanceOf(OCIProvider);
    expect(provider.specificationVersion).toBe('v3');
  });

  it('should create provider with no config', () => {
    const provider = createOCI();
    expect(provider).toBeInstanceOf(OCIProvider);
  });
});

describe('oci default instance', () => {
  it('should export default provider instance', () => {
    expect(oci).toBeInstanceOf(OCIProvider);
  });

  it('should create language models from default instance', () => {
    const model = oci.languageModel('cohere.command-r-08-2024');
    expect(model).toBeDefined();
    expect(model.modelId).toBe('cohere.command-r-08-2024');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/__tests__/provider.test.ts`
Expected: FAIL - "createOCI is not exported"

**Step 3: Implement new index.ts exports**

Replace `packages/oci-genai-provider/src/index.ts`:

````typescript
/**
 * OCI Generative AI Provider for Vercel AI SDK
 *
 * Complete ProviderV3 implementation supporting:
 * - Language Models (16+ models)
 * - Embeddings (coming in v0.2.0)
 * - Speech/Transcription (coming in v0.3.0)
 * - Reranking (coming in v0.4.0)
 */

export { OCIProvider } from './provider';
export type {
  OCIBaseConfig,
  OCILanguageModelSettings,
  OCIEmbeddingSettings,
  OCISpeechSettings,
  OCITranscriptionSettings,
  OCIRerankingSettings,
  OCIConfig,
  OCIAuthMethod,
  RequestOptions,
  ModelMetadata,
} from './types';

// Language model exports
export { OCILanguageModel } from './language-models/OCILanguageModel';
export {
  isValidModelId,
  getModelMetadata,
  getAllModels,
  getModelsByFamily,
} from './language-models/registry';

// Error exports
export {
  OCIGenAIError,
  NetworkError,
  RateLimitError,
  AuthenticationError,
  ModelNotFoundError,
} from './shared/errors';

/**
 * Create a new OCI provider instance with custom configuration
 *
 * @example
 * ```typescript
 * const provider = createOCI({
 *   region: 'eu-frankfurt-1',
 *   compartmentId: 'ocid1.compartment...',
 * });
 *
 * const model = provider.languageModel('cohere.command-r-plus');
 * ```
 */
export function createOCI(config: OCIBaseConfig = {}): OCIProvider {
  return new OCIProvider(config);
}

/**
 * Default OCI provider instance
 * Uses environment variables or OCI config file for configuration
 *
 * @example
 * ```typescript
 * import { oci } from '@acedergren/oci-genai-provider';
 *
 * const model = oci.languageModel('cohere.command-r-plus');
 * const embedding = oci.embeddingModel('cohere.embed-multilingual-v3.0');
 * ```
 */
export const oci = createOCI();
````

**Step 4: Run tests to verify they pass**

Run: `pnpm test`
Expected: PASS - All tests passing

**Step 5: Run type check**

Run: `pnpm type-check`
Expected: No TypeScript errors

**Step 6: Commit**

```bash
git add src/index.ts src/__tests__/provider.test.ts
git commit -m "feat: add createOCI factory and oci default instance"
```

---

## Task 6: Update Existing Examples

**Files:**

- Modify: `examples/chatbot-demo/src/routes/api/chat/+server.ts`
- Modify: `examples/nextjs-chatbot/app/api/chat/route.ts`

**Step 1: Update SvelteKit example**

In `examples/chatbot-demo/src/routes/api/chat/+server.ts`:

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';

export async function POST({ request }) {
  const { messages, modelId } = await request.json();

  const result = streamText({
    model: oci.languageModel(modelId),
    messages,
  });

  return result.toDataStreamResponse();
}
```

**Step 2: Update Next.js example**

In `examples/nextjs-chatbot/app/api/chat/route.ts`:

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages, modelId } = await req.json();

  const result = streamText({
    model: oci.languageModel(modelId),
    messages,
  });

  return result.toDataStreamResponse();
}
```

**Step 3: Test examples still work**

Run SvelteKit demo:

```bash
cd examples/chatbot-demo
pnpm dev
```

Test in browser - verify chat works

**Step 4: Commit**

```bash
git add examples/
git commit -m "refactor: update examples to use oci.languageModel()"
```

---

## Task 7: Build and Verify

**Step 1: Clean and rebuild**

```bash
cd packages/oci-genai-provider
rm -rf dist
pnpm build
```

Expected: Build completes successfully

**Step 2: Check generated types**

```bash
cat dist/index.d.ts | grep "export"
```

Expected: All exports present including `OCIProvider`, `createOCI`, `oci`

**Step 3: Run full test suite**

```bash
pnpm test
```

Expected: All tests pass

**Step 4: Run type checking**

```bash
pnpm type-check
```

Expected: No errors

**Step 5: Run linting**

```bash
pnpm lint
```

Expected: No violations

**Step 6: Final commit**

```bash
git add -A
git commit -m "chore: verify build and tests pass for Plan 1"
```

---

## Verification Checklist

After completing all tasks:

- [ ] `pnpm test` - All tests pass
- [ ] `pnpm type-check` - No TypeScript errors
- [ ] `pnpm build` - Build succeeds
- [ ] `pnpm lint` - No linting errors
- [ ] SvelteKit demo works with `oci.languageModel()`
- [ ] Next.js demo works with `oci.languageModel()`
- [ ] OCIProvider implements ProviderV3 interface
- [ ] Factory pattern `createOCI()` works
- [ ] Default instance `oci` exported
- [ ] Code reorganized into language-models/ and shared/
- [ ] All model-specific settings types defined

---

## Next Steps

**Plan 1 Complete!** 🎉

The provider now implements ProviderV3 interface. You can proceed with:

- **Plan 2**: Embedding Models Implementation
- **Plan 3**: Speech Models (TTS) Implementation
- **Plan 4**: Transcription Models (STT) Implementation
- **Plan 5**: Reranking Models Implementation

Plans 2-5 can run **in parallel** since they're independent of each other.
