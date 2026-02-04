# Plan 2: Embedding Models Implementation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add complete embedding model support using OCI GenAI embeddings API with EmbeddingModelV3 interface.

**Architecture:** Implement OCIEmbeddingModel class that converts text to vector embeddings using Cohere models on OCI. Supports batch embedding (up to 96 texts), dimension selection (384/1024), and input type optimization.

**Tech Stack:** TypeScript, @ai-sdk/provider@^3.0.5, OCI GenerativeAiInferenceClient, Jest

---

## Prerequisites

**Required:**

- ✅ Plan 1 must be complete
- Provider implements ProviderV3 interface
- Shared utilities in `src/shared/` folder

---

## Task 1: Create Embedding Model Registry

**Files:**

- Create: `packages/oci-genai-provider/src/embedding-models/registry.ts`
- Create: `packages/oci-genai-provider/src/embedding-models/__tests__/registry.test.ts`

**Step 1: Write test for embedding model registry**

Create: `packages/oci-genai-provider/src/embedding-models/__tests__/registry.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';
import {
  getEmbeddingModelMetadata,
  isValidEmbeddingModelId,
  getAllEmbeddingModels,
} from '../registry';

describe('Embedding Model Registry', () => {
  it('should validate Cohere embedding model IDs', () => {
    expect(isValidEmbeddingModelId('cohere.embed-multilingual-v3.0')).toBe(true);
    expect(isValidEmbeddingModelId('cohere.embed-english-light-v3.0')).toBe(true);
    expect(isValidEmbeddingModelId('invalid-model')).toBe(false);
  });

  it('should return metadata for valid embedding models', () => {
    const metadata = getEmbeddingModelMetadata('cohere.embed-multilingual-v3.0');

    expect(metadata).toBeDefined();
    expect(metadata?.id).toBe('cohere.embed-multilingual-v3.0');
    expect(metadata?.dimensions).toBe(1024);
    expect(metadata?.family).toBe('cohere');
  });

  it('should return undefined for invalid model IDs', () => {
    const metadata = getEmbeddingModelMetadata('invalid-model');
    expect(metadata).toBeUndefined();
  });

  it('should list all embedding models', () => {
    const models = getAllEmbeddingModels();

    expect(models.length).toBeGreaterThan(0);
    expect(models.every((m) => m.family === 'cohere')).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/embedding-models/__tests__/registry.test.ts`
Expected: FAIL - "Cannot find module '../registry'"

**Step 3: Implement embedding model registry**

Create: `packages/oci-genai-provider/src/embedding-models/registry.ts`

```typescript
export interface EmbeddingModelMetadata {
  id: string;
  name: string;
  family: 'cohere';
  dimensions: 384 | 1024;
  maxTextsPerBatch: number;
  maxTokensPerText: number;
}

export const EMBEDDING_MODELS: EmbeddingModelMetadata[] = [
  {
    id: 'cohere.embed-multilingual-v3.0',
    name: 'Cohere Embed Multilingual v3.0',
    family: 'cohere',
    dimensions: 1024,
    maxTextsPerBatch: 96,
    maxTokensPerText: 512,
  },
  {
    id: 'cohere.embed-english-v3.0',
    name: 'Cohere Embed English v3.0',
    family: 'cohere',
    dimensions: 1024,
    maxTextsPerBatch: 96,
    maxTokensPerText: 512,
  },
  {
    id: 'cohere.embed-english-light-v3.0',
    name: 'Cohere Embed English Light v3.0',
    family: 'cohere',
    dimensions: 384,
    maxTextsPerBatch: 96,
    maxTokensPerText: 512,
  },
];

export function isValidEmbeddingModelId(modelId: string): boolean {
  return EMBEDDING_MODELS.some((m) => m.id === modelId);
}

export function getEmbeddingModelMetadata(modelId: string): EmbeddingModelMetadata | undefined {
  return EMBEDDING_MODELS.find((m) => m.id === modelId);
}

export function getAllEmbeddingModels(): EmbeddingModelMetadata[] {
  return EMBEDDING_MODELS;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test src/embedding-models/__tests__/registry.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/embedding-models/
git commit -m "feat(embeddings): add embedding model registry"
```

