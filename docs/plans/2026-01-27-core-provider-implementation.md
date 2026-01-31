# Core Provider Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the core OCI Generative AI provider for Vercel AI SDK v3 with streaming, tool calling, and authentication support.

**Package:** `@acedergren/oci-genai-provider`

**Architecture:** Factory pattern (`createOCI`) returns provider that creates language model instances. Each model implements `LanguageModelV3` interface with `doGenerate()` and `doStream()` methods. Authentication cascades from config → environment → defaults. SSE streaming parsed with eventsource-parser into async iterators.

**Tech Stack:** TypeScript 5.3, OCI SDK 2.73, Vercel AI SDK v3, eventsource-parser, tsup, Jest

---

## Current State

✅ **Test Suite Complete** - 121 tests passing
✅ **Monorepo Structure** - Package isolated in `packages/oci-genai-provider/`
✅ **Build System** - tsup configured for CJS + ESM
✅ **Dependencies** - package.json defined

**Remaining:** Implementation of actual provider code

---

## Task 1: Type Definitions

**Files:**

- Implement: `packages/oci-genai-provider/src/types.ts`

**Step 1: Define OCIConfig interface**

```typescript
export interface OCIConfig {
  /** OCI region (default: eu-frankfurt-1) */
  region?: string;

  /** Authentication method (default: config_file) */
  auth?: 'config_file' | 'instance_principal' | 'resource_principal';

  /** OCI config file path (default: ~/.oci/config) */
  configPath?: string;

  /** OCI config file profile (default: DEFAULT) */
  profile?: string;

  /** Compartment OCID */
  compartmentId?: string;

  /** Custom OCI GenAI endpoint */
  endpoint?: string;
}
```

**Step 2: Define model metadata types**

```typescript
export interface ModelCapabilities {
  streaming: boolean;
  tools: boolean;
  vision: boolean;
}

export interface ModelMetadata {
  id: string;
  name: string;
  family: 'grok' | 'llama' | 'cohere' | 'gemini';
  capabilities: ModelCapabilities;
  contextWindow: number;
  speed: 'very-fast' | 'fast' | 'medium' | 'slow';
}
```

**Step 3: Define provider interface**

```typescript
import type { LanguageModelV1 } from '@ai-sdk/provider';

export interface OCIProvider {
  provider: 'oci-genai';
  model: (modelId: string) => LanguageModelV1;
}
```

**Step 4: Run type tests**

```bash
cd packages/oci-genai-provider
npm test -- types.test.ts
```

Expected: Tests pass (types already tested)

**Step 5: Commit**

```bash
git add packages/oci-genai-provider/src/types.ts
git commit -m "feat(provider): implement type definitions

Add OCIConfig, ModelMetadata, and OCIProvider types.
Tests passing (3/121).

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Model Registry

**Files:**

- Create: `packages/oci-genai-provider/src/models/registry.ts`

**Step 1: Define model catalog**

Create array of all 16+ models with complete metadata:

```typescript
export const MODEL_CATALOG: ModelMetadata[] = [
  // Grok models
  {
    id: 'xai.grok-4',
    name: 'Grok 4 Maverick',
    family: 'grok',
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: 'very-fast',
  },
  // ... more models
];
```

**Step 2: Implement validation**

```typescript
export function isValidModelId(modelId: string): boolean {
  return MODEL_CATALOG.some((m) => m.id === modelId);
}

export function getModelMetadata(modelId: string): ModelMetadata | undefined {
  return MODEL_CATALOG.find((m) => m.id === modelId);
}
```

**Step 3: Implement filters**

```typescript
export function getAllModels(): ModelMetadata[] {
  return MODEL_CATALOG;
}

