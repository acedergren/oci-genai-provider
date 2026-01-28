# Plan 7: Testing Infrastructure & Coverage

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Achieve 80%+ test coverage across all model types with comprehensive test suite, shared utilities, and automated CI enforcement.

**Architecture:** Establish robust testing infrastructure with Jest coverage reporting, shared test utilities/mocks, integration tests for each model type, E2E tests, GitHub Actions CI pipeline, and pre-commit test enforcement.

**Tech Stack:** Jest, @jest/globals, ts-jest, GitHub Actions, Husky (pre-commit hooks)

---

## Prerequisites

**Required:**
- ✅ Plans 1-5 must be complete
- All model types implemented (language, embeddings, speech, transcription, reranking)
- Provider implements ProviderV3 interface
- Existing test files in place

---

## Task 1: Enhance Jest Coverage Configuration

**Files:**
- Modify: `packages/oci-genai-provider/jest.config.js`
- Create: `packages/oci-genai-provider/.coveragerc`

**Step 1: Write test to verify coverage config is enforced**

Create: `packages/oci-genai-provider/src/__tests__/coverage.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';

describe('Coverage Configuration', () => {
  it('should enforce 80% coverage threshold', () => {
    // This test documents that our coverage threshold is 80%
    // Jest will fail the test suite if coverage drops below this
    const expectedThreshold = 80;

    expect(expectedThreshold).toBe(80);
  });

  it('should collect coverage from all source files', () => {
    // Coverage should include:
    // - provider.ts
    // - language-models/**/*.ts
    // - embedding-models/**/*.ts
    // - speech-models/**/*.ts
    // - transcription-models/**/*.ts
    // - reranking-models/**/*.ts
    // - shared/**/*.ts

    expect(true).toBe(true);
  });
});
```

**Step 2: Run test to verify it passes**

Run: `pnpm test src/__tests__/coverage.test.ts`
Expected: PASS

**Step 3: Update Jest config with enhanced coverage settings**

Modify `packages/oci-genai-provider/jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/index.ts', // Barrel exports don't need coverage
    '!src/types.ts', // Type definitions don't need coverage
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
  ],
  coverageDirectory: '<rootDir>/coverage',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: false,
      },
    ],
  },
  // Fail fast on first test failure in CI
  bail: process.env.CI ? 1 : 0,
  // Show individual test results
  verbose: true,
  // Detect open handles that prevent Jest from exiting
  detectOpenHandles: true,
  // Force exit after tests complete (for OCI SDK cleanup)
  forceExit: true,
};
```

**Step 4: Add coverage scripts to package.json**

Modify `packages/oci-genai-provider/package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:coverage:ci": "jest --coverage --ci --maxWorkers=2",
    "test:integration": "jest --testPathPattern=integration",
    "test:unit": "jest --testPathPattern='__tests__' --testPathIgnorePatterns='integration'"
  }
}
```

**Step 5: Run coverage to verify config works**

Run: `pnpm test:coverage`
Expected: Coverage report generated in `coverage/` directory

**Step 6: Commit**

```bash
git add jest.config.js package.json src/__tests__/coverage.test.ts
git commit -m "feat(testing): enhance Jest coverage configuration with 80% threshold"
```

---

## Task 2: Create Shared Test Utilities

**Files:**
- Create: `packages/oci-genai-provider/src/__tests__/utils/test-helpers.ts`
- Create: `packages/oci-genai-provider/src/__tests__/utils/__tests__/test-helpers.test.ts`

**Step 1: Write test for test utilities**

Create: `packages/oci-genai-provider/src/__tests__/utils/__tests__/test-helpers.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';
import {
  createMockOCIConfig,
  createMockOCIResponse,
  mockOCIError,
  waitForCondition,
} from '../test-helpers';

describe('Test Helpers', () => {
  describe('createMockOCIConfig', () => {
    it('should create valid mock config with defaults', () => {
      const config = createMockOCIConfig();

      expect(config.region).toBeDefined();
      expect(config.compartmentId).toBeDefined();
    });

    it('should allow overrides', () => {
      const config = createMockOCIConfig({
        region: 'us-ashburn-1',
        profile: 'ASHBURN',
      });

      expect(config.region).toBe('us-ashburn-1');
      expect(config.profile).toBe('ASHBURN');
    });
  });

  describe('createMockOCIResponse', () => {
    it('should create mock language model response', () => {
      const response = createMockOCIResponse('language', {
        text: 'Hello world',
      });

      expect(response.chatResult).toBeDefined();
      expect(response.chatResult.chatResponse.text).toBe('Hello world');
    });

    it('should create mock embedding response', () => {
      const response = createMockOCIResponse('embedding', {
        embeddings: [[0.1, 0.2, 0.3]],
      });

      expect(response.embedTextResult).toBeDefined();
      expect(response.embedTextResult.embeddings).toHaveLength(1);
    });
  });

  describe('mockOCIError', () => {
    it('should create mock rate limit error', () => {
      const error = mockOCIError('RateLimit', 'Too many requests');

      expect(error.statusCode).toBe(429);
      expect(error.message).toContain('Too many requests');
    });

    it('should create mock authentication error', () => {
      const error = mockOCIError('Authentication', 'Invalid credentials');

      expect(error.statusCode).toBe(401);
      expect(error.message).toContain('Invalid credentials');
    });
  });

  describe('waitForCondition', () => {
    it('should resolve when condition becomes true', async () => {
      let value = false;
      setTimeout(() => { value = true; }, 100);

      await expect(
        waitForCondition(() => value, 500)
      ).resolves.toBe(undefined);
    });

    it('should timeout if condition never becomes true', async () => {
      await expect(
        waitForCondition(() => false, 100)
      ).rejects.toThrow('Condition not met within 100ms');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/__tests__/utils/__tests__/test-helpers.test.ts`