---

## Task 2: Implement OCIEmbeddingModel Class

**Files:**

- Create: `packages/oci-genai-provider/src/embedding-models/OCIEmbeddingModel.ts`
- Create: `packages/oci-genai-provider/src/embedding-models/__tests__/OCIEmbeddingModel.test.ts`

**Step 1: Write test for OCIEmbeddingModel**

Create: `packages/oci-genai-provider/src/embedding-models/__tests__/OCIEmbeddingModel.test.ts`

```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { OCIEmbeddingModel } from '../OCIEmbeddingModel';
import type { EmbeddingModelV3CallOptions } from '@ai-sdk/provider';

// Mock OCI SDK
jest.mock('oci-generativeaiinference');
jest.mock('../../auth');

describe('OCIEmbeddingModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have correct specification version and provider', () => {
    const model = new OCIEmbeddingModel('cohere.embed-multilingual-v3.0', {
      compartmentId: 'ocid1.compartment.test',
    });

    expect(model.specificationVersion).toBe('v3');
    expect(model.provider).toBe('oci-genai');
    expect(model.modelId).toBe('cohere.embed-multilingual-v3.0');
  });

  it('should set maxEmbeddingsPerCall to 96', () => {
    const model = new OCIEmbeddingModel('cohere.embed-multilingual-v3.0', {});

    expect(model.maxEmbeddingsPerCall).toBe(96);
  });

  it('should throw error for invalid model ID', () => {
    expect(() => {
      new OCIEmbeddingModel('invalid-model', {});
    }).toThrow('Invalid embedding model ID');
  });

  it('should validate embeddings count does not exceed max', async () => {
    const model = new OCIEmbeddingModel('cohere.embed-multilingual-v3.0', {
      compartmentId: 'test',
    });

    const texts = Array(97).fill('test'); // 97 > 96 max

    const options: EmbeddingModelV3CallOptions = {
      values: texts,
    };

    await expect(model.doEmbed(options)).rejects.toThrow(
      'Batch size (97) exceeds maximum allowed (96)'
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/embedding-models/__tests__/OCIEmbeddingModel.test.ts`
Expected: FAIL - "Cannot find module '../OCIEmbeddingModel'"

**Step 3: Implement OCIEmbeddingModel class**

Create: `packages/oci-genai-provider/src/embedding-models/OCIEmbeddingModel.ts`