export function getModelsByFamily(family: ModelMetadata['family']): ModelMetadata[] {
  return MODEL_CATALOG.filter((m) => m.family === family);
}
```

**Step 4: Run registry tests**

```bash
npm test -- registry.test.ts
```

Expected: All 28 registry tests pass

**Step 5: Commit**

```bash
git add packages/oci-genai-provider/src/models/registry.ts
git commit -m "feat(provider): implement model registry

Add catalog of 16+ models with validation and filtering.
Tests passing (31/121).

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Authentication Module

**Files:**

- Implement: `packages/oci-genai-provider/src/auth/index.ts`

**Step 1: Implement createAuthProvider**

```typescript
import * as common from 'oci-common';
import type { OCIConfig } from '../types';

export async function createAuthProvider(
  config: OCIConfig
): Promise<common.AuthenticationDetailsProvider> {
  const authMethod = config.auth || 'config_file';

  switch (authMethod) {
    case 'config_file': {
      const configPath = config.configPath || undefined;
      const profile = config.profile || 'DEFAULT';
      return new common.ConfigFileAuthenticationDetailsProvider(configPath, profile);
    }

    case 'instance_principal': {
      const builder = new common.InstancePrincipalsAuthenticationDetailsProviderBuilder();
      return await builder.build();
    }

    case 'resource_principal': {
      return common.ResourcePrincipalAuthenticationDetailsProvider.builder();
    }

    default:
      throw new Error(`Unsupported authentication method: ${authMethod}`);
  }
}
```

**Step 2: Implement helper functions**

```typescript
export function getCompartmentId(config: OCIConfig): string {
  const compartmentId = config.compartmentId || process.env.OCI_COMPARTMENT_ID;

  if (!compartmentId) {
    throw new Error(
      'Compartment ID not found. Provide via config.compartmentId or OCI_COMPARTMENT_ID environment variable.'
    );
  }

  return compartmentId;
}

export function getRegion(config: OCIConfig): string {
  return config.region || process.env.OCI_REGION || 'eu-frankfurt-1';
}
```

**Step 3: Run auth tests**

```bash
npm test -- auth.test.ts
```

Expected: All 4 auth tests pass

**Step 4: Commit**

```bash
git add packages/oci-genai-provider/src/auth/
git commit -m "feat(provider): implement authentication module

Add support for config_file, instance_principal, resource_principal.
Tests passing (35/121).

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Message Conversion

**Files:**

- Create: `packages/oci-genai-provider/src/converters/messages.ts`

**Step 1: Implement AI SDK → OCI conversion**

```typescript
import type { LanguageModelV1Prompt } from '@ai-sdk/provider';

export function convertToOCIMessages(prompt: LanguageModelV1Prompt) {
  return prompt.map((message) => {
    const role = message.role.toUpperCase();

    const content = Array.isArray(message.content)
      ? message.content
          .filter((part) => part.type === 'text')
          .map((part) => ({ type: 'TEXT', text: part.text }))
      : [{ type: 'TEXT', text: message.content }];

    return { role, content };
  });
}
```

**Step 2: Run message conversion tests**

```bash
npm test -- messages.test.ts
```

Expected: All 9 message tests pass

**Step 3: Commit**

```bash
git add packages/oci-genai-provider/src/converters/
git commit -m "feat(provider): implement message conversion

Convert AI SDK messages to OCI GenAI format.
Tests passing (44/121).

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Error Handling

**Files:**

- Create: `packages/oci-genai-provider/src/errors/index.ts`

**Step 1: Define error class**

```typescript
export class OCIGenAIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'OCIGenAIError';
  }
}
```

**Step 2: Implement retry detection**

```typescript
export function isRetryableError(statusCode: number): boolean {
  return statusCode === 429 || statusCode >= 500;
}
```

**Step 3: Implement error handler**

