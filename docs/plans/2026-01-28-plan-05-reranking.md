# Plan 5: Reranking Models Implementation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add complete reranking model support using OCI GenAI rerank API with RerankingModelV3 interface for enhanced RAG pipelines.

**Architecture:** Implement OCIRerankingModel class that reranks documents based on query relevance using Cohere Rerank 3.5 on OCI. Converts query + documents to OCI rerank API format and returns ranked documents with relevance scores.

**Tech Stack:** TypeScript, @ai-sdk/provider@^3.0.5, OCI GenerativeAiInferenceClient, Jest

---

## Prerequisites

**Required:**

- ✅ Plan 1 must be complete
- Provider implements ProviderV3 interface
- Shared utilities in `src/shared/` folder

**Recommended:**

- Plan 2 (Embeddings) enhances RAG when combined with reranking

---

## Task 1: Create Reranking Model Registry

**Files:**

- Create: `packages/oci-genai-provider/src/reranking-models/registry.ts`
- Create: `packages/oci-genai-provider/src/reranking-models/__tests__/registry.test.ts`

**Step 1: Write test for reranking model registry**

Create: `packages/oci-genai-provider/src/reranking-models/__tests__/registry.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';
import {
  getRerankingModelMetadata,
  isValidRerankingModelId,
  getAllRerankingModels,
} from '../registry';

describe('Reranking Model Registry', () => {
  it('should validate Cohere reranking model IDs', () => {
    expect(isValidRerankingModelId('cohere.rerank-v3.5')).toBe(true);
    expect(isValidRerankingModelId('invalid-model')).toBe(false);
  });

  it('should return metadata for valid reranking models', () => {
    const metadata = getRerankingModelMetadata('cohere.rerank-v3.5');

    expect(metadata).toBeDefined();
    expect(metadata?.id).toBe('cohere.rerank-v3.5');
    expect(metadata?.family).toBe('cohere');
    expect(metadata?.maxDocuments).toBeGreaterThan(0);
  });

  it('should return undefined for invalid model IDs', () => {
    const metadata = getRerankingModelMetadata('invalid-model');
    expect(metadata).toBeUndefined();
  });

  it('should list all reranking models', () => {
    const models = getAllRerankingModels();

    expect(models.length).toBeGreaterThan(0);
    expect(models.every((m) => m.family === 'cohere')).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/reranking-models/__tests__/registry.test.ts`
Expected: FAIL - "Cannot find module '../registry'"

**Step 3: Implement reranking model registry**

Create: `packages/oci-genai-provider/src/reranking-models/registry.ts`

```typescript
export interface RerankingModelMetadata {
  id: string;
  name: string;
  family: 'cohere';
  maxDocuments: number;
  maxQueryLength: number;
  supportsMultilingual: boolean;
}

export const RERANKING_MODELS: RerankingModelMetadata[] = [
  {
    id: 'cohere.rerank-v3.5',
    name: 'Cohere Rerank v3.5',
    family: 'cohere',
    maxDocuments: 1000,
    maxQueryLength: 2048,
    supportsMultilingual: true,
  },
];

export function isValidRerankingModelId(modelId: string): boolean {
  return RERANKING_MODELS.some((m) => m.id === modelId);
}

export function getRerankingModelMetadata(modelId: string): RerankingModelMetadata | undefined {
  return RERANKING_MODELS.find((m) => m.id === modelId);
}

export function getAllRerankingModels(): RerankingModelMetadata[] {
  return RERANKING_MODELS;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test src/reranking-models/__tests__/registry.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/reranking-models/
git commit -m "feat(reranking): add reranking model registry"
```

---

## Task 2: Implement OCIRerankingModel Class

**Files:**

- Create: `packages/oci-genai-provider/src/reranking-models/OCIRerankingModel.ts`
- Create: `packages/oci-genai-provider/src/reranking-models/__tests__/OCIRerankingModel.test.ts`

**Step 1: Write test for OCIRerankingModel**

Create: `packages/oci-genai-provider/src/reranking-models/__tests__/OCIRerankingModel.test.ts`