```typescript
import {
  EmbeddingModelV3,
  EmbeddingModelV3CallOptions,
  EmbeddingModelV3CallOutput,
} from '@ai-sdk/provider';
import { GenerativeAiInferenceClient } from 'oci-generativeaiinference';
import { createAuthProvider, getCompartmentId, getRegion } from '../auth';
import { getEmbeddingModelMetadata, isValidEmbeddingModelId } from './registry';
import type { OCIEmbeddingSettings } from '../types';

export class OCIEmbeddingModel implements EmbeddingModelV3<string> {
  readonly specificationVersion = 'v3';
  readonly provider = 'oci-genai';
  readonly maxEmbeddingsPerCall = 96;

  private _client?: GenerativeAiInferenceClient;

  constructor(
    readonly modelId: string,
    private config: OCIEmbeddingSettings
  ) {
    if (!isValidEmbeddingModelId(modelId)) {
      throw new Error(
        `Invalid embedding model ID: ${modelId}. ` +
          `Valid models: cohere.embed-multilingual-v3.0, cohere.embed-english-v3.0, cohere.embed-english-light-v3.0`
      );
    }
  }

  private async getClient(): Promise<GenerativeAiInferenceClient> {
    if (!this._client) {
      const authProvider = await createAuthProvider(this.config);
      const region = getRegion(this.config);

      this._client = new GenerativeAiInferenceClient({
        authenticationDetailsProvider: authProvider,
      });

      this._client.region = region;

      if (this.config.endpoint) {
        this._client.endpoint = this.config.endpoint;
      }
    }

    return this._client;
  }

  async doEmbed(options: EmbeddingModelV3CallOptions): Promise<EmbeddingModelV3CallOutput> {
    const { values } = options;

    // Validate batch size
    if (values.length > this.maxEmbeddingsPerCall) {
      throw new Error(
        `Batch size (${values.length}) exceeds maximum allowed (${this.maxEmbeddingsPerCall})`
      );
    }

    const client = await this.getClient();
    const compartmentId = getCompartmentId(this.config);
    const metadata = getEmbeddingModelMetadata(this.modelId);

    // Build OCI request
    const request = {
      embedTextDetails: {
        servingMode: {
          servingType: 'ON_DEMAND',
          modelId: this.modelId,
        },
        compartmentId,
        inputs: values,
        truncate: this.config.truncate || 'END',
        inputType: this.config.inputType || 'DOCUMENT',
      },
    };

    // Call OCI API
    const response = await client.embedText(request);

    // Convert OCI response to AI SDK format
    const embeddings = response.embedTextResult.embeddings.map((emb: any) => emb);

    return {
      embeddings,
      usage: {
        tokens: values.reduce((sum, text) => sum + Math.ceil(text.length / 4), 0),
      },
    };
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test src/embedding-models/__tests__/OCIEmbeddingModel.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/embedding-models/OCIEmbeddingModel.ts src/embedding-models/__tests__/OCIEmbeddingModel.test.ts
git commit -m "feat(embeddings): implement OCIEmbeddingModel class"
```

---

## Task 3: Wire Up Embedding Models to Provider

**Files:**

- Modify: `packages/oci-genai-provider/src/provider.ts`
- Modify: `packages/oci-genai-provider/src/__tests__/provider.test.ts`

**Step 1: Write test for provider.embeddingModel()**

Add to `packages/oci-genai-provider/src/__tests__/provider.test.ts`:

```typescript
describe('OCIProvider - Embeddings', () => {
  it('should create embedding model', () => {
    const provider = new OCIProvider({ region: 'eu-frankfurt-1' });
    const model = provider.embeddingModel('cohere.embed-multilingual-v3.0');

    expect(model).toBeDefined();
    expect(model.provider).toBe('oci-genai');
    expect(model.modelId).toBe('cohere.embed-multilingual-v3.0');
  });

  it('should merge config with embedding-specific settings', () => {
    const provider = new OCIProvider({ region: 'eu-frankfurt-1' });
    const model = provider.embeddingModel('cohere.embed-english-light-v3.0', {
      dimensions: 384,
      truncate: 'START',
    });

    expect(model).toBeDefined();
  });

  it('should throw for invalid embedding model ID', () => {
    const provider = new OCIProvider();

    expect(() => {
      provider.embeddingModel('invalid-model');
    }).toThrow('Invalid embedding model ID');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/__tests__/provider.test.ts`
Expected: FAIL - "Embedding models not yet implemented"

**Step 3: Update OCIProvider to wire up embeddings**

Modify `packages/oci-genai-provider/src/provider.ts`:

```typescript
import { OCIEmbeddingModel } from './embedding-models/OCIEmbeddingModel';

export class OCIProvider implements ProviderV3 {
  // ... existing code ...

  /**
   * Create an embedding model instance
   */
  embeddingModel(modelId: string, settings?: OCIEmbeddingSettings): EmbeddingModelV3 {
    const mergedConfig = { ...this.config, ...settings };
    return new OCIEmbeddingModel(modelId, mergedConfig);
  }

  // ... rest of the code ...
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test src/__tests__/provider.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/provider.ts src/__tests__/provider.test.ts
git commit -m "feat(embeddings): wire up embedding models to provider"
```