```typescript
export function handleOCIError(error: unknown): OCIGenAIError {
  if (error instanceof OCIGenAIError) {
    return error;
  }

  const statusCode = (error as any)?.statusCode;
  const retryable = statusCode ? isRetryableError(statusCode) : false;

  let message = error instanceof Error ? error.message : String(error);

  // Add context based on status code
  if (statusCode === 401) {
    message += '\\nCheck OCI authentication configuration.';
  } else if (statusCode === 403) {
    message += '\\nCheck IAM policies and compartment access.';
  } else if (statusCode === 404) {
    message += '\\nCheck model ID and regional availability.';
  } else if (statusCode === 429) {
    message += '\\nRate limit exceeded. Implement retry with backoff.';
  }

  return new OCIGenAIError(message, statusCode, retryable);
}
```

**Step 4: Run error tests**

```bash
npm test -- errors.test.ts
```

Expected: All 20 error tests pass

**Step 5: Commit**

```bash
git add packages/oci-genai-provider/src/errors/
git commit -m "feat(provider): implement error handling

Add OCIGenAIError with retry detection and contextual messages.
Tests passing (64/121).

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: SSE Stream Parser

**Files:**

- Create: `packages/oci-genai-provider/src/streaming/sse-parser.ts`

**Step 1: Implement SSE parser**

```typescript
import { createParser } from 'eventsource-parser';
import type { LanguageModelV1StreamPart } from '@ai-sdk/provider';

export async function* parseSSEStream(
  response: Response
): AsyncIterable<LanguageModelV1StreamPart> {
  const parser = createParser((event) => {
    if (event.type === 'event') {
      try {
        const data = JSON.parse(event.data);

        // Parse text delta
        const textDelta = data.chatResponse?.chatChoice?.[0]?.message?.content?.[0]?.text;
        if (textDelta) {
          return { type: 'text-delta', textDelta };
        }

        // Parse finish event
        const finishReason = data.chatResponse?.chatChoice?.[0]?.finishReason;
        if (finishReason) {
          return {
            type: 'finish',
            finishReason: mapFinishReason(finishReason),
            usage: parseUsage(data),
          };
        }
      } catch (e) {
        // Ignore malformed JSON
      }
    }
  });

  // Stream body through parser
  for await (const chunk of response.body) {
    parser.feed(new TextDecoder().decode(chunk));
  }
}
```

**Step 2: Run SSE parser tests**

```bash
npm test -- sse-parser.test.ts
```

Expected: All 11 SSE tests pass

**Step 3: Commit**

```bash
git add packages/oci-genai-provider/src/streaming/
git commit -m "feat(provider): implement SSE stream parser

Parse OCI GenAI SSE responses into AI SDK stream parts.
Tests passing (75/121).

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Language Model (doGenerate)

**Files:**

- Create: `packages/oci-genai-provider/src/models/oci-language-model.ts`

**Step 1: Implement model class**

```typescript
import type { LanguageModelV1 } from '@ai-sdk/provider';

export class OCILanguageModel implements LanguageModelV1 {
  readonly specificationVersion = 'v1';
  readonly provider = 'oci-genai';
  readonly modelId: string;
  readonly defaultObjectGenerationMode = 'tool';

  constructor(
    modelId: string,
    private config: OCIConfig,
    private client: GenerativeAiInferenceClient
  ) {
    if (!isValidModelId(modelId)) {
      throw new Error(`Invalid model ID: ${modelId}`);
    }
    this.modelId = modelId;
  }

  async doGenerate(options: LanguageModelV1CallOptions): Promise<LanguageModelV1CallResult> {
    // Implementation here
  }

  async doStream(options: LanguageModelV1CallOptions): Promise<LanguageModelV1StreamResult> {
    // Implementation here (Task 8)
  }
}
```

**Step 2: Implement doGenerate**

Full implementation with parameter mapping, OCI API call, response parsing.

**Step 3: Run language model tests**

```bash
npm test -- oci-language-model.test.ts
```

Expected: All 22 doGenerate tests pass

**Step 4: Commit**