Expected: FAIL - "Cannot find module '../test-helpers'"

**Step 3: Implement shared test helpers**

Create: `packages/oci-genai-provider/src/__tests__/utils/test-helpers.ts`

```typescript
import type { OCIBaseConfig } from '../../types';

/**
 * Create a mock OCI config for testing
 */
export function createMockOCIConfig(
  overrides: Partial<OCIBaseConfig> = {}
): OCIBaseConfig {
  return {
    region: 'eu-frankfurt-1',
    compartmentId: 'ocid1.compartment.oc1..aaaaaaatest',
    profile: 'DEFAULT',
    auth: 'config_file',
    ...overrides,
  };
}

/**
 * Create mock OCI API response
 */
export function createMockOCIResponse(
  type: 'language' | 'embedding' | 'speech' | 'transcription' | 'reranking',
  data: any
): any {
  switch (type) {
    case 'language':
      return {
        chatResult: {
          chatResponse: {
            text: data.text || 'Mock response',
            finishReason: data.finishReason || 'COMPLETE',
          },
        },
      };

    case 'embedding':
      return {
        embedTextResult: {
          embeddings: data.embeddings || [[0.1, 0.2, 0.3]],
        },
      };

    case 'speech':
      return {
        synthesizeSpeechResult: {
          audioContent: data.audioContent || Buffer.from('mock-audio'),
        },
      };

    case 'transcription':
      return {
        transcribeResult: {
          transcription: data.transcription || 'Mock transcription',
        },
      };

    case 'reranking':
      return {
        rerankResult: {
          rankings: data.rankings || [{ index: 0, relevanceScore: 0.9 }],
        },
      };

    default:
      throw new Error(`Unknown mock response type: ${type}`);
  }
}

/**
 * Create mock OCI error
 */
export function mockOCIError(
  type: 'RateLimit' | 'Authentication' | 'NotFound' | 'Network',
  message?: string
): Error & { statusCode: number } {
  const errors = {
    RateLimit: { statusCode: 429, message: message || 'Rate limit exceeded' },
    Authentication: { statusCode: 401, message: message || 'Authentication failed' },
    NotFound: { statusCode: 404, message: message || 'Model not found' },
    Network: { statusCode: 503, message: message || 'Service unavailable' },
  };

  const errorData = errors[type];
  const error = new Error(errorData.message) as Error & { statusCode: number };
  error.statusCode = errorData.statusCode;

  return error;
}

/**
 * Wait for a condition to become true (useful for async tests)
 */
export async function waitForCondition(
  condition: () => boolean,
  timeoutMs: number = 5000,
  intervalMs: number = 100
): Promise<void> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Condition not met within ${timeoutMs}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

/**
 * Create a mock streaming response
 */
export function createMockStreamChunks(texts: string[]): string[] {
  return texts.map((text) =>
    `data: ${JSON.stringify({
      chatResponse: { text },
      finishReason: null,
    })}\n\n`
  );
}

/**
 * Mock OCI client for testing
 */
export class MockOCIClient {
  public callCount = 0;
  public lastRequest: any = null;

  async chat(request: any): Promise<any> {
    this.callCount++;
    this.lastRequest = request;
    return createMockOCIResponse('language', { text: 'Mock response' });
  }

  async embedText(request: any): Promise<any> {
    this.callCount++;
    this.lastRequest = request;
    return createMockOCIResponse('embedding', {
      embeddings: request.embedTextDetails.inputs.map(() => [0.1, 0.2, 0.3]),
    });
  }

  reset(): void {
    this.callCount = 0;
    this.lastRequest = null;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test src/__tests__/utils/__tests__/test-helpers.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/__tests__/utils/
git commit -m "feat(testing): add shared test utilities and helpers"
```

---

## Task 3: Create Shared Mock Providers

**Files:**
- Create: `packages/oci-genai-provider/src/__tests__/mocks/oci-mocks.ts`
- Create: `packages/oci-genai-provider/src/__tests__/mocks/__tests__/oci-mocks.test.ts`

**Step 1: Write test for OCI mocks**

Create: `packages/oci-genai-provider/src/__tests__/mocks/__tests__/oci-mocks.test.ts`

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  mockGenerativeAiInferenceClient,
  mockAuthProvider,
  resetAllMocks,
} from '../oci-mocks';