---

## Task 4: Export Embedding Models from Index

**Files:**

- Modify: `packages/oci-genai-provider/src/index.ts`

**Step 1: Write test for exports**

Add to `packages/oci-genai-provider/src/__tests__/provider.test.ts`:

```typescript
import { oci } from '../index';

describe('Embedding Model Exports', () => {
  it('should create embedding from default oci instance', () => {
    const model = oci.embeddingModel('cohere.embed-multilingual-v3.0');

    expect(model).toBeDefined();
    expect(model.modelId).toBe('cohere.embed-multilingual-v3.0');
  });
});
```

**Step 2: Run test to verify it works (should already pass)**

Run: `pnpm test`
Expected: PASS

**Step 3: Add embedding exports to index.ts**

Modify `packages/oci-genai-provider/src/index.ts`:

```typescript
// Add to existing exports:

// Embedding model exports
export { OCIEmbeddingModel } from './embedding-models/OCIEmbeddingModel';
export {
  getEmbeddingModelMetadata,
  isValidEmbeddingModelId,
  getAllEmbeddingModels,
} from './embedding-models/registry';
export type { EmbeddingModelMetadata } from './embedding-models/registry';
```

**Step 4: Run type check**

Run: `pnpm type-check`
Expected: No errors

**Step 5: Commit**

```bash
git add src/index.ts
git commit -m "feat(embeddings): export embedding models from index"
```

---

## Task 5: Create RAG Example

**Files:**

- Create: `examples/rag-demo/`
- Create: `examples/rag-demo/index.ts`
- Create: `examples/rag-demo/package.json`

**Step 1: Create RAG demo package**

Create: `examples/rag-demo/package.json`

```json
{
  "name": "rag-demo",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "tsx index.ts"
  },
  "dependencies": {
    "@acedergren/oci-genai-provider": "workspace:*",
    "ai": "^6.0.57"
  },
  "devDependencies": {
    "tsx": "^4.19.2"
  }
}
```

**Step 2: Create RAG demo script**

Create: `examples/rag-demo/index.ts`

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { embed, embedMany } from 'ai';

async function main() {
  console.log('🔹 OCI Embedding Demo - Simple RAG\n');

  // Sample documents
  const documents = [
    'The capital of France is Paris.',
    'Python is a popular programming language.',
    'The Pacific Ocean is the largest ocean.',
    'Claude is an AI assistant made by Anthropic.',
  ];

  console.log('📚 Documents:');
  documents.forEach((doc, i) => console.log(`  ${i + 1}. ${doc}`));

  // Create embedding model
  const embeddingModel = oci.embeddingModel('cohere.embed-multilingual-v3.0');

  console.log('\n🧮 Generating embeddings...');

  // Embed all documents
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: documents,
  });

  console.log(`✅ Generated ${embeddings.length} embeddings`);
  console.log(`   Dimensions: ${embeddings[0].length}`);

  // Query
  const query = 'What is the largest ocean?';
  console.log(`\n🔍 Query: "${query}"`);

  // Embed query
  const { embedding: queryEmbedding } = await embed({
    model: embeddingModel,
    value: query,
  });

  // Find most similar (cosine similarity)
  const similarities = embeddings.map((docEmb) => cosineSimilarity(queryEmbedding, docEmb));

  const bestMatch = similarities.indexOf(Math.max(...similarities));

  console.log('\n📊 Results:');
  documents.forEach((doc, i) => {
    console.log(`  ${i + 1}. [${(similarities[i] * 100).toFixed(1)}%] ${doc}`);
  });

  console.log(`\n🎯 Best match: "${documents[bestMatch]}"`);
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