```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { OCIRerankingModel } from '../OCIRerankingModel';
import type { RerankingModelV3CallOptions } from '@ai-sdk/provider';

// Mock OCI SDK
jest.mock('oci-generativeaiinference');
jest.mock('../../auth');

describe('OCIRerankingModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have correct specification version and provider', () => {
    const model = new OCIRerankingModel('cohere.rerank-v3.5', {
      compartmentId: 'ocid1.compartment.test',
    });

    expect(model.specificationVersion).toBe('v3');
    expect(model.provider).toBe('oci-genai');
    expect(model.modelId).toBe('cohere.rerank-v3.5');
  });

  it('should throw error for invalid model ID', () => {
    expect(() => {
      new OCIRerankingModel('invalid-model', {});
    }).toThrow('Invalid reranking model ID');
  });

  it('should validate document count does not exceed max', async () => {
    const model = new OCIRerankingModel('cohere.rerank-v3.5', {
      compartmentId: 'test',
    });

    const documents = Array(1001).fill('test'); // 1001 > 1000 max

    const options: RerankingModelV3CallOptions = {
      query: 'test query',
      documents: {
        type: 'text',
        values: documents,
      },
    };

    await expect(model.doRerank(options)).rejects.toThrow(
      'Document count (1001) exceeds maximum allowed (1000)'
    );
  });

  it('should handle text documents', () => {
    const model = new OCIRerankingModel('cohere.rerank-v3.5', {
      compartmentId: 'test',
    });

    expect(model).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/reranking-models/__tests__/OCIRerankingModel.test.ts`
Expected: FAIL - "Cannot find module '../OCIRerankingModel'"

**Step 3: Implement OCIRerankingModel class**

Create: `packages/oci-genai-provider/src/reranking-models/OCIRerankingModel.ts`

```typescript
import { RerankingModelV3, RerankingModelV3CallOptions } from '@ai-sdk/provider';
import { GenerativeAiInferenceClient } from 'oci-generativeaiinference';
import { createAuthProvider, getCompartmentId, getRegion } from '../auth';
import { getRerankingModelMetadata, isValidRerankingModelId } from './registry';
import type { OCIRerankingSettings } from '../types';

export class OCIRerankingModel implements RerankingModelV3 {
  readonly specificationVersion = 'v3';
  readonly provider = 'oci-genai';

  private _client?: GenerativeAiInferenceClient;

  constructor(
    readonly modelId: string,
    private config: OCIRerankingSettings
  ) {
    if (!isValidRerankingModelId(modelId)) {
      throw new Error(
        `Invalid reranking model ID: ${modelId}. ` + `Valid models: cohere.rerank-v3.5`
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

  async doRerank(options: RerankingModelV3CallOptions): Promise<{
    ranking: Array<{
      index: number;
      relevanceScore: number;
    }>;
    response?: {
      id?: string;
      timestamp?: Date;
      modelId?: string;
    };
  }> {
    const { query, documents, topN } = options;

    // Validate we only support text documents
    if (documents.type !== 'text') {
      throw new Error(`OCI reranking only supports text documents, got: ${documents.type}`);
    }

    const documentTexts = documents.values;
    const metadata = getRerankingModelMetadata(this.modelId);

    // Validate document count
    if (metadata && documentTexts.length > metadata.maxDocuments) {
      throw new Error(
        `Document count (${documentTexts.length}) exceeds maximum allowed (${metadata.maxDocuments})`
      );
    }

    const client = await this.getClient();
    const compartmentId = getCompartmentId(this.config);

    // Build OCI request
    const request = {
      rerankTextDetails: {
        servingMode: {
          servingType: 'ON_DEMAND',
          modelId: this.modelId,
        },
        compartmentId,
        input: query,
        documents: documentTexts,
        topN: topN ?? this.config.topN,
        isEcho: this.config.returnDocuments ?? false,
      },
    };

    // Call OCI API
    const response = await client.rerankText(request);

    // Convert OCI response to AI SDK format
    const ranking = response.rerankTextResult.documentRanks.map((rank: any) => ({
      index: rank.index ?? 0,
      relevanceScore: rank.relevanceScore ?? 0,
    }));

    return {
      ranking,
      response: {
        id: response.rerankTextResult.id,
        modelId: response.rerankTextResult.modelId,
      },
    };
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test src/reranking-models/__tests__/OCIRerankingModel.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/reranking-models/OCIRerankingModel.ts src/reranking-models/__tests__/OCIRerankingModel.test.ts
git commit -m "feat(reranking): implement OCIRerankingModel class"
```

---

## Task 3: Wire Up Reranking Models to Provider

**Files:**

- Modify: `packages/oci-genai-provider/src/provider.ts`
- Modify: `packages/oci-genai-provider/src/__tests__/provider.test.ts`

**Step 1: Write test for provider.rerankingModel()**

Add to `packages/oci-genai-provider/src/__tests__/provider.test.ts`:

