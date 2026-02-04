# Reranking Guide

## Overview

Reranking improves retrieval precision by re-scoring documents based on semantic relevance to the query. This is especially powerful when combined with embedding-based retrieval.

## Quick Start

```typescript
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
//   { index: 2, relevanceScore: 0.95 },
//   { index: 1, relevanceScore: 0.87 }
// ]
```

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

```
Query → Embeddings (retrieve top 50) → Reranking (top 5) → LLM
         Fast retrieval                  Precise ranking
```

### Implementation Pattern

```typescript
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
const finalDocs = ranking.map((r) => candidates[r.index]);
```

## Configuration Options

### topN

- Limit results to top N documents
- Default: returns all documents ranked
- Use for focusing on most relevant results

### returnDocuments

- Include document text in response
- Default: false (only indices and scores)
- Set true if you need the text in response

## Available Reranking Models

| Model ID             | Max Documents | Multilingual | Use Case                 |
| -------------------- | ------------- | ------------ | ------------------------ |
| `cohere.rerank-v3.5` | 1000          | Yes          | Production RAG reranking |

## Best Practices

1. **Use two-stage retrieval**: Embeddings for recall, reranking for precision
2. **Optimal topK/topN ratio**: Retrieve 10-50 candidates, rerank to 3-10 results
3. **Query formulation**: Clear, specific queries get better reranking results
4. **Document size**: Break large documents into chunks before reranking
5. **Performance**: Reranking 50 docs is fast; 1000 docs may be slower

## Examples

### Basic Reranking

```typescript
const { ranking } = await rerank({
  model: oci.rerankingModel('cohere.rerank-v3.5'),
  query: 'machine learning frameworks',
  documents: ['PyTorch...', 'TensorFlow...', 'Scikit-learn...'],
});
```

### Enhanced RAG

See `examples/rag-reranking-demo/index.ts` for a complete two-stage RAG pipeline.

## Limitations

- Max 1000 documents per request
- Query length limited to 2048 characters
- Only supports text documents (no JSON objects)

## Integration with Embeddings

Reranking works best when combined with embeddings:

- Use embeddings for initial retrieval (fast, good recall)
- Use reranking for final precision (accurate, semantic understanding)
- Together they create a production-ready RAG pipeline

## Response Format

The reranking response includes:

```typescript
interface RerankingResponse {
  ranking: Array<{
    index: number; // Index of the document in input array
    relevanceScore: number; // Score between 0 and 1
  }>;
  response?: {
    id?: string; // Request ID
    modelId?: string; // Model used
    timestamp?: Date; // Response timestamp
  };
}
```

## Next Steps

- [Embeddings Guide](./embeddings.md) - Combine with embeddings for powerful RAG
- [Language Models Guide](./language-models.md) - Generate responses with LLMs
- [Examples](../../examples/) - Working implementations
