# OCI GenAI Provider Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a production-ready Vercel AI SDK v3 provider for OCI Generative AI with streaming, tool calling, and authentication support.

**Architecture:** Factory pattern (`createOCI`) returns provider that creates language model instances. Each model implements `LanguageModelV3` interface with `doGenerate()` and `doStream()` methods. Authentication cascades from environment → constructor → config file. SSE streaming parsed with eventsource-parser into async iterators.

**Tech Stack:** TypeScript 5.3, OCI SDK 2.73, Vercel AI SDK v3, eventsource-parser, Jest, Frankfurt region (eu-frankfurt-1)

---

## Prerequisites

Before starting, ensure:

- OCI account with GenAI access (Frankfurt region)
- `~/.oci/config` configured with API key
- Node.js 18+ installed
- Repository cloned and npm dependencies installed

---

## Task 1: Project Dependencies

**Files:**

- Modify: `package.json`
- Create: `src/index.ts` (minimal export)

**Step 1: Add AI SDK dependencies to package.json**

Update dependencies section:

```json
"dependencies": {
  "@ai-sdk/provider": "^0.0.24",
  "@ai-sdk/provider-utils": "^1.0.20",
  "eventsource-parser": "^1.1.2",
  "oci-common": "^2.73.0",
  "oci-generativeaiinference": "^2.73.0",
  "zod": "^3.23.8",
  "dotenv": "^16.4.1"
}
```

**Step 2: Add peer dependencies**

```json
"peerDependencies": {
  "ai": "^3.0.0 || ^4.0.0"
}
```

**Step 3: Install dependencies**

Run: `npm install`
Expected: Dependencies installed successfully

**Step 4: Update src/index.ts**

Replace placeholder with:

```typescript
// OCI GenAI Provider - Entry point
export * from './provider.js';
export * from './types.js';
```

**Step 5: Commit**

```bash
git add package.json package-lock.json src/index.ts
git commit -m "build: add AI SDK and OCI dependencies

Add Vercel AI SDK provider interface, OCI SDK, and utilities.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Type Definitions

**Files:**

- Create: `src/types.ts`
- Create: `src/__tests__/types.test.ts`

**Step 1: Write types test**

Create `src/__tests__/types.test.ts`:

```typescript
import { describe, it, expect } from '@jest/globals';
import type { OCIConfig, OCIProvider } from '../types.js';

describe('OCIConfig', () => {
  it('should allow optional region configuration', () => {
    const config: OCIConfig = {
      region: 'eu-frankfurt-1',
    };
    expect(config.region).toBe('eu-frankfurt-1');
  });

  it('should allow all authentication methods', () => {
    const configWithProfile: OCIConfig = {
      region: 'eu-frankfurt-1',
      profile: 'FRANKFURT',
    };

    const configWithAuth: OCIConfig = {
      region: 'eu-frankfurt-1',
      auth: 'instance_principal',
    };

    expect(configWithProfile.profile).toBe('FRANKFURT');
    expect(configWithAuth.auth).toBe('instance_principal');
  });
});