describe('OCI Mocks', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe('mockGenerativeAiInferenceClient', () => {
    it('should create mock client with default responses', () => {
      const client = mockGenerativeAiInferenceClient();

      expect(client.chat).toBeDefined();
      expect(client.embedText).toBeDefined();
    });

    it('should allow custom response setup', () => {
      const client = mockGenerativeAiInferenceClient({
        chatResponse: { text: 'Custom response' },
      });

      expect(client).toBeDefined();
    });

    it('should track method calls', async () => {
      const client = mockGenerativeAiInferenceClient();

      await client.chat({ chatDetails: {} });
      await client.chat({ chatDetails: {} });

      expect(client.chat).toHaveBeenCalledTimes(2);
    });
  });

  describe('mockAuthProvider', () => {
    it('should create valid auth provider mock', async () => {
      const authProvider = mockAuthProvider();

      expect(authProvider).toBeDefined();
      expect(authProvider.getKeyId).toBeDefined();
    });
  });

  describe('resetAllMocks', () => {
    it('should reset all mock states', () => {
      const client = mockGenerativeAiInferenceClient();
      client.chat({ chatDetails: {} });

      resetAllMocks();

      expect(client.chat).toHaveBeenCalledTimes(0);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/__tests__/mocks/__tests__/oci-mocks.test.ts`
Expected: FAIL - "Cannot find module '../oci-mocks'"

**Step 3: Implement OCI mocks**

Create: `packages/oci-genai-provider/src/__tests__/mocks/oci-mocks.ts`

```typescript
import { jest } from '@jest/globals';
import { createMockOCIResponse } from '../utils/test-helpers';

/**
 * Mock GenerativeAiInferenceClient
 */
export function mockGenerativeAiInferenceClient(options: {
  chatResponse?: any;
  embedResponse?: any;
  shouldError?: boolean;
  errorType?: 'RateLimit' | 'Authentication' | 'Network';
} = {}) {
  const mock = {
    region: 'eu-frankfurt-1',
    endpoint: 'https://inference.generativeai.eu-frankfurt-1.oci.oraclecloud.com',

    chat: jest.fn().mockImplementation(async (request: any) => {
      if (options.shouldError) {
        throw createMockError(options.errorType || 'Network');
      }
      return createMockOCIResponse('language', options.chatResponse || {});
    }),

    embedText: jest.fn().mockImplementation(async (request: any) => {
      if (options.shouldError) {
        throw createMockError(options.errorType || 'Network');
      }
      return createMockOCIResponse('embedding', options.embedResponse || {});
    }),

    chatStream: jest.fn().mockImplementation(async function* (request: any) {
      if (options.shouldError) {
        throw createMockError(options.errorType || 'Network');
      }

      // Mock streaming response
      const chunks = ['Hello', ' ', 'world', '!'];
      for (const chunk of chunks) {
        yield {
          chatResponse: { text: chunk },
          finishReason: null,
        };
      }
      yield {
        chatResponse: { text: '' },
        finishReason: 'COMPLETE',
      };
    }),
  };

  return mock;
}

/**
 * Mock AuthenticationDetailsProvider
 */
export function mockAuthProvider() {
  return {
    getKeyId: jest.fn().mockResolvedValue('ocid1.tenancy.oc1..test/ocid1.user.oc1..test/fingerprint'),
    getTenancyId: jest.fn().mockResolvedValue('ocid1.tenancy.oc1..test'),
    getUserId: jest.fn().mockResolvedValue('ocid1.user.oc1..test'),
    getFingerprint: jest.fn().mockResolvedValue('test:fingerprint'),
    getPassphrase: jest.fn().mockResolvedValue(null),
    getPrivateKey: jest.fn().mockResolvedValue('-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----'),
  };
}

/**
 * Create a mock error with proper structure
 */
function createMockError(type: string): Error & { statusCode: number } {
  const errorMap = {
    RateLimit: { statusCode: 429, message: 'Rate limit exceeded' },
    Authentication: { statusCode: 401, message: 'Authentication failed' },
    Network: { statusCode: 503, message: 'Network error' },
  };

  const errorData = errorMap[type as keyof typeof errorMap] || errorMap.Network;
  const error = new Error(errorData.message) as Error & { statusCode: number };
  error.statusCode = errorData.statusCode;

  return error;
}

/**
 * Reset all mocks (call in beforeEach)
 */
export function resetAllMocks(): void {
  jest.clearAllMocks();
}

/**
 * Mock OCI SDK modules
 */
export const mockOCIModules = () => {
  jest.mock('oci-generativeaiinference', () => ({
    GenerativeAiInferenceClient: jest.fn().mockImplementation(() =>
      mockGenerativeAiInferenceClient()
    ),
  }));

  jest.mock('oci-common', () => ({
    ConfigFileAuthenticationDetailsProvider: jest.fn().mockImplementation(() =>
      mockAuthProvider()
    ),
  }));
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm test src/__tests__/mocks/__tests__/oci-mocks.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/__tests__/mocks/
git commit -m "feat(testing): add shared OCI mock providers"
```

---

## Task 4: Add Integration Tests for Each Model Type

**Files:**
- Create: `packages/oci-genai-provider/src/__tests__/integration/language-models.integration.test.ts`
- Create: `packages/oci-genai-provider/src/__tests__/integration/embedding-models.integration.test.ts`
- Create: `packages/oci-genai-provider/src/__tests__/integration/speech-models.integration.test.ts`
- Create: `packages/oci-genai-provider/src/__tests__/integration/transcription-models.integration.test.ts`
- Create: `packages/oci-genai-provider/src/__tests__/integration/reranking-models.integration.test.ts`

**Step 1: Write language model integration tests**

Create: `packages/oci-genai-provider/src/__tests__/integration/language-models.integration.test.ts`

```typescript
import { describe, it, expect, beforeAll } from '@jest/globals';
import { OCIProvider } from '../../provider';
import { createMockOCIConfig } from '../utils/test-helpers';
import { mockOCIModules } from '../mocks/oci-mocks';

// Mock OCI SDK
mockOCIModules();

describe('Language Models Integration', () => {
  let provider: OCIProvider;

  beforeAll(() => {
    provider = new OCIProvider(createMockOCIConfig());
  });

  describe('Model Creation', () => {
    it('should create Cohere Command R Plus model', () => {
      const model = provider.languageModel('cohere.command-r-plus');

      expect(model).toBeDefined();
      expect(model.modelId).toBe('cohere.command-r-plus');
      expect(model.provider).toBe('oci-genai');
    });

    it('should create Meta Llama 3.3 70B model', () => {
      const model = provider.languageModel('meta.llama-3.3-70b');

      expect(model).toBeDefined();
      expect(model.modelId).toBe('meta.llama-3.3-70b');
    });

    it('should apply model-specific settings', () => {
      const model = provider.languageModel('cohere.command-r', {
        region: 'us-ashburn-1',
        requestOptions: { timeoutMs: 30000 },
      });

      expect(model).toBeDefined();
    });
  });

  describe('Model Registry', () => {
    it('should validate model IDs', () => {
      expect(() => {
        provider.languageModel('invalid-model');
      }).toThrow();
    });

    it('should support all Cohere models', () => {
      const cohereModels = [
        'cohere.command-r-plus',
        'cohere.command-r',
        'cohere.command-r-plus-08-2024',
      ];

      cohereModels.forEach((modelId) => {
        const model = provider.languageModel(modelId);
        expect(model).toBeDefined();
      });
    });

    it('should support all Meta Llama models', () => {
      const llamaModels = [
        'meta.llama-3.3-70b',
        'meta.llama-3.1-405b',
        'meta.llama-3.1-70b',
      ];

      llamaModels.forEach((modelId) => {
        const model = provider.languageModel(modelId);
        expect(model).toBeDefined();
      });
    });
  });

  describe('Streaming Support', () => {
    it('should support streaming for all models', () => {
      const model = provider.languageModel('cohere.command-r-plus');

      // Verify model has doStream method
      expect(model.doStream).toBeDefined();
    });
  });
});
```

**Step 2: Write embedding integration tests**

Create: `packages/oci-genai-provider/src/__tests__/integration/embedding-models.integration.test.ts`

```typescript
import { describe, it, expect, beforeAll } from '@jest/globals';
import { OCIProvider } from '../../provider';
import { createMockOCIConfig } from '../utils/test-helpers';
import { mockOCIModules } from '../mocks/oci-mocks';

mockOCIModules();

describe('Embedding Models Integration', () => {
  let provider: OCIProvider;

  beforeAll(() => {
    provider = new OCIProvider(createMockOCIConfig());
  });

  describe('Model Creation', () => {
    it('should create multilingual embedding model', () => {
      const model = provider.embeddingModel('cohere.embed-multilingual-v3.0');

      expect(model).toBeDefined();
      expect(model.modelId).toBe('cohere.embed-multilingual-v3.0');
      expect(model.maxEmbeddingsPerCall).toBe(96);
    });

    it('should create English light model', () => {
      const model = provider.embeddingModel('cohere.embed-english-light-v3.0');

      expect(model).toBeDefined();
      expect(model.maxEmbeddingsPerCall).toBe(96);
    });
  });

  describe('Batch Processing', () => {
    it('should handle batch size limits', () => {
      const model = provider.embeddingModel('cohere.embed-multilingual-v3.0');

      expect(model.maxEmbeddingsPerCall).toBe(96);
    });

    it('should reject batches exceeding max size', async () => {
      const model = provider.embeddingModel('cohere.embed-multilingual-v3.0');
      const texts = Array(97).fill('test');

      await expect(
        model.doEmbed({ values: texts })
      ).rejects.toThrow('Batch size');
    });
  });

  describe('Configuration Options', () => {
    it('should support truncation options', () => {
      const model = provider.embeddingModel('cohere.embed-multilingual-v3.0', {
        truncate: 'START',
      });

      expect(model).toBeDefined();
    });

    it('should support input type optimization', () => {
      const model = provider.embeddingModel('cohere.embed-multilingual-v3.0', {
        inputType: 'QUERY',
      });

      expect(model).toBeDefined();
    });
  });
});
```

**Step 3: Write speech models integration tests**

Create: `packages/oci-genai-provider/src/__tests__/integration/speech-models.integration.test.ts`

```typescript
import { describe, it, expect, beforeAll } from '@jest/globals';
import { OCIProvider } from '../../provider';
import { createMockOCIConfig } from '../utils/test-helpers';

describe('Speech Models Integration', () => {
  let provider: OCIProvider;

  beforeAll(() => {
    provider = new OCIProvider(createMockOCIConfig());
  });

  describe('Model Creation', () => {
    it('should create speech synthesis model', () => {
      const model = provider.speechModel('oci-tts-default');

      expect(model).toBeDefined();
      expect(model.modelId).toBe('oci-tts-default');
    });

    it('should support voice options', () => {
      const model = provider.speechModel('oci-tts-default', {
        voice: 'en-US-Neural-Female',
        speed: 1.2,
      });

      expect(model).toBeDefined();
    });
  });

  describe('Audio Format Support', () => {
    it('should support mp3 format', () => {
      const model = provider.speechModel('oci-tts-default', {
        format: 'mp3',
      });

      expect(model).toBeDefined();
    });

    it('should support wav format', () => {
      const model = provider.speechModel('oci-tts-default', {
        format: 'wav',
      });

      expect(model).toBeDefined();
    });
  });
});
```

**Step 4: Write transcription integration tests**

Create: `packages/oci-genai-provider/src/__tests__/integration/transcription-models.integration.test.ts`

```typescript
import { describe, it, expect, beforeAll } from '@jest/globals';
import { OCIProvider } from '../../provider';
import { createMockOCIConfig } from '../utils/test-helpers';

describe('Transcription Models Integration', () => {
  let provider: OCIProvider;

  beforeAll(() => {
    provider = new OCIProvider(createMockOCIConfig());
  });

  describe('Model Creation', () => {
    it('should create transcription model', () => {
      const model = provider.transcriptionModel('oci-stt-standard');

      expect(model).toBeDefined();
      expect(model.modelId).toBe('oci-stt-standard');
    });

    it('should support language options', () => {
      const model = provider.transcriptionModel('oci-stt-standard', {
        language: 'en-US',
      });

      expect(model).toBeDefined();
    });
  });

  describe('Vocabulary Support', () => {
    it('should support custom vocabulary', () => {
      const model = provider.transcriptionModel('oci-stt-standard', {
        vocabulary: ['kubernetes', 'terraform', 'ansible'],
      });

      expect(model).toBeDefined();
    });
  });
});
```

**Step 5: Write reranking integration tests**

Create: `packages/oci-genai-provider/src/__tests__/integration/reranking-models.integration.test.ts`

```typescript
import { describe, it, expect, beforeAll } from '@jest/globals';
import { OCIProvider } from '../../provider';
import { createMockOCIConfig } from '../utils/test-helpers';

describe('Reranking Models Integration', () => {
  let provider: OCIProvider;

  beforeAll(() => {
    provider = new OCIProvider(createMockOCIConfig());
  });

  describe('Model Creation', () => {
    it('should create reranking model', () => {
      const model = provider.rerankingModel('cohere.rerank-v3.0');

      expect(model).toBeDefined();
      expect(model.modelId).toBe('cohere.rerank-v3.0');
    });

    it('should support topN configuration', () => {
      const model = provider.rerankingModel('cohere.rerank-v3.0', {
        topN: 5,
      });

      expect(model).toBeDefined();
    });
  });

  describe('Document Ranking', () => {
    it('should support returnDocuments option', () => {
      const model = provider.rerankingModel('cohere.rerank-v3.0', {
        returnDocuments: true,
      });

      expect(model).toBeDefined();
    });
  });
});
```

**Step 6: Run integration tests**

Run: `pnpm test:integration`
Expected: All integration tests pass

**Step 7: Commit**

```bash
git add src/__tests__/integration/
git commit -m "feat(testing): add comprehensive integration tests for all model types"
```

---

## Task 5: Create E2E Test Suite (Optional)

**Files:**
- Create: `packages/oci-genai-provider/src/__tests__/e2e/full-workflow.e2e.test.ts`

**Step 1: Write E2E test**

Create: `packages/oci-genai-provider/src/__tests__/e2e/full-workflow.e2e.test.ts`

```typescript
import { describe, it, expect, beforeAll } from '@jest/globals';
import { createOCI } from '../../index';
import { mockOCIModules } from '../mocks/oci-mocks';

mockOCIModules();

describe('E2E: Complete Workflow', () => {
  let provider: ReturnType<typeof createOCI>;

  beforeAll(() => {
    provider = createOCI({
      region: 'eu-frankfurt-1',
      compartmentId: 'ocid1.compartment.oc1..test',
    });
  });

  it('should support complete RAG workflow', async () => {
    // 1. Create embedding model
    const embeddingModel = provider.embeddingModel('cohere.embed-multilingual-v3.0');
    expect(embeddingModel).toBeDefined();

    // 2. Create language model
    const languageModel = provider.languageModel('cohere.command-r-plus');
    expect(languageModel).toBeDefined();

    // 3. Create reranking model
    const rerankingModel = provider.rerankingModel('cohere.rerank-v3.0');
    expect(rerankingModel).toBeDefined();

    // Verify all models are from same provider
    expect(embeddingModel.provider).toBe('oci-genai');
    expect(languageModel.provider).toBe('oci-genai');
    expect(rerankingModel.provider).toBe('oci-genai');
  });

  it('should support multimodal workflow', async () => {
    // 1. Transcription (audio → text)
    const transcriptionModel = provider.transcriptionModel('oci-stt-standard');
    expect(transcriptionModel).toBeDefined();

    // 2. Language model (text → text)
    const languageModel = provider.languageModel('cohere.command-r');
    expect(languageModel).toBeDefined();

    // 3. Speech synthesis (text → audio)
    const speechModel = provider.speechModel('oci-tts-default');
    expect(speechModel).toBeDefined();
  });

  it('should handle errors gracefully across model types', async () => {
    // Invalid language model
    expect(() => {
      provider.languageModel('invalid-model');
    }).toThrow();

    // Invalid embedding model
    expect(() => {
      provider.embeddingModel('invalid-embedding');
    }).toThrow();

    // Image models not supported
    expect(() => {
      provider.imageModel('dalle-3');
    }).toThrow('OCI does not provide image generation');
  });
});
```

**Step 2: Run E2E tests**

Run: `pnpm test src/__tests__/e2e/`
Expected: All E2E tests pass

**Step 3: Commit**

```bash
git add src/__tests__/e2e/
git commit -m "feat(testing): add E2E workflow tests"
```

---

## Task 6: Set Up GitHub Actions CI

**Files:**
- Create: `.github/workflows/test.yml`
- Modify: `.github/workflows/ci.yml`

**Step 1: Create dedicated test workflow**

Create: `.github/workflows/test.yml`

```yaml
name: Test Suite

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 8

      - name: Get pnpm store directory
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

      - name: Setup pnpm cache
        uses: actions/cache@v4
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run type checking
        run: pnpm type-check
        working-directory: packages/oci-genai-provider

      - name: Run linting
        run: pnpm lint
        working-directory: packages/oci-genai-provider

      - name: Run unit tests
        run: pnpm test:unit
        working-directory: packages/oci-genai-provider

      - name: Run integration tests
        run: pnpm test:integration
        working-directory: packages/oci-genai-provider

      - name: Run tests with coverage
        run: pnpm test:coverage:ci
        working-directory: packages/oci-genai-provider

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./packages/oci-genai-provider/coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
          fail_ci_if_error: true

      - name: Comment coverage on PR
        if: github.event_name == 'pull_request'
        uses: romeovs/lcov-reporter-action@v0.3.1
        with:
          lcov-file: ./packages/oci-genai-provider/coverage/lcov.info
          github-token: ${{ secrets.GITHUB_TOKEN }}

  coverage-check:
    name: Coverage Threshold Check
    runs-on: ubuntu-latest
    needs: test

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20.x

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Check coverage threshold
        run: pnpm test:coverage:ci
        working-directory: packages/oci-genai-provider

      - name: Fail if coverage below 80%
        run: |
          COVERAGE=$(cat packages/oci-genai-provider/coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 80% threshold"
            exit 1
          fi
```

**Step 2: Update existing CI workflow**

Modify `.github/workflows/ci.yml` to add test job:

```yaml
# Add after lint job:
  test:
    name: Test
    runs-on: ubuntu-latest
    needs: lint

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20.x

      - uses: pnpm/action-setup@v4
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test:coverage:ci
        working-directory: packages/oci-genai-provider
```

**Step 3: Test CI locally (if using act)**

Run: `act -j test`
Expected: CI workflow runs successfully locally

**Step 4: Commit**

```bash
git add .github/workflows/
git commit -m "ci: add comprehensive test workflows with coverage reporting"
```

---

## Task 7: Add Pre-Commit Test Hooks

**Files:**
- Create: `.husky/pre-commit`
- Modify: `package.json` (root)

**Step 1: Install Husky**

Run: `pnpm add -D -w husky`
Run: `pnpm exec husky install`

**Step 2: Create pre-commit hook**

Create: `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🧪 Running pre-commit tests..."

# Run type checking
echo "📝 Type checking..."
cd packages/oci-genai-provider && pnpm type-check || exit 1

# Run linting
echo "🔍 Linting..."
pnpm lint || exit 1

# Run unit tests only (fast)
echo "✅ Running unit tests..."
pnpm test:unit || exit 1

echo "✨ Pre-commit checks passed!"
```

**Step 3: Make hook executable**

Run: `chmod +x .husky/pre-commit`

**Step 4: Add Husky setup script to root package.json**

Modify root `package.json`:

```json
{
  "scripts": {
    "prepare": "husky install",
    "test": "turbo run test",
    "test:coverage": "turbo run test:coverage"
  },
  "devDependencies": {
    "husky": "^9.0.0"
  }
}
```

**Step 5: Test pre-commit hook**

Make a small change and commit:
```bash
echo "// test" >> packages/oci-genai-provider/src/types.ts
git add .
git commit -m "test: verify pre-commit hook"
```

Expected: Hook runs type check, lint, and unit tests

**Step 6: Revert test change**

```bash
git reset HEAD~1
git checkout packages/oci-genai-provider/src/types.ts
```

**Step 7: Commit hook setup**

```bash
git add .husky/ package.json
git commit -m "feat(testing): add pre-commit hooks for test enforcement"
```

---

## Task 8: Create Test Fixtures

**Files:**
- Create: `packages/oci-genai-provider/src/__tests__/fixtures/language-model-responses.ts`
- Create: `packages/oci-genai-provider/src/__tests__/fixtures/embedding-responses.ts`
- Create: `packages/oci-genai-provider/src/__tests__/fixtures/common-scenarios.ts`

**Step 1: Create language model fixtures**

Create: `packages/oci-genai-provider/src/__tests__/fixtures/language-model-responses.ts`

```typescript
/**
 * Common test fixtures for language model responses
 */

export const LANGUAGE_MODEL_FIXTURES = {
  simpleCompletion: {
    chatResult: {
      chatResponse: {
        text: 'Hello! How can I help you today?',
        finishReason: 'COMPLETE',
      },
    },
  },

  longCompletion: {
    chatResult: {
      chatResponse: {
        text: 'This is a long response. '.repeat(100),
        finishReason: 'COMPLETE',
      },
    },
  },

  truncatedResponse: {
    chatResult: {
      chatResponse: {
        text: 'This response was truncated due to max tokens',
        finishReason: 'MAX_TOKENS',
      },
    },
  },

  streamChunks: [
    { chatResponse: { text: 'Hello' }, finishReason: null },
    { chatResponse: { text: ' world' }, finishReason: null },
    { chatResponse: { text: '!' }, finishReason: null },
    { chatResponse: { text: '' }, finishReason: 'COMPLETE' },
  ],

  errorResponse: {
    statusCode: 429,
    message: 'Rate limit exceeded. Please try again later.',
  },
};

export const LANGUAGE_MODEL_REQUESTS = {
  simple: {
    chatDetails: {
      servingMode: {
        servingType: 'ON_DEMAND',
        modelId: 'cohere.command-r-plus',
      },
      chatRequest: {
        message: 'Hello',
        maxTokens: 100,
        temperature: 0.7,
      },
    },
  },
};
```

**Step 2: Create embedding fixtures**

Create: `packages/oci-genai-provider/src/__tests__/fixtures/embedding-responses.ts`

```typescript
/**
 * Common test fixtures for embedding responses
 */

export const EMBEDDING_FIXTURES = {
  singleEmbedding: {
    embedTextResult: {
      embeddings: [[0.1, 0.2, 0.3, 0.4, 0.5]],
    },
  },

  batchEmbeddings: {
    embedTextResult: {
      embeddings: [
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6],
        [0.7, 0.8, 0.9],
      ],
    },
  },

  maxBatchEmbeddings: {
    embedTextResult: {
      embeddings: Array(96).fill([0.1, 0.2, 0.3]),
    },
  },

  multilingualEmbedding: {
    embedTextResult: {
      embeddings: [Array(1024).fill(0.1)],
    },
  },

  lightEmbedding: {
    embedTextResult: {
      embeddings: [Array(384).fill(0.1)],
    },
  },
};

export const EMBEDDING_REQUESTS = {
  single: {
    embedTextDetails: {
      servingMode: {
        servingType: 'ON_DEMAND',
        modelId: 'cohere.embed-multilingual-v3.0',
      },
      inputs: ['Hello world'],
      truncate: 'END',
      inputType: 'DOCUMENT',
    },
  },

  batch: {
    embedTextDetails: {
      servingMode: {
        servingType: 'ON_DEMAND',
        modelId: 'cohere.embed-multilingual-v3.0',
      },
      inputs: ['Text 1', 'Text 2', 'Text 3'],
      truncate: 'END',
      inputType: 'DOCUMENT',
    },
  },
};
```

**Step 3: Create common scenario fixtures**

Create: `packages/oci-genai-provider/src/__tests__/fixtures/common-scenarios.ts`

```typescript
/**
 * Common test scenarios across all model types
 */

export const COMMON_SCENARIOS = {
  configs: {
    frankfurt: {
      region: 'eu-frankfurt-1',
      compartmentId: 'ocid1.compartment.oc1..aaaaaaatest',
      profile: 'FRANKFURT',
    },
    stockholm: {
      region: 'eu-stockholm-1',
      compartmentId: 'ocid1.compartment.oc1..aaaaaaatest',
      profile: 'STOCKHOLM',
    },
    ashburn: {
      region: 'us-ashburn-1',
      compartmentId: 'ocid1.compartment.oc1..aaaaaaatest',
      profile: 'ASHBURN',
    },
  },

  errors: {
    rateLimit: {
      statusCode: 429,
      message: 'TooManyRequests: Rate limit exceeded',
    },
    authentication: {
      statusCode: 401,
      message: 'NotAuthenticated: Invalid credentials',
    },
    notFound: {
      statusCode: 404,
      message: 'NotAuthorizedOrNotFound: Model not found',
    },
    serviceUnavailable: {
      statusCode: 503,
      message: 'ServiceUnavailable: Service temporarily unavailable',
    },
  },

  messages: {
    simple: [{ role: 'user' as const, content: 'Hello' }],
    conversation: [
      { role: 'user' as const, content: 'What is 2+2?' },
      { role: 'assistant' as const, content: '4' },
      { role: 'user' as const, content: 'And 3+3?' },
    ],
    multiTurn: [
      { role: 'system' as const, content: 'You are a helpful assistant.' },
      { role: 'user' as const, content: 'Hello' },
      { role: 'assistant' as const, content: 'Hi there!' },
      { role: 'user' as const, content: 'How are you?' },
    ],
  },

  modelIds: {
    language: {
      cohere: [
        'cohere.command-r-plus',
        'cohere.command-r',
        'cohere.command-r-plus-08-2024',
      ],
      meta: [
        'meta.llama-3.3-70b',
        'meta.llama-3.1-405b',
        'meta.llama-3.1-70b',
      ],
    },
    embedding: [
      'cohere.embed-multilingual-v3.0',
      'cohere.embed-english-v3.0',
      'cohere.embed-english-light-v3.0',
    ],
  },
};
```

**Step 4: Export fixtures from index**

Create: `packages/oci-genai-provider/src/__tests__/fixtures/index.ts`

```typescript
export * from './language-model-responses';
export * from './embedding-responses';
export * from './common-scenarios';
```

**Step 5: Commit**

```bash
git add src/__tests__/fixtures/
git commit -m "feat(testing): add comprehensive test fixtures for common scenarios"
```

---

## Task 9: Document Testing Best Practices

**Files:**
- Create: `docs/testing-guide.md`
- Modify: `packages/oci-genai-provider/README.md`

**Step 1: Create comprehensive testing guide**

Create: `docs/testing-guide.md`

```markdown
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
import { OCIProvider } from '../provider';

describe('OCIProvider', () => {
  it('should create language model', () => {
    const provider = new OCIProvider();
    const model = provider.languageModel('cohere.command-r-plus');

    expect(model).toBeDefined();
    expect(model.modelId).toBe('cohere.command-r-plus');
  });
});
```

### Integration Tests

**Location:** `src/__tests__/integration/<feature>.integration.test.ts`

**Example:**
```typescript
import { describe, it, expect, beforeAll } from '@jest/globals';
import { OCIProvider } from '../../provider';
import { createMockOCIConfig } from '../utils/test-helpers';

describe('Language Models Integration', () => {
  let provider: OCIProvider;

  beforeAll(() => {
    provider = new OCIProvider(createMockOCIConfig());
  });

  it('should support all Cohere models', () => {
    // Test multiple models
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
import {
  LANGUAGE_MODEL_FIXTURES,
  EMBEDDING_FIXTURES,
  COMMON_SCENARIOS,
} from '../fixtures';

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
import { mockOCIModules, mockGenerativeAiInferenceClient } from '../mocks/oci-mocks';

// Mock all OCI modules
mockOCIModules();

// Or create custom mock
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
it('should create language model', () => {
  // Arrange
  const provider = new OCIProvider();

  // Act
  const model = provider.languageModel('cohere.command-r-plus');

  // Assert
  expect(model).toBeDefined();
});
```

### 4. Test Both Happy and Error Paths
```typescript
describe('languageModel', () => {
  it('should create model with valid ID', () => {
    // Happy path
  });

  it('should throw error with invalid ID', () => {
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
# - Type checking
# - Linting
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
```

**Step 2: Add testing section to README**

Add to `packages/oci-genai-provider/README.md`:

```markdown
## Testing

### Running Tests

\`\`\`bash
# All tests
pnpm test

# With coverage
pnpm test:coverage

# Watch mode
pnpm test:watch

# Unit tests only
pnpm test:unit

# Integration tests
pnpm test:integration
\`\`\`

### Coverage

We maintain 80%+ test coverage across:
- Language models
- Embedding models
- Speech models (TTS)
- Transcription models (STT)
- Reranking models

View coverage report:
\`\`\`bash
pnpm test:coverage
open coverage/lcov-report/index.html
\`\`\`

### Contributing Tests

See [Testing Guide](../../docs/testing-guide.md) for detailed information on:
- Writing unit tests
- Writing integration tests
- Using test helpers and mocks
- Test fixtures and best practices
```

**Step 3: Commit**

```bash
git add docs/testing-guide.md packages/oci-genai-provider/README.md
git commit -m "docs(testing): add comprehensive testing guide and best practices"
```

---

## Verification Checklist

After completing all tasks:

- [ ] `pnpm test` - All tests pass
- [ ] `pnpm test:coverage` - Coverage report shows 80%+ for all metrics
- [ ] `pnpm test:unit` - Unit tests pass
- [ ] `pnpm test:integration` - Integration tests pass
- [ ] `pnpm type-check` - No TypeScript errors
- [ ] `pnpm build` - Build succeeds
- [ ] Jest config enforces 80% coverage threshold
- [ ] Shared test utilities work across all test files
- [ ] Mock providers properly simulate OCI SDK
- [ ] Integration tests cover all model types:
  - [ ] Language models
  - [ ] Embedding models
  - [ ] Speech models (TTS)
  - [ ] Transcription models (STT)
  - [ ] Reranking models
- [ ] E2E tests demonstrate complete workflows
- [ ] GitHub Actions CI runs tests on push/PR
- [ ] Pre-commit hooks enforce test quality
- [ ] Coverage reports uploaded to Codecov (optional)
- [ ] Test fixtures available for common scenarios
- [ ] Documentation complete and accurate

### Coverage Metrics Verification

Run coverage and verify:
```bash
pnpm test:coverage

# Expected output:
# ----------------------------|---------|----------|---------|---------|
# File                        | % Stmts | % Branch | % Funcs | % Lines |
# ----------------------------|---------|----------|---------|---------|
# All files                   |   80+   |   80+    |   80+   |   80+   |
# ----------------------------|---------|----------|---------|---------|
```

### CI Verification

Push branch and verify:
```bash
git push origin testing-infrastructure
```

Check GitHub Actions:
- [ ] Test workflow runs
- [ ] All jobs pass
- [ ] Coverage report generated
- [ ] PR comment shows coverage (if PR)

---

## Next Steps

**Plan 7 Complete!** 🎉

Testing infrastructure is now comprehensive with:
- ✅ 80%+ coverage across all model types
- ✅ Shared test utilities and mocks
- ✅ Integration and E2E tests
- ✅ CI automation with GitHub Actions
- ✅ Pre-commit test enforcement
- ✅ Comprehensive documentation

You can now confidently:
- **Merge to main** - All quality gates enforced
- **Plan 8**: Documentation & Examples - Comprehensive guides
- **Plan 9**: Performance Optimization - Benchmarks and tuning
- **Plan 10**: Production Readiness - Error handling, monitoring