```typescript
describe('OCIProvider - Reranking', () => {
  it('should create reranking model', () => {
    const provider = new OCIProvider({ region: 'eu-frankfurt-1' });
    const model = provider.rerankingModel('cohere.rerank-v3.5');

    expect(model).toBeDefined();
    expect(model.provider).toBe('oci-genai');
    expect(model.modelId).toBe('cohere.rerank-v3.5');
  });

  it('should merge config with reranking-specific settings', () => {
    const provider = new OCIProvider({ region: 'eu-frankfurt-1' });
    const model = provider.rerankingModel('cohere.rerank-v3.5', {
      topN: 5,
      returnDocuments: true,
    });

    expect(model).toBeDefined();
  });

  it('should throw for invalid reranking model ID', () => {
    const provider = new OCIProvider();

    expect(() => {
      provider.rerankingModel('invalid-model');
    }).toThrow('Invalid reranking model ID');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/__tests__/provider.test.ts`
Expected: FAIL - "Reranking models not yet implemented"

**Step 3: Update OCIProvider to wire up reranking**

Modify `packages/oci-genai-provider/src/provider.ts`:

```typescript
import { OCIRerankingModel } from './reranking-models/OCIRerankingModel';

export class OCIProvider implements ProviderV3 {
  // ... existing code ...

  /**
   * Create a reranking model instance
   */
  rerankingModel(modelId: string, settings?: OCIRerankingSettings): RerankingModelV3 {
    const mergedConfig = { ...this.config, ...settings };
    return new OCIRerankingModel(modelId, mergedConfig);
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
git commit -m "feat(reranking): wire up reranking models to provider"
```

---

## Task 4: Export Reranking Models from Index

**Files:**

- Modify: `packages/oci-genai-provider/src/index.ts`

**Step 1: Write test for exports**

Add to `packages/oci-genai-provider/src/__tests__/provider.test.ts`:

```typescript
import { oci } from '../index';

describe('Reranking Model Exports', () => {
  it('should create reranking model from default oci instance', () => {
    const model = oci.rerankingModel('cohere.rerank-v3.5');

    expect(model).toBeDefined();
    expect(model.modelId).toBe('cohere.rerank-v3.5');
  });
});
```

**Step 2: Run test to verify it works (should already pass)**

Run: `pnpm test`
Expected: PASS

**Step 3: Add reranking exports to index.ts**

Modify `packages/oci-genai-provider/src/index.ts`:

```typescript
// Add to existing exports:

// Reranking model exports
export { OCIRerankingModel } from './reranking-models/OCIRerankingModel';
export {
  getRerankingModelMetadata,
  isValidRerankingModelId,
  getAllRerankingModels,
} from './reranking-models/registry';
export type { RerankingModelMetadata } from './reranking-models/registry';
```

**Step 4: Run type check**

Run: `pnpm type-check`
Expected: No errors

**Step 5: Commit**

```bash
git add src/index.ts
git commit -m "feat(reranking): export reranking models from index"
```

---

## Task 5: Create Enhanced RAG Example

**Files:**

- Create: `examples/rag-reranking-demo/`
- Create: `examples/rag-reranking-demo/index.ts`
- Create: `examples/rag-reranking-demo/package.json`

**Step 1: Create RAG reranking demo package**

Create: `examples/rag-reranking-demo/package.json`