describe('OCIProvider', () => {
  it('should have provider and model factory', () => {
    const provider: OCIProvider = {
      provider: 'oci-genai',
      model: (modelId: string) => ({}) as any,
    };

    expect(provider.provider).toBe('oci-genai');
    expect(typeof provider.model).toBe('function');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- types.test.ts`
Expected: FAIL - module not found

**Step 3: Create types.ts**

Create `src/types.ts`:

```typescript
import type { LanguageModelV1 } from '@ai-sdk/provider';

/**
 * Authentication method for OCI
 */
export type OCIAuthMethod =
  | 'config_file' // API key from ~/.oci/config
  | 'instance_principal' // OCI Compute instance
  | 'resource_principal'; // OCI Functions

/**
 * Configuration options for OCI GenAI provider
 */
export interface OCIConfig {
  /**
   * OCI region (e.g., 'eu-frankfurt-1')
   * @default 'eu-frankfurt-1'
   */
  region?: string;

  /**
   * OCI config profile name
   * @default 'DEFAULT'
   */
  profile?: string;

  /**
   * Authentication method
   * @default 'config_file'
   */
  auth?: OCIAuthMethod;

  /**
   * Path to OCI config file
   * @default '~/.oci/config'
   */
  configPath?: string;

  /**
   * Compartment OCID for API calls
   * If not provided, will be read from config or environment
   */
  compartmentId?: string;

  /**
   * Custom endpoint URL (for testing/dedicated clusters)
   */
  endpoint?: string;
}

/**
 * OCI Provider interface returned by createOCI()
 */
export interface OCIProvider {
  /**
   * Provider identifier
   */
  readonly provider: 'oci-genai';

  /**
   * Create a language model instance
   * @param modelId - OCI model identifier (e.g., 'cohere.command-r-plus')
   * @returns Language model instance
   */
  model: (modelId: string) => LanguageModelV1;
}

/**
 * Model metadata for dynamic selection
 */
export interface ModelMetadata {
  id: string;
  name: string;
  family: 'grok' | 'llama' | 'cohere' | 'gemini' | 'openai';
  capabilities: {
    streaming: boolean;
    tools: boolean;
    vision: boolean;
  };
  contextWindow: number;
  speed: 'very-fast' | 'fast' | 'medium' | 'slow';
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- types.test.ts`
Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add src/types.ts src/__tests__/types.test.ts
git commit -m "feat: add core type definitions

Define OCIConfig, OCIProvider, and ModelMetadata types.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Authentication Module

**Files:**

- Create: `src/auth/index.ts`
- Create: `src/auth/__tests__/auth.test.ts`

**Step 1: Write authentication test**

Create `src/auth/__tests__/auth.test.ts`:

```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createAuthProvider } from '../index.js';
import type { OCIConfig } from '../../types.js';

// Mock OCI SDK
jest.mock('oci-common', () => ({
  ConfigFileAuthenticationDetailsProvider: jest.fn(),
  InstancePrincipalsAuthenticationDetailsProvider: jest.fn(),
  ResourcePrincipalAuthenticationDetailsProvider: jest.fn(),
  Region: {
    EU_FRANKFURT_1: 'eu-frankfurt-1',
  },
}));

describe('createAuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create config file auth provider by default', async () => {
    const config: OCIConfig = {
      region: 'eu-frankfurt-1',
    };

    const provider = await createAuthProvider(config);

    expect(provider).toBeDefined();
  });

  it('should use custom profile when provided', async () => {
    const config: OCIConfig = {
      region: 'eu-frankfurt-1',
      profile: 'FRANKFURT',
    };

    const provider = await createAuthProvider(config);

    expect(provider).toBeDefined();
  });

  it('should create instance principal auth when specified', async () => {
    const config: OCIConfig = {
      region: 'eu-frankfurt-1',
      auth: 'instance_principal',
    };

    const provider = await createAuthProvider(config);

    expect(provider).toBeDefined();
  });

  it('should throw error for unsupported auth method', async () => {
    const config: OCIConfig = {
      region: 'eu-frankfurt-1',
      auth: 'unsupported' as any,
    };

    await expect(createAuthProvider(config)).rejects.toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- auth.test.ts`
Expected: FAIL - module not found

**Step 3: Implement authentication module**

Create `src/auth/index.ts`:

```typescript
import common = require('oci-common');
import type { OCIConfig } from '../types.js';

/**
 * Create OCI authentication provider based on configuration
 */
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
      return await common.InstancePrincipalsAuthenticationDetailsProvider.builder().build();
    }

    case 'resource_principal': {
      return common.ResourcePrincipalAuthenticationDetailsProvider.builder();
    }

    default:
      throw new Error(
        `Unsupported authentication method: ${authMethod}. ` +
          `Supported methods: config_file, instance_principal, resource_principal`
      );
  }
}

/**
 * Get compartment ID from config, environment, or config file
 */
export function getCompartmentId(config: OCIConfig): string {
  // Priority: config > environment > error
  const compartmentId = config.compartmentId || process.env.OCI_COMPARTMENT_ID;

  if (!compartmentId) {
    throw new Error(
      'Compartment ID not found. Provide via config.compartmentId or OCI_COMPARTMENT_ID environment variable.'
    );
  }

  return compartmentId;
}

/**
 * Get region from config or environment
 */
export function getRegion(config: OCIConfig): string {
  return config.region || process.env.OCI_REGION || 'eu-frankfurt-1';
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- auth.test.ts`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/auth/
git commit -m "feat: implement OCI authentication module

Support config file, instance principal, and resource principal auth.
Add compartment ID and region resolution with environment fallbacks.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Model Registry

**Files:**

- Create: `src/models/registry.ts`
- Create: `src/models/__tests__/registry.test.ts`

**Step 1: Write model registry test**

Create `src/models/__tests__/registry.test.ts`:

```typescript
import { describe, it, expect } from '@jest/globals';
import { getModelMetadata, isValidModelId } from '../registry.js';

describe('Model Registry', () => {
  describe('isValidModelId', () => {
    it('should validate Grok models', () => {
      expect(isValidModelId('xai.grok-4-maverick')).toBe(true);
      expect(isValidModelId('xai.grok-3')).toBe(true);
      expect(isValidModelId('xai.invalid')).toBe(false);
    });

    it('should validate Llama models', () => {
      expect(isValidModelId('meta.llama-3.3-70b-instruct')).toBe(true);
      expect(isValidModelId('meta.llama-3.2-vision-90b-instruct')).toBe(true);
    });

    it('should validate Cohere models', () => {
      expect(isValidModelId('cohere.command-r-plus')).toBe(true);
      expect(isValidModelId('cohere.command-a-reasoning')).toBe(true);
    });

    it('should validate Gemini models', () => {
      expect(isValidModelId('google.gemini-2.5-pro')).toBe(true);
      expect(isValidModelId('google.gemini-2.5-flash-lite')).toBe(true);
    });
  });

  describe('getModelMetadata', () => {
    it('should return metadata for valid model', () => {
      const metadata = getModelMetadata('xai.grok-4-maverick');

      expect(metadata).toBeDefined();
      expect(metadata?.id).toBe('xai.grok-4-maverick');
      expect(metadata?.family).toBe('grok');
      expect(metadata?.capabilities.streaming).toBe(true);
      expect(metadata?.capabilities.tools).toBe(true);
    });

    it('should return undefined for invalid model', () => {
      const metadata = getModelMetadata('invalid.model');
      expect(metadata).toBeUndefined();
    });

    it('should return metadata for Gemini with vision', () => {
      const metadata = getModelMetadata('google.gemini-2.5-flash');

      expect(metadata?.capabilities.vision).toBe(true);
      expect(metadata?.contextWindow).toBe(1048576); // 1M tokens
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- registry.test.ts`
Expected: FAIL - module not found

**Step 3: Implement model registry**

Create `src/models/registry.ts`:

```typescript
import type { ModelMetadata } from '../types.js';

/**
 * Model registry with capabilities and metadata
 */
const MODEL_REGISTRY: Record<string, ModelMetadata> = {
  // xAI Grok Models
  'xai.grok-4-maverick': {
    id: 'xai.grok-4-maverick',
    name: 'Grok 4 Maverick',
    family: 'grok',
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: 'very-fast',
  },
  'xai.grok-4-scout': {
    id: 'xai.grok-4-scout',
    name: 'Grok 4 Scout',
    family: 'grok',
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: 'fast',
  },
  'xai.grok-3': {
    id: 'xai.grok-3',
    name: 'Grok 3',
    family: 'grok',
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: 'fast',
  },
  'xai.grok-3-mini': {
    id: 'xai.grok-3-mini',
    name: 'Grok 3 Mini',
    family: 'grok',
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: 'very-fast',
  },

  // Meta Llama Models
  'meta.llama-3.3-70b-instruct': {
    id: 'meta.llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B Instruct',
    family: 'llama',
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: 'medium',
  },
  'meta.llama-3.2-vision-90b-instruct': {
    id: 'meta.llama-3.2-vision-90b-instruct',
    name: 'Llama 3.2 Vision 90B',
    family: 'llama',
    capabilities: { streaming: true, tools: true, vision: true },
    contextWindow: 131072,
    speed: 'medium',
  },
  'meta.llama-3.1-405b-instruct': {
    id: 'meta.llama-3.1-405b-instruct',
    name: 'Llama 3.1 405B Instruct',
    family: 'llama',
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: 'slow',
  },

  // Cohere Command Models
  'cohere.command-r-plus': {
    id: 'cohere.command-r-plus',
    name: 'Command R+',
    family: 'cohere',
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: 'fast',
  },
  'cohere.command-a': {
    id: 'cohere.command-a',
    name: 'Command A',
    family: 'cohere',
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: 'fast',
  },
  'cohere.command-a-reasoning': {
    id: 'cohere.command-a-reasoning',
    name: 'Command A Reasoning',
    family: 'cohere',
    capabilities: { streaming: true, tools: true, vision: false },
    contextWindow: 131072,
    speed: 'medium',
  },
  'cohere.command-a-vision': {
    id: 'cohere.command-a-vision',
    name: 'Command A Vision',
    family: 'cohere',
    capabilities: { streaming: true, tools: true, vision: true },
    contextWindow: 131072,
    speed: 'medium',
  },

  // Google Gemini Models
  'google.gemini-2.5-pro': {
    id: 'google.gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    family: 'gemini',
    capabilities: { streaming: true, tools: true, vision: true },
    contextWindow: 1048576, // 1M tokens
    speed: 'medium',
  },
  'google.gemini-2.5-flash': {
    id: 'google.gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    family: 'gemini',
    capabilities: { streaming: true, tools: true, vision: true },
    contextWindow: 1048576,
    speed: 'very-fast',
  },
  'google.gemini-2.5-flash-lite': {
    id: 'google.gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    family: 'gemini',
    capabilities: { streaming: true, tools: true, vision: true },
    contextWindow: 1048576,
    speed: 'very-fast',
  },
};

/**
 * Check if model ID is valid
 */
export function isValidModelId(modelId: string): boolean {
  return modelId in MODEL_REGISTRY;
}

/**
 * Get model metadata by ID
 */
export function getModelMetadata(modelId: string): ModelMetadata | undefined {
  return MODEL_REGISTRY[modelId];
}

/**
 * Get all available models
 */
export function getAllModels(): ModelMetadata[] {
  return Object.values(MODEL_REGISTRY);
}

/**
 * Get models by family
 */
export function getModelsByFamily(
  family: 'grok' | 'llama' | 'cohere' | 'gemini' | 'openai'
): ModelMetadata[] {
  return Object.values(MODEL_REGISTRY).filter((m) => m.family === family);
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- registry.test.ts`
Expected: PASS (6 tests)

**Step 5: Commit**

```bash
git add src/models/
git commit -m "feat: implement model registry

Add metadata for all OCI GenAI models with capabilities matrix.
Support validation and lookup by model ID and family.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Language Model Implementation (Part 1: Basic Structure)

**Files:**

- Create: `src/models/oci-language-model.ts`
- Create: `src/models/__tests__/oci-language-model.test.ts`

**Step 1: Write basic model test**

Create `src/models/__tests__/oci-language-model.test.ts`:

```typescript
import { describe, it, expect, jest } from '@jest/globals';
import { OCILanguageModel } from '../oci-language-model.js';
import type { OCIConfig } from '../../types.js';

jest.mock('oci-common');
jest.mock('oci-generativeaiinference');

describe('OCILanguageModel', () => {
  const mockConfig: OCIConfig = {
    region: 'eu-frankfurt-1',
    profile: 'DEFAULT',
    compartmentId: 'ocid1.compartment.oc1..test',
  };

  it('should create model with valid model ID', () => {
    const model = new OCILanguageModel('cohere.command-r-plus', mockConfig);

    expect(model.specificationVersion).toBe('v1');
    expect(model.provider).toBe('oci-genai');
    expect(model.modelId).toBe('cohere.command-r-plus');
  });

  it('should throw error for invalid model ID', () => {
    expect(() => {
      new OCILanguageModel('invalid.model', mockConfig);
    }).toThrow('Invalid model ID');
  });

  it('should have default object generation mode', () => {
    const model = new OCILanguageModel('cohere.command-r-plus', mockConfig);

    expect(model.defaultObjectGenerationMode).toBe('tool');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- oci-language-model.test.ts`
Expected: FAIL - module not found

**Step 3: Create basic model structure**

Create `src/models/oci-language-model.ts`:

```typescript
import type { LanguageModelV1 } from '@ai-sdk/provider';
import type {
  LanguageModelV1CallOptions,
  LanguageModelV1CallWarning,
  LanguageModelV1FinishReason,
  LanguageModelV1StreamPart,
} from '@ai-sdk/provider';
import type { OCIConfig } from '../types.js';
import { isValidModelId, getModelMetadata } from './registry.js';
import { createAuthProvider, getCompartmentId, getRegion } from '../auth/index.js';
import generativeaiinference = require('oci-generativeaiinference');
import common = require('oci-common');

/**
 * OCI Generative AI language model implementation
 */
export class OCILanguageModel implements LanguageModelV1 {
  readonly specificationVersion = 'v1' as const;
  readonly provider = 'oci-genai' as const;
  readonly modelId: string;
  readonly defaultObjectGenerationMode = 'tool' as const;

  private config: OCIConfig;
  private authProvider: common.AuthenticationDetailsProvider | null = null;
  private client: generativeaiinference.GenerativeAiInferenceClient | null = null;
  private compartmentId: string;
  private region: string;

  constructor(modelId: string, config: OCIConfig) {
    if (!isValidModelId(modelId)) {
      throw new Error(
        `Invalid model ID: ${modelId}. ` +
          `Use isValidModelId() to check or see MODEL_REGISTRY for available models.`
      );
    }

    this.modelId = modelId;
    this.config = config;
    this.compartmentId = getCompartmentId(config);
    this.region = getRegion(config);
  }

  /**
   * Initialize OCI client (lazy initialization)
   */
  private async getClient(): Promise<generativeaiinference.GenerativeAiInferenceClient> {
    if (!this.client) {
      if (!this.authProvider) {
        this.authProvider = await createAuthProvider(this.config);
      }

      const endpoint =
        this.config.endpoint || `https://inference.generativeai.${this.region}.oci.oraclecloud.com`;

      this.client = new generativeaiinference.GenerativeAiInferenceClient({
        authenticationDetailsProvider: this.authProvider,
      });
      this.client.endpoint = endpoint;
    }

    return this.client;
  }

  /**
   * Generate text without streaming
   */
  async doGenerate(options: LanguageModelV1CallOptions): Promise<{
    text?: string;
    toolCalls?: any[];
    finishReason: LanguageModelV1FinishReason;
    usage: { promptTokens: number; completionTokens: number };
    rawCall: { rawPrompt: unknown; rawSettings: unknown };
    warnings?: LanguageModelV1CallWarning[];
  }> {
    // Implementation will be added in next task
    throw new Error('doGenerate not implemented yet');
  }

  /**
   * Generate text with streaming
   */
  async doStream(options: LanguageModelV1CallOptions): Promise<{
    stream: ReadableStream<LanguageModelV1StreamPart>;
    rawCall: { rawPrompt: unknown; rawSettings: unknown };
    warnings?: LanguageModelV1CallWarning[];
  }> {
    // Implementation will be added in next task
    throw new Error('doStream not implemented yet');
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- oci-language-model.test.ts`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/models/oci-language-model.ts src/models/__tests__/oci-language-model.test.ts
git commit -m "feat: create OCILanguageModel base structure

Implement LanguageModelV1 interface with validation and client initialization.
Add lazy OCI client creation with authentication.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Message Conversion

**Files:**

- Create: `src/converters/messages.ts`
- Create: `src/converters/__tests__/messages.test.ts`

**Step 1: Write message conversion test**

Create `src/converters/__tests__/messages.test.ts`:

```typescript
import { describe, it, expect } from '@jest/globals';
import { convertToOCIMessages } from '../messages.js';
import type { LanguageModelV1Prompt } from '@ai-sdk/provider';

describe('Message Conversion', () => {
  it('should convert simple user message', () => {
    const prompt: LanguageModelV1Prompt = [
      {
        role: 'user',
        content: [{ type: 'text', text: 'Hello' }],
      },
    ];

    const ociMessages = convertToOCIMessages(prompt);

    expect(ociMessages).toHaveLength(1);
    expect(ociMessages[0].role).toBe('USER');
    expect(ociMessages[0].content).toEqual([{ type: 'TEXT', text: 'Hello' }]);
  });

  it('should convert system message', () => {
    const prompt: LanguageModelV1Prompt = [
      {
        role: 'system',
        content: 'You are a helpful assistant.',
      },
    ];

    const ociMessages = convertToOCIMessages(prompt);

    expect(ociMessages[0].role).toBe('SYSTEM');
    expect(ociMessages[0].content[0].text).toBe('You are a helpful assistant.');
  });

  it('should convert multi-turn conversation', () => {
    const prompt: LanguageModelV1Prompt = [
      {
        role: 'user',
        content: [{ type: 'text', text: 'What is OCI?' }],
      },
      {
        role: 'assistant',
        content: [{ type: 'text', text: 'Oracle Cloud Infrastructure' }],
      },
      {
        role: 'user',
        content: [{ type: 'text', text: 'Tell me more' }],
      },
    ];

    const ociMessages = convertToOCIMessages(prompt);

    expect(ociMessages).toHaveLength(3);
    expect(ociMessages[0].role).toBe('USER');
    expect(ociMessages[1].role).toBe('ASSISTANT');
    expect(ociMessages[2].role).toBe('USER');
  });

  it('should handle empty content', () => {
    const prompt: LanguageModelV1Prompt = [
      {
        role: 'user',
        content: [],
      },
    ];

    const ociMessages = convertToOCIMessages(prompt);

    expect(ociMessages[0].content).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- messages.test.ts`
Expected: FAIL - module not found

**Step 3: Implement message conversion**

Create `src/converters/messages.ts`:

```typescript
import type { LanguageModelV1Prompt } from '@ai-sdk/provider';

/**
 * OCI GenAI message format
 */
export interface OCIMessage {
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: Array<{
    type: 'TEXT';
    text: string;
  }>;
}

/**
 * Convert AI SDK prompt to OCI GenAI messages
 */
export function convertToOCIMessages(prompt: LanguageModelV1Prompt): OCIMessage[] {
  return prompt.map((message) => {
    // Handle role conversion
    let role: 'USER' | 'ASSISTANT' | 'SYSTEM';
    switch (message.role) {
      case 'user':
        role = 'USER';
        break;
      case 'assistant':
        role = 'ASSISTANT';
        break;
      case 'system':
        role = 'SYSTEM';
        break;
      default:
        throw new Error(`Unsupported message role: ${message.role}`);
    }

    // Handle content conversion
    let content: Array<{ type: 'TEXT'; text: string }>;

    if (typeof message.content === 'string') {
      // Simple string content
      content = [{ type: 'TEXT', text: message.content }];
    } else if (Array.isArray(message.content)) {
      // Array of content parts
      content = message.content
        .filter((part) => part.type === 'text')
        .map((part) => ({
          type: 'TEXT' as const,
          text: (part as any).text,
        }));
    } else {
      content = [];
    }

    return {
      role,
      content,
    };
  });
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- messages.test.ts`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/converters/
git commit -m "feat: implement message format conversion

Convert AI SDK messages to OCI GenAI format.
Handle user, assistant, and system roles with text content.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: doGenerate Implementation

**Files:**

- Modify: `src/models/oci-language-model.ts`
- Create: `src/models/__tests__/oci-language-model.generate.test.ts`

**Step 1: Write doGenerate test**

Create `src/models/__tests__/oci-language-model.generate.test.ts`:

```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { OCILanguageModel } from '../oci-language-model.js';
import type { OCIConfig } from '../../types.js';
import type { LanguageModelV1CallOptions } from '@ai-sdk/provider';

// Mock OCI SDK
const mockChat = jest.fn();
jest.mock('oci-generativeaiinference', () => ({
  GenerativeAiInferenceClient: jest.fn().mockImplementation(() => ({
    chat: mockChat,
  })),
}));

jest.mock('oci-common', () => ({
  ConfigFileAuthenticationDetailsProvider: jest.fn(),
  Region: { EU_FRANKFURT_1: 'eu-frankfurt-1' },
}));

describe('OCILanguageModel.doGenerate', () => {
  const mockConfig: OCIConfig = {
    region: 'eu-frankfurt-1',
    profile: 'DEFAULT',
    compartmentId: 'ocid1.compartment.oc1..test',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful response
    mockChat.mockResolvedValue({
      chatResponse: {
        chatChoice: [
          {
            message: {
              content: [{ text: 'Hello! How can I help?' }],
            },
            finishReason: 'STOP',
          },
        ],
        usage: {
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15,
        },
      },
    });
  });

  it('should generate text successfully', async () => {
    const model = new OCILanguageModel('cohere.command-r-plus', mockConfig);

    const options: LanguageModelV1CallOptions = {
      prompt: [
        {
          role: 'user',
          content: [{ type: 'text', text: 'Hello' }],
        },
      ],
    };

    const result = await model.doGenerate(options);

    expect(result.text).toBe('Hello! How can I help?');
    expect(result.finishReason).toBe('stop');
    expect(result.usage.promptTokens).toBe(10);
    expect(result.usage.completionTokens).toBe(5);
  });

  it('should handle temperature parameter', async () => {
    const model = new OCILanguageModel('cohere.command-r-plus', mockConfig);

    const options: LanguageModelV1CallOptions = {
      prompt: [
        {
          role: 'user',
          content: [{ type: 'text', text: 'Hello' }],
        },
      ],
      temperature: 0.7,
    };

    await model.doGenerate(options);

    const callArgs = mockChat.mock.calls[0][0];
    expect(callArgs.chatRequest.inferenceConfig.temperature).toBe(0.7);
  });

  it('should handle maxTokens parameter', async () => {
    const model = new OCILanguageModel('cohere.command-r-plus', mockConfig);

    const options: LanguageModelV1CallOptions = {
      prompt: [
        {
          role: 'user',
          content: [{ type: 'text', text: 'Hello' }],
        },
      ],
      maxTokens: 100,
    };

    await model.doGenerate(options);

    const callArgs = mockChat.mock.calls[0][0];
    expect(callArgs.chatRequest.inferenceConfig.maxTokens).toBe(100);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- oci-language-model.generate.test.ts`
Expected: FAIL - doGenerate not implemented

**Step 3: Implement doGenerate method**

Update `src/models/oci-language-model.ts`:

```typescript
// Add import at top
import { convertToOCIMessages } from '../converters/messages.js';

// Replace doGenerate implementation
async doGenerate(
  options: LanguageModelV1CallOptions
): Promise<{
  text?: string;
  toolCalls?: any[];
  finishReason: LanguageModelV1FinishReason;
  usage: { promptTokens: number; completionTokens: number };
  rawCall: { rawPrompt: unknown; rawSettings: unknown };
  warnings?: LanguageModelV1CallWarning[];
}> {
  const client = await this.getClient();
  const messages = convertToOCIMessages(options.prompt);

  // Build inference config
  const inferenceConfig: any = {};
  if (options.temperature !== undefined) {
    inferenceConfig.temperature = options.temperature;
  }
  if (options.maxTokens !== undefined) {
    inferenceConfig.maxTokens = options.maxTokens;
  }
  if (options.topP !== undefined) {
    inferenceConfig.topP = options.topP;
  }
  if (options.topK !== undefined) {
    inferenceConfig.topK = options.topK;
  }
  if (options.frequencyPenalty !== undefined) {
    inferenceConfig.frequencyPenalty = options.frequencyPenalty;
  }
  if (options.presencePenalty !== undefined) {
    inferenceConfig.presencePenalty = options.presencePenalty;
  }

  // Build chat request
  const chatRequest = {
    compartmentId: this.compartmentId,
    servingMode: {
      servingType: 'ON_DEMAND',
      modelId: this.modelId,
    },
    chatRequest: {
      messages,
      ...(Object.keys(inferenceConfig).length > 0 && { inferenceConfig }),
    },
  };

  // Make API call
  const response = await client.chat(chatRequest);
  const chatChoice = response.chatResponse.chatChoice[0];
  const usage = response.chatResponse.usage;

  // Extract text from response
  const text = chatChoice.message.content
    .map((c: any) => c.text)
    .join('');

  // Map finish reason
  let finishReason: LanguageModelV1FinishReason;
  switch (chatChoice.finishReason) {
    case 'STOP':
      finishReason = 'stop';
      break;
    case 'LENGTH':
      finishReason = 'length';
      break;
    case 'CONTENT_FILTER':
      finishReason = 'content-filter';
      break;
    default:
      finishReason = 'other';
  }

  return {
    text,
    finishReason,
    usage: {
      promptTokens: usage.promptTokens || 0,
      completionTokens: usage.completionTokens || 0,
    },
    rawCall: {
      rawPrompt: messages,
      rawSettings: inferenceConfig,
    },
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- oci-language-model.generate.test.ts`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/models/oci-language-model.ts src/models/__tests__/oci-language-model.generate.test.ts
git commit -m "feat: implement doGenerate for text generation

Add non-streaming text generation with parameter support.
Handle temperature, maxTokens, topP, topK, and penalties.
Map finish reasons from OCI to AI SDK format.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Streaming Support (doStream Implementation)

**Files:**

- Create: `src/streaming/sse-parser.ts`
- Create: `src/streaming/__tests__/sse-parser.test.ts`
- Modify: `src/models/oci-language-model.ts`

**Step 1: Write SSE parser test**

Create `src/streaming/__tests__/sse-parser.test.ts`:

```typescript
import { describe, it, expect } from '@jest/globals';
import { parseSSEStream } from '../sse-parser.js';

describe('SSE Parser', () => {
  it('should parse SSE events into text deltas', async () => {
    const sseData = `event: message
data: {"chatResponse":{"chatChoice":[{"message":{"content":[{"text":"Hello"}]}}]}}

event: message
data: {"chatResponse":{"chatChoice":[{"message":{"content":[{"text":" world"}]}}]}}

event: done
data: [DONE]
`;

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(sseData));
        controller.close();
      },
    });

    const textParts: string[] = [];
    for await (const part of parseSSEStream(stream)) {
      if (part.type === 'text-delta') {
        textParts.push(part.textDelta);
      }
    }

    expect(textParts).toEqual(['Hello', ' world']);
  });

  it('should handle finish event', async () => {
    const sseData = `event: message
data: {"chatResponse":{"chatChoice":[{"message":{"content":[{"text":"Done"}]},"finishReason":"STOP"}],"usage":{"promptTokens":5,"completionTokens":1}}}

event: done
data: [DONE]
`;

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(sseData));
        controller.close();
      },
    });

    let finishPart: any = null;
    for await (const part of parseSSEStream(stream)) {
      if (part.type === 'finish') {
        finishPart = part;
      }
    }

    expect(finishPart).toBeDefined();
    expect(finishPart.finishReason).toBe('stop');
    expect(finishPart.usage.promptTokens).toBe(5);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- sse-parser.test.ts`
Expected: FAIL - module not found

**Step 3: Implement SSE parser**

Create `src/streaming/sse-parser.ts`:

```typescript
import { createParser, type ParsedEvent } from 'eventsource-parser';
import type { LanguageModelV1StreamPart } from '@ai-sdk/provider';

/**
 * Parse OCI GenAI SSE stream into AI SDK stream parts
 */
export async function* parseSSEStream(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<LanguageModelV1StreamPart> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  const parser = createParser((event: ParsedEvent) => {
    if (event.type === 'event') {
      if (event.event === 'done') {
        return; // Stream complete
      }

      try {
        const data = JSON.parse(event.data);
        const chatChoice = data.chatResponse?.chatChoice?.[0];

        if (!chatChoice) return;

        // Extract text delta
        const content = chatChoice.message?.content;
        if (content && content.length > 0) {
          const text = content[0].text;
          if (text) {
            pendingParts.push({
              type: 'text-delta',
              textDelta: text,
            });
          }
        }

        // Check for finish
        if (chatChoice.finishReason) {
          const usage = data.chatResponse.usage;

          let finishReason: 'stop' | 'length' | 'content-filter' | 'other';
          switch (chatChoice.finishReason) {
            case 'STOP':
              finishReason = 'stop';
              break;
            case 'LENGTH':
              finishReason = 'length';
              break;
            case 'CONTENT_FILTER':
              finishReason = 'content-filter';
              break;
            default:
              finishReason = 'other';
          }

          pendingParts.push({
            type: 'finish',
            finishReason,
            usage: {
              promptTokens: usage?.promptTokens || 0,
              completionTokens: usage?.completionTokens || 0,
            },
          });
        }
      } catch (error) {
        // Ignore parse errors
      }
    }
  });

  const pendingParts: LanguageModelV1StreamPart[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      parser.feed(chunk);

      // Yield all pending parts
      while (pendingParts.length > 0) {
        yield pendingParts.shift()!;
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Yield any remaining parts
  while (pendingParts.length > 0) {
    yield pendingParts.shift()!;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- sse-parser.test.ts`
Expected: PASS (2 tests)

**Step 5: Add doStream implementation**

Update `src/models/oci-language-model.ts`:

```typescript
// Add import at top
import { parseSSEStream } from '../streaming/sse-parser.js';

// Replace doStream implementation
async doStream(
  options: LanguageModelV1CallOptions
): Promise<{
  stream: ReadableStream<LanguageModelV1StreamPart>;
  rawCall: { rawPrompt: unknown; rawSettings: unknown };
  warnings?: LanguageModelV1CallWarning[];
}> {
  const client = await this.getClient();
  const messages = convertToOCIMessages(options.prompt);

  // Build inference config (same as doGenerate)
  const inferenceConfig: any = {};
  if (options.temperature !== undefined) {
    inferenceConfig.temperature = options.temperature;
  }
  if (options.maxTokens !== undefined) {
    inferenceConfig.maxTokens = options.maxTokens;
  }
  if (options.topP !== undefined) {
    inferenceConfig.topP = options.topP;
  }
  if (options.topK !== undefined) {
    inferenceConfig.topK = options.topK;
  }

  // Build chat request
  const chatRequest = {
    compartmentId: this.compartmentId,
    servingMode: {
      servingType: 'ON_DEMAND',
      modelId: this.modelId,
    },
    chatRequest: {
      messages,
      ...(Object.keys(inferenceConfig).length > 0 && { inferenceConfig }),
      isStream: true, // Enable streaming
    },
  };

  // Make streaming API call
  const response = await client.chat(chatRequest);

  // Convert response stream to ReadableStream
  const responseStream = response.value as any as ReadableStream<Uint8Array>;

  // Parse SSE stream into AI SDK stream parts
  const parsedStream = parseSSEStream(responseStream);

  // Convert async generator to ReadableStream
  const stream = new ReadableStream<LanguageModelV1StreamPart>({
    async start(controller) {
      try {
        for await (const part of parsedStream) {
          controller.enqueue(part);
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return {
    stream,
    rawCall: {
      rawPrompt: messages,
      rawSettings: { ...inferenceConfig, isStream: true },
    },
  };
}
```

**Step 6: Commit**

```bash
git add src/streaming/ src/models/oci-language-model.ts
git commit -m "feat: implement streaming with SSE parser

Add Server-Sent Events parser for OCI GenAI streaming.
Implement doStream method with async generator conversion.
Support text deltas and finish events with usage tracking.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Provider Factory

**Files:**

- Create: `src/provider.ts`
- Create: `src/__tests__/provider.test.ts`

**Step 1: Write provider factory test**

Create `src/__tests__/provider.test.ts`:

```typescript
import { describe, it, expect } from '@jest/globals';
import { createOCI } from '../provider.js';

describe('createOCI', () => {
  it('should create provider with default config', () => {
    const oci = createOCI();

    expect(oci.provider).toBe('oci-genai');
    expect(typeof oci.model).toBe('function');
  });

  it('should create provider with custom region', () => {
    const oci = createOCI({
      region: 'eu-frankfurt-1',
    });

    expect(oci.provider).toBe('oci-genai');
  });

  it('should create language model instance', () => {
    const oci = createOCI({
      region: 'eu-frankfurt-1',
      compartmentId: 'ocid1.compartment.oc1..test',
    });

    const model = oci.model('cohere.command-r-plus');

    expect(model.provider).toBe('oci-genai');
    expect(model.modelId).toBe('cohere.command-r-plus');
  });

  it('should throw error for invalid model', () => {
    const oci = createOCI({
      region: 'eu-frankfurt-1',
      compartmentId: 'ocid1.compartment.oc1..test',
    });

    expect(() => {
      oci.model('invalid.model');
    }).toThrow('Invalid model ID');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- provider.test.ts`
Expected: FAIL - module not found

**Step 3: Implement provider factory**

Create `src/provider.ts`:

````typescript
import type { OCIConfig, OCIProvider } from './types.js';
import { OCILanguageModel } from './models/oci-language-model.js';

/**
 * Create OCI GenAI provider instance
 *
 * @example
 * ```typescript
 * import { createOCI } from '@acedergren/oci-genai-provider';
 * import { generateText } from 'ai';
 *
 * const oci = createOCI({
 *   region: 'eu-frankfurt-1',
 *   profile: 'DEFAULT',
 * });
 *
 * const { text } = await generateText({
 *   model: oci('cohere.command-r-plus'),
 *   prompt: 'Explain OCI GenAI',
 * });
 * ```
 *
 * @param config - OCI configuration options
 * @returns OCI provider instance
 */
export function createOCI(config: OCIConfig = {}): OCIProvider {
  return {
    provider: 'oci-genai',
    model: (modelId: string) => {
      return new OCILanguageModel(modelId, config);
    },
  };
}
````

**Step 4: Run test to verify it passes**

Run: `npm test -- provider.test.ts`
Expected: PASS (4 tests)

**Step 5: Update index.ts exports**

Update `src/index.ts`:

```typescript
// OCI GenAI Provider - Entry point
export * from './provider.js';
export * from './types.js';
export * from './models/registry.js';

// Re-export for convenience
export { OCILanguageModel } from './models/oci-language-model.js';
```

**Step 6: Commit**

```bash
git add src/provider.ts src/__tests__/provider.test.ts src/index.ts
git commit -m "feat: implement provider factory function

Add createOCI() factory with configuration support.
Export all public APIs from index.ts.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Integration Test

**Files:**

- Create: `examples/basic-chat.ts`
- Create: `examples/streaming-chat.ts`

**Step 1: Create basic chat example**

Create `examples/basic-chat.ts`:

```typescript
import { createOCI } from '../src/index.js';
import { generateText } from 'ai';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const oci = createOCI({
    region: process.env.OCI_REGION || 'eu-frankfurt-1',
    profile: process.env.OCI_CONFIG_PROFILE || 'DEFAULT',
    compartmentId: process.env.OCI_COMPARTMENT_ID,
  });

  console.log('Generating text with OCI GenAI...\n');

  const { text, usage } = await generateText({
    model: oci('cohere.command-r-plus'),
    prompt: 'What is Oracle Cloud Infrastructure GenAI? Answer in one paragraph.',
  });

  console.log('Response:', text);
  console.log('\nUsage:', usage);
}

main().catch(console.error);
```

**Step 2: Create streaming example**

Create `examples/streaming-chat.ts`:

```typescript
import { createOCI } from '../src/index.js';
import { streamText } from 'ai';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const oci = createOCI({
    region: process.env.OCI_REGION || 'eu-frankfurt-1',
    profile: process.env.OCI_CONFIG_PROFILE || 'DEFAULT',
    compartmentId: process.env.OCI_COMPARTMENT_ID,
  });

  console.log('Streaming text with OCI GenAI...\n');

  const { textStream } = await streamText({
    model: oci('xai.grok-4-maverick'),
    prompt: 'Write a haiku about cloud computing.',
  });

  for await (const textPart of textStream) {
    process.stdout.write(textPart);
  }

  console.log('\n\nStreaming complete!');
}

main().catch(console.error);
```

**Step 3: Test basic example manually**

Run: `npx ts-node examples/basic-chat.ts`
Expected: Text generation with usage stats (requires OCI credentials)

**Step 4: Test streaming example manually**

Run: `npx ts-node examples/streaming-chat.ts`
Expected: Streaming text output (requires OCI credentials)

**Step 5: Commit examples**

```bash
git add examples/
git commit -m "docs: add integration examples

Add basic and streaming chat examples for manual testing.
Examples require OCI credentials and compartment ID.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Error Handling

**Files:**

- Create: `src/errors.ts`
- Create: `src/__tests__/errors.test.ts`
- Modify: `src/models/oci-language-model.ts`

**Step 1: Write error handling test**

Create `src/__tests__/errors.test.ts`:

```typescript
import { describe, it, expect } from '@jest/globals';
import { OCIGenAIError, isRetryableError, handleOCIError } from '../errors.js';

describe('Error Handling', () => {
  describe('OCIGenAIError', () => {
    it('should create error with status code', () => {
      const error = new OCIGenAIError('Test error', 429);

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(429);
      expect(error.name).toBe('OCIGenAIError');
    });

    it('should mark 429 as retryable', () => {
      const error = new OCIGenAIError('Rate limit', 429, true);

      expect(error.retryable).toBe(true);
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable status codes', () => {
      expect(isRetryableError(429)).toBe(true);
      expect(isRetryableError(503)).toBe(true);
      expect(isRetryableError(500)).toBe(true);
    });

    it('should not retry client errors', () => {
      expect(isRetryableError(400)).toBe(false);
      expect(isRetryableError(401)).toBe(false);
      expect(isRetryableError(403)).toBe(false);
      expect(isRetryableError(404)).toBe(false);
    });
  });

  describe('handleOCIError', () => {
    it('should wrap OCI errors', () => {
      const ociError = {
        statusCode: 403,
        message: 'Forbidden',
      };

      const error = handleOCIError(ociError);

      expect(error).toBeInstanceOf(OCIGenAIError);
      expect(error.statusCode).toBe(403);
      expect(error.retryable).toBe(false);
    });

    it('should handle network errors', () => {
      const networkError = new Error('Network timeout');

      const error = handleOCIError(networkError);

      expect(error).toBeInstanceOf(OCIGenAIError);
      expect(error.message).toContain('Network timeout');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- errors.test.ts`
Expected: FAIL - module not found

**Step 3: Implement error handling**

Create `src/errors.ts`:

```typescript
/**
 * Custom error class for OCI GenAI provider
 */
export class OCIGenAIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryable?: boolean
  ) {
    super(message);
    this.name = 'OCIGenAIError';
  }
}

/**
 * Check if error status code is retryable
 */
export function isRetryableError(statusCode: number): boolean {
  // Retry on rate limits and server errors
  return statusCode === 429 || statusCode >= 500;
}

/**
 * Handle OCI SDK errors and convert to OCIGenAIError
 */
export function handleOCIError(error: any): OCIGenAIError {
  if (error instanceof OCIGenAIError) {
    return error;
  }

  const statusCode = error.statusCode || error.status;
  const message = error.message || 'Unknown OCI GenAI error';

  // Determine if error is retryable
  const retryable = statusCode ? isRetryableError(statusCode) : false;

  // Add context to error message
  let enhancedMessage = message;
  if (statusCode === 401) {
    enhancedMessage += '\nCheck OCI authentication configuration.';
  } else if (statusCode === 403) {
    enhancedMessage += '\nCheck IAM policies and compartment access.';
  } else if (statusCode === 404) {
    enhancedMessage += '\nCheck model ID and regional availability.';
  } else if (statusCode === 429) {
    enhancedMessage += '\nRate limit exceeded. Implement retry with backoff.';
  }

  return new OCIGenAIError(enhancedMessage, statusCode, retryable);
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- errors.test.ts`
Expected: PASS (6 tests)

**Step 5: Add error handling to model**

Update `src/models/oci-language-model.ts`:

```typescript
// Add import at top
import { handleOCIError } from '../errors.js';

// Wrap doGenerate in try-catch
async doGenerate(
  options: LanguageModelV1CallOptions
): Promise<{...}> {
  try {
    // ... existing implementation
  } catch (error) {
    throw handleOCIError(error);
  }
}

// Wrap doStream in try-catch
async doStream(
  options: LanguageModelV1CallOptions
): Promise<{...}> {
  try {
    // ... existing implementation
  } catch (error) {
    throw handleOCIError(error);
  }
}
```

**Step 6: Commit**

```bash
git add src/errors.ts src/__tests__/errors.test.ts src/models/oci-language-model.ts
git commit -m "feat: implement error handling

Add OCIGenAIError with status codes and retry detection.
Wrap OCI SDK errors with helpful context messages.
Apply error handling to doGenerate and doStream.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Build and Type Checking

**Files:**

- Verify: All TypeScript files compile
- Verify: All tests pass

**Step 1: Run type check**

Run: `npm run type-check`
Expected: No TypeScript errors

**Step 2: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 3: Build distribution**

Run: `npm run build`
Expected: `dist/` directory created with JS and type definitions

**Step 4: Verify exports**

Run: `ls -la dist/`
Expected: index.js, index.d.ts, and all module files

**Step 5: Tag release**

```bash
git tag -a v0.1.0 -m "Release v0.1.0: Core provider implementation

Features:
- LanguageModelV1 interface implementation
- Streaming support with SSE parsing
- Authentication (config file, instance/resource principal)
- Model registry with 16+ models
- Error handling with retry detection
- Frankfurt region as default

Ready for integration testing."
```

---

## Post-Implementation Tasks

### Documentation

- Update README.md with usage examples
- Add API documentation
- Create troubleshooting guide

### Testing

- Add integration tests with real OCI API
- Test all model families
- Test authentication methods
- Load testing

### Publishing

- Publish to GitHub npm registry
- Create GitHub release
- Update changelog

### Future Enhancements

- Tool calling support (Task 13)
- Vision support for multimodal models
- Fine-tuned model support
- Dedicated cluster endpoints
- Retry logic with exponential backoff
- Request/response caching
- Dynamic model selection

---

## Verification Checklist

After completing all tasks:

- [ ] All tests pass (`npm test`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Build succeeds (`npm run build`)
- [ ] Examples run with OCI credentials
- [ ] No security warnings (secrets, vulnerabilities)
- [ ] Git history is clean and semantic
- [ ] Documentation is complete

---

## Notes

**TDD Approach**: Each task follows Test-Driven Development:

1. Write failing test
2. Implement minimal code to pass
3. Verify test passes
4. Commit

**Atomic Commits**: Each task creates a single, focused commit with Co-Authored-By attribution.

**Frankfurt Region**: All examples and defaults use `eu-frankfurt-1` as specified.

**Security**: Use execFile (not exec), validate inputs, handle credentials securely.

**DRY/YAGNI**: Implement only what's specified, avoid over-engineering.