```bash
git add packages/oci-genai-provider/src/models/oci-language-model.ts
git commit -m "feat(provider): implement doGenerate method

Add non-streaming chat completions with parameter mapping.
Tests passing (97/121).

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Language Model (doStream)

**Files:**

- Modify: `packages/oci-genai-provider/src/models/oci-language-model.ts`

**Step 1: Implement doStream**

```typescript
async doStream(
  options: LanguageModelV1CallOptions
): Promise<LanguageModelV1StreamResult> {
  const messages = convertToOCIMessages(options.prompt);
  const chatRequest = createChatRequest(messages, options, true); // isStream=true

  try {
    const response = await this.client.chat(chatRequest);

    return {
      stream: parseSSEStream(response),
      rawCall: {
        rawPrompt: messages,
        rawSettings: { ...options, isStream: true },
      },
    };
  } catch (error) {
    throw handleOCIError(error);
  }
}
```

**Step 2: Run streaming tests**

```bash
npm test -- oci-language-model.stream.test.ts
```

Expected: All 8 streaming tests pass

**Step 3: Commit**

```bash
git add packages/oci-genai-provider/src/models/oci-language-model.ts
git commit -m "feat(provider): implement doStream method

Add streaming chat completions with SSE parsing.
Tests passing (105/121).

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Provider Factory

**Files:**

- Implement: `packages/oci-genai-provider/src/index.ts`

**Step 1: Implement createOCI factory**

```typescript
export function createOCI(config: OCIConfig = {}): OCIProvider {
  return {
    provider: 'oci-genai',
    model: (modelId: string) => {
      const authProvider = await createAuthProvider(config);
      const client = new GenerativeAiInferenceClient({
        authenticationDetailsProvider: authProvider,
      });

      return new OCILanguageModel(modelId, config, client);
    },
  };
}
```

**Step 2: Implement convenience function**

```typescript
export function oci(modelId: string, config?: OCIConfig): LanguageModelV1 {
  const provider = createOCI(config);
  return provider.model(modelId);
}
```

**Step 3: Export public API**

```typescript
// Main exports
export { createOCI, oci };

// Types
export type { OCIConfig, OCIProvider, ModelMetadata };

// Utilities
export { getModelMetadata, getAllModels, getModelsByFamily };
```

**Step 4: Run provider tests**

```bash
npm test -- provider.test.ts
```

Expected: All 16 provider tests pass

**Step 5: Run full test suite**

```bash
npm test
```

Expected: All 121 tests pass

**Step 6: Commit**

```bash
git add packages/oci-genai-provider/src/index.ts
git commit -m "feat(provider): implement provider factory

Add createOCI and oci convenience functions.
All 121 tests passing!

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Build & Verify

**Files:**

- Run build and verify outputs

**Step 1: Build the package**

```bash
cd packages/oci-genai-provider
npm run build
```

Expected: `dist/` directory with CJS and ESM outputs

**Step 2: Verify exports**

```bash
ls -la dist/
```

Expected files:

- `index.js` (ESM)
- `index.cjs` (CommonJS)
- `index.d.ts` (TypeScript declarations)

**Step 3: Test package locally**

Create test file:

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { generateText } from 'ai';

const result = await generateText({
  model: oci('cohere.command-r-plus'),
  prompt: 'Hello!',
});

console.log(result.text);
```

**Step 4: Run coverage report**

```bash
npm run test:coverage
```

Expected: 80%+ coverage on all metrics

**Step 5: Commit**

```bash
git commit -m "feat(provider): core provider implementation complete

✅ All 121 tests passing
✅ Full TypeScript type safety
✅ CJS + ESM builds
✅ 80%+ test coverage

Ready for publishing to npm.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Success Criteria

✅ All 121 tests passing
✅ TypeScript types exported
✅ CJS + ESM builds generated
✅ 80%+ test coverage
✅ README documentation complete
✅ Examples working

**Result:** Production-ready core provider, ready for standalone use or OpenCode integration.