```json
{
  "name": "rag-reranking-demo",
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

**Step 2: Create enhanced RAG demo script**

Create: `examples/rag-reranking-demo/index.ts`

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { embedMany, rerank } from 'ai';

async function main() {
  console.log('🔹 OCI Enhanced RAG Demo - Embeddings + Reranking\n');

  // Sample knowledge base
  const documents = [
    'The Pacific Ocean is the largest ocean on Earth, covering more than 63 million square miles.',
    'Paris is the capital city of France, known for the Eiffel Tower and Louvre Museum.',
    'Python is a high-level programming language created by Guido van Rossum in 1991.',
    "The Amazon rainforest produces 20% of the Earth's oxygen and is home to millions of species.",
    'Machine learning is a subset of artificial intelligence that enables systems to learn from data.',
    'The Great Wall of China stretches over 13,000 miles and was built over many centuries.',
    'JavaScript is a programming language primarily used for web development and browser scripting.',
    'Mount Everest is the highest mountain on Earth at 29,032 feet above sea level.',
    'React is a JavaScript library for building user interfaces, developed by Facebook.',
    'The Nile River is often considered the longest river in the world at approximately 4,135 miles.',
  ];

  console.log('📚 Knowledge Base:');
  documents.forEach((doc, i) => console.log(`  ${i + 1}. ${doc.substring(0, 70)}...`));

  const query = 'What are some programming languages?';
  console.log(`\n🔍 Query: "${query}"\n`);

  // Step 1: Initial retrieval with embeddings
  console.log('Step 1: Initial retrieval with embeddings...');
  const embeddingModel = oci.embeddingModel('cohere.embed-multilingual-v3.0');

  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: documents,
  });

  const { embedding: queryEmbedding } = await embedMany({
    model: embeddingModel,
    values: [query],
  }).then((result) => ({ embedding: result.embeddings[0] }));

  // Calculate cosine similarity
  const similarities = embeddings.map((docEmb) => cosineSimilarity(queryEmbedding, docEmb));

  // Get top 5 candidates
  const topK = 5;
  const candidateIndices = similarities
    .map((score, index) => ({ score, index }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((item) => item.index);

  const candidates = candidateIndices.map((i) => documents[i]);

  console.log(`✅ Retrieved top ${topK} candidates:`);
  candidates.forEach((doc, i) => {
    const originalIndex = candidateIndices[i];
    console.log(`  ${i + 1}. [${(similarities[originalIndex] * 100).toFixed(1)}%] ${doc}`);
  });

  // Step 2: Rerank candidates for final precision
  console.log('\nStep 2: Reranking candidates for precision...');
  const rerankingModel = oci.rerankingModel('cohere.rerank-v3.5');

  const { ranking } = await rerank({
    model: rerankingModel,
    query,
    documents: candidates,
    topN: 3,
  });

  console.log('✅ Reranked top 3 results:');
  ranking.forEach((rank, i) => {
    const doc = candidates[rank.index];
    console.log(`  ${i + 1}. [Score: ${rank.relevanceScore.toFixed(4)}] ${doc}`);
  });

  // Show the improvement
  console.log('\n📊 Comparison:');
  console.log('  Embedding-only top result:', candidates[0].substring(0, 80) + '...');
  console.log('  After reranking:', candidates[ranking[0].index].substring(0, 80) + '...');
  console.log('\n✨ Reranking improves precision by understanding semantic relevance!');
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

main().catch(console.error);
```

**Step 3: Test enhanced RAG demo**

```bash
cd examples/rag-reranking-demo
pnpm install
pnpm start
```

Expected: Demo runs showing two-stage retrieval

**Step 4: Commit**

```bash
git add examples/rag-reranking-demo/
git commit -m "feat(reranking): add enhanced RAG example with embeddings + reranking"
```

---

## Task 6: Update Documentation

**Files:**

- Modify: `packages/oci-genai-provider/README.md`
- Create: `docs/reranking.md`

**Step 1: Add reranking section to README**

Add to `packages/oci-genai-provider/README.md`:

```markdown
## Reranking

Improve RAG precision by reranking retrieved documents:

\`\`\`typescript
import { oci } from '@acedergren/oci-genai-provider';
import { rerank } from 'ai';

const { ranking } = await rerank({
model: oci.rerankingModel('cohere.rerank-v3.5'),
query: 'What is machine learning?',
documents: [
'Machine learning is a subset of AI...',
'Python is a programming language...',
'The ocean covers 71% of Earth...',
],
topN: 2,
});

// ranking = [
// { index: 0, relevanceScore: 0.98 },
// { index: 1, relevanceScore: 0.45 }
// ]
\`\`\`

### Available Reranking Models

| Model ID             | Max Documents | Multilingual | Use Case                 |
| -------------------- | ------------- | ------------ | ------------------------ |
| `cohere.rerank-v3.5` | 1000          | Yes          | Production RAG reranking |

### Reranking Options

\`\`\`typescript
oci.rerankingModel('cohere.rerank-v3.5', {
topN: 5, // Return only top 5 results
returnDocuments: true, // Include document text in response
});
\`\`\`

### Two-Stage RAG Pipeline

For best results, combine embeddings + reranking:

1. **First stage**: Use embeddings to retrieve top K candidates (fast, broad recall)
2. **Second stage**: Use reranking to find top N most relevant (precise, semantic understanding)

See `examples/rag-reranking-demo/` for a complete implementation.
```

**Step 2: Create detailed reranking guide**

Create: `docs/reranking.md`