main().catch(console.error);
```

**Step 3: Test RAG demo**

```bash
cd examples/rag-demo
pnpm install
pnpm start
```

Expected: Demo runs and shows similarity scores

**Step 4: Commit**

```bash
git add examples/rag-demo/
git commit -m "feat(embeddings): add RAG example demo"
```

---

## Task 6: Update Documentation

**Files:**

- Modify: `packages/oci-genai-provider/README.md`
- Create: `docs/embeddings.md`

**Step 1: Add embeddings section to README**

Add to `packages/oci-genai-provider/README.md`:

```markdown
## Embeddings

Generate text embeddings for semantic search and RAG:

\`\`\`typescript
import { oci } from '@acedergren/oci-genai-provider';
import { embed, embedMany } from 'ai';

// Single embedding
const { embedding } = await embed({
model: oci.embeddingModel('cohere.embed-multilingual-v3.0'),
value: 'Hello world',
});

// Batch embeddings (up to 96 texts)
const { embeddings } = await embedMany({
model: oci.embeddingModel('cohere.embed-multilingual-v3.0'),
values: ['Text 1', 'Text 2', 'Text 3'],
});
\`\`\`

### Available Embedding Models

| Model ID                          | Dimensions | Max Batch | Use Case                     |
| --------------------------------- | ---------- | --------- | ---------------------------- |
| `cohere.embed-multilingual-v3.0`  | 1024       | 96        | Multilingual semantic search |
| `cohere.embed-english-v3.0`       | 1024       | 96        | English semantic search      |
| `cohere.embed-english-light-v3.0` | 384        | 96        | Fast English embeddings      |

### Embedding Options

\`\`\`typescript
oci.embeddingModel('cohere.embed-multilingual-v3.0', {
truncate: 'END', // 'START' | 'END' | 'NONE'
inputType: 'DOCUMENT', // 'QUERY' | 'DOCUMENT'
dimensions: 1024, // 384 | 1024
});
\`\`\`
```

**Step 2: Create detailed embeddings guide**

Create: `docs/embeddings.md`

```markdown
# Embeddings Guide

## Overview

OCI GenAI embeddings convert text into numerical vectors for semantic search, clustering, and RAG applications.

## Quick Start

\`\`\`typescript
import { oci } from '@acedergren/oci-genai-provider';
import { embedMany } from 'ai';

const { embeddings } = await embedMany({
model: oci.embeddingModel('cohere.embed-multilingual-v3.0'),
values: ['text 1', 'text 2', 'text 3'],
});
\`\`\`

## Configuration

### Input Type Optimization

- `QUERY`: Optimize for short search queries
- `DOCUMENT`: Optimize for longer documents (default)

### Truncation Strategy

- `END`: Truncate from end (default)
- `START`: Truncate from start
- `NONE`: Error if text exceeds limit

## Best Practices

1. Use batch embedding for multiple texts (more efficient)
2. Choose `inputType` based on your use case
3. Light models (384 dims) are faster but less accurate
4. Standard models (1024 dims) for production RAG

## Examples

See `examples/rag-demo/` for a complete RAG implementation.
```

**Step 3: Commit**

```bash
git add README.md docs/embeddings.md
git commit -m "docs(embeddings): add comprehensive embedding documentation"
```

---

## Verification Checklist

After completing all tasks:

- [ ] `pnpm test` - All embedding tests pass
- [ ] `pnpm type-check` - No TypeScript errors
- [ ] `pnpm build` - Build succeeds
- [ ] RAG demo works: `cd examples/rag-demo && pnpm start`
- [ ] Embedding model registry returns correct metadata
- [ ] `oci.embeddingModel()` creates valid models
- [ ] Batch size validation works (max 96)
- [ ] Documentation complete and accurate

---

## Next Steps

**Plan 2 Complete!** 🎉

Embeddings are now fully functional. Continue with:

- **Plan 3**: Speech Models (TTS) - Can run in parallel
- **Plan 4**: Transcription Models (STT) - Can run in parallel
- **Plan 5**: Reranking Models - Can run in parallel