```markdown
# Reranking Guide

## Overview

Reranking improves retrieval precision by re-scoring documents based on semantic relevance to the query. This is especially powerful when combined with embedding-based retrieval.

## Quick Start

\`\`\`typescript
import { oci } from '@acedergren/oci-genai-provider';
import { rerank } from 'ai';

const { ranking } = await rerank({
model: oci.rerankingModel('cohere.rerank-v3.5'),
query: 'What is the fastest programming language?',
documents: [
'Python is known for its simplicity.',
'Rust is designed for performance and safety.',
'C++ offers high performance for systems programming.',
],
topN: 2,
});

console.log(ranking);
// [
// { index: 2, relevanceScore: 0.95 },
// { index: 1, relevanceScore: 0.87 }
// ]
\`\`\`

## Why Use Reranking?

### Without Reranking (Embeddings Only)

- Fast similarity search
- Good recall (finds relevant documents)
- Can miss nuanced semantic meaning
- May rank documents with keyword overlap higher

### With Reranking (Two-Stage Pipeline)

- Combines speed of embeddings with precision of reranking
- Better semantic understanding
- Improved relevance for complex queries
- Higher quality results for RAG applications

## Two-Stage RAG Architecture

\`\`\`
Query → Embeddings (retrieve top 50) → Reranking (top 5) → LLM
Fast retrieval Precise ranking
\`\`\`

### Implementation Pattern

\`\`\`typescript
// Stage 1: Fast retrieval with embeddings
const { embeddings } = await embedMany({
model: oci.embeddingModel('cohere.embed-multilingual-v3.0'),
values: allDocuments, // e.g., 10,000 documents
});

const topK = 50; // Retrieve top 50 candidates
const candidates = findTopKSimilar(query, embeddings, topK);

// Stage 2: Precise reranking
const { ranking } = await rerank({
model: oci.rerankingModel('cohere.rerank-v3.5'),
query,
documents: candidates,
topN: 5, // Final top 5 results
});

// Use top 5 for LLM context
const finalDocs = ranking.map(r => candidates[r.index]);
\`\`\`

## Configuration Options

### topN

- Limit results to top N documents
- Default: returns all documents ranked
- Use for focusing on most relevant results

### returnDocuments

- Include document text in response
- Default: false (only indices and scores)
- Set true if you need the text in response

## Best Practices

1. **Use two-stage retrieval**: Embeddings for recall, reranking for precision
2. **Optimal topK/topN ratio**: Retrieve 10-50 candidates, rerank to 3-10 results
3. **Query formulation**: Clear, specific queries get better reranking results
4. **Document size**: Break large documents into chunks before reranking
5. **Performance**: Reranking 50 docs is fast; 1000 docs may be slower

## Examples

### Basic Reranking

\`\`\`typescript
const { ranking } = await rerank({
model: oci.rerankingModel('cohere.rerank-v3.5'),
query: 'machine learning frameworks',
documents: ['PyTorch...', 'TensorFlow...', 'Scikit-learn...'],
});
\`\`\`

### Enhanced RAG

See `examples/rag-reranking-demo/index.ts` for a complete two-stage RAG pipeline.

## Limitations

- Max 1000 documents per request
- Query length limited to 2048 characters
- Only supports text documents (no JSON objects)

## Integration with Plan 2 (Embeddings)

Reranking works best when combined with embeddings:

- Use Plan 2 embeddings for initial retrieval
- Use Plan 5 reranking for final precision
- Together they create a production-ready RAG pipeline
```

**Step 3: Commit**

```bash
git add README.md docs/reranking.md
git commit -m "docs(reranking): add comprehensive reranking documentation"
```

---

## Verification Checklist

After completing all tasks:

- [ ] `pnpm test` - All reranking tests pass
- [ ] `pnpm type-check` - No TypeScript errors
- [ ] `pnpm build` - Build succeeds
- [ ] RAG reranking demo works: `cd examples/rag-reranking-demo && pnpm start`
- [ ] Reranking model registry returns correct metadata
- [ ] `oci.rerankingModel()` creates valid models
- [ ] Document count validation works (max 1000)
- [ ] Ranking output format matches AI SDK spec
- [ ] Documentation complete and accurate

---

## Next Steps

**Plan 5 Complete!** 🎉

Reranking is now fully functional. Your provider supports:

- ✅ Language Models (Plan 1)
- ✅ Embeddings (Plan 2)
- ✅ Reranking (Plan 5)

Continue with:

- **Plan 3**: Speech Models (TTS) - Can run in parallel
- **Plan 4**: Transcription Models (STT) - Can run in parallel

**Production RAG Stack**: Combine Plans 1, 2, and 5 for a complete RAG pipeline:

1. Embed documents (Plan 2)
2. Retrieve candidates (Plan 2)
3. Rerank for precision (Plan 5)
4. Generate response (Plan 1)
