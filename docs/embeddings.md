# Embeddings Guide

## Overview

OCI GenAI embeddings convert text into numerical vectors (embeddings) for semantic search, clustering, and Retrieval-Augmented Generation (RAG) applications. Use Cohere's latest embedding models running on OCI infrastructure.

## Quick Start

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { embedMany } from 'ai';

const { embeddings } = await embedMany({
  model: oci.embeddingModel('cohere.embed-multilingual-v3.0'),
  values: ['text 1', 'text 2', 'text 3'],
});
```

## Configuration

### Creating an Embedding Model

```typescript
import { oci } from '@acedergren/oci-genai-provider';

// Default configuration
const model = oci.embeddingModel('cohere.embed-multilingual-v3.0');

// Custom configuration
const customModel = oci.embeddingModel('cohere.embed-english-v3.0', {
  region: 'us-ashburn-1',
  compartmentId: 'ocid1.compartment.oc1..test',
  truncate: 'END',
  inputType: 'DOCUMENT',
});
```

### Configuration Options

```typescript
interface OCIEmbeddingSettings {
  // OCI Configuration
  region?: string;                  // Default: 'eu-frankfurt-1'
  profile?: string;                 // Default: 'DEFAULT'
  auth?: 'config_file' | 'instance_principal' | 'resource_principal';
  configPath?: string;              // Default: '~/.oci/config'
  compartmentId?: string;           // Required or via environment
  endpoint?: string;                // Custom endpoint for testing
  
  // Embedding-specific options
  truncate?: 'START' | 'END' | 'NONE';  // Default: 'END'
  inputType?: 'QUERY' | 'DOCUMENT';     // Default: 'DOCUMENT'
  dimensions?: 384 | 1024;               // Model dependent
}
```

## Available Models

### Cohere Embed Multilingual v3.0

```typescript
const model = oci.embeddingModel('cohere.embed-multilingual-v3.0');
```

**Best for:** Multilingual applications, cross-language search

| Property | Value |
|----------|-------|
| Dimensions | 1024 |
| Context Length | 512 tokens |
| Max Batch | 96 texts |
| Languages | 100+ |
| Speed | Medium |

### Cohere Embed English v3.0

```typescript
const model = oci.embeddingModel('cohere.embed-english-v3.0');
```

**Best for:** English-only applications requiring highest accuracy

| Property | Value |
|----------|-------|
| Dimensions | 1024 |
| Context Length | 512 tokens |
| Max Batch | 96 texts |
| Languages | English |
| Speed | Medium |

### Cohere Embed English Light v3.0

```typescript
const model = oci.embeddingModel('cohere.embed-english-light-v3.0');
```

**Best for:** Fast embeddings when speed is priority over accuracy

| Property | Value |
|----------|-------|
| Dimensions | 384 |
| Context Length | 512 tokens |
| Max Batch | 96 texts |
| Languages | English |
| Speed | Fast |

## API Usage

### Single Embedding

```typescript
import { embed } from 'ai';

const { embedding, usage } = await embed({
  model: oci.embeddingModel('cohere.embed-multilingual-v3.0'),
  value: 'What is the meaning of life?',
});

console.log(`Embedding dimensions: ${embedding.length}`);
console.log(`Tokens used: ${usage.tokens}`);
```

### Batch Embeddings

```typescript
import { embedMany } from 'ai';

const texts = [
  'The quick brown fox jumps over the lazy dog.',
  'A journey of a thousand miles begins with a single step.',
  'To be or not to be, that is the question.',
];

const { embeddings, usage } = await embedMany({
  model: oci.embeddingModel('cohere.embed-multilingual-v3.0'),
  values: texts,
});

console.log(`Generated ${embeddings.length} embeddings`);
console.log(`Total tokens used: ${usage.tokens}`);
```

## Input Type Optimization

The `inputType` parameter helps the model optimize embeddings for your use case:

### DOCUMENT (Default)

Use when embedding longer, context-rich text:

```typescript
const model = oci.embeddingModel('cohere.embed-english-v3.0', {
  inputType: 'DOCUMENT',
});

const { embeddings } = await embedMany({
  model,
  values: [
    'The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris, France.',
    'Artificial Intelligence (AI) is intelligence demonstrated by machines...',
  ],
});
```

### QUERY

Use when embedding short search queries:

```typescript
const model = oci.embeddingModel('cohere.embed-english-v3.0', {
  inputType: 'QUERY',
});

const { embedding } = await embed({
  model,
  value: 'What is artificial intelligence?', // Short query
});
```

**Best practice:** Use DOCUMENT for your knowledge base and QUERY when embedding search queries, even if using the same model.

## Truncation Strategy

The `truncate` parameter controls how the model handles text exceeding the token limit (512 tokens):

### END (Default)

Truncate from the end - preserves beginning of text:

```typescript
const model = oci.embeddingModel('cohere.embed-english-v3.0', {
  truncate: 'END',
});

// If text exceeds 512 tokens, last tokens are discarded
const { embedding } = await embed({
  model,
  value: 'Very long document that might exceed token limit...',
});
```

### START

Truncate from the start - preserves end of text:

```typescript
const model = oci.embeddingModel('cohere.embed-english-v3.0', {
  truncate: 'START',
});

// If text exceeds 512 tokens, first tokens are discarded
const { embedding } = await embed({
  model,
  value: 'Beginning text is discarded if too long, ending is preserved...',
});
```

### NONE

Error if text exceeds limit - strict validation:

```typescript
const model = oci.embeddingModel('cohere.embed-english-v3.0', {
  truncate: 'NONE',
});

try {
  const { embedding } = await embed({
    model,
    value: 'Very long document that exceeds 512 tokens...',
  });
} catch (error) {
  console.error('Text exceeds token limit'); // Error thrown
}
```

## Dimension Selection

Some models support variable dimensions:

```typescript
// 384 dimensions - smaller, faster, less accurate
const lightModel = oci.embeddingModel('cohere.embed-english-light-v3.0', {
  dimensions: 384,
});

// 1024 dimensions - larger, slower, more accurate
const standardModel = oci.embeddingModel('cohere.embed-english-v3.0', {
  dimensions: 1024,
});
```

## Common Use Cases

### Semantic Search

Find relevant documents based on query similarity:

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { embedMany, embed } from 'ai';

// 1. Index your documents
const documents = [
  'The sky is blue.',
  'Grass is green.',
  'The sea is also blue.',
];

const { embeddings: docEmbeddings } = await embedMany({
  model: oci.embeddingModel('cohere.embed-multilingual-v3.0'),
  values: documents,
});

// 2. Embed search query
const query = 'What color is the ocean?';
const { embedding: queryEmbedding } = await embed({
  model: oci.embeddingModel('cohere.embed-multilingual-v3.0'),
  value: query,
});

// 3. Calculate similarity and rank results
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

const similarities = docEmbeddings.map((docEmb) =>
  cosineSimilarity(queryEmbedding, docEmb)
);

const results = documents
  .map((doc, i) => ({ doc, similarity: similarities[i] }))
  .sort((a, b) => b.similarity - a.similarity);

console.log('Search results:');
results.forEach(({ doc, similarity }) => {
  console.log(`${(similarity * 100).toFixed(1)}% - ${doc}`);
});
```

### Retrieval-Augmented Generation (RAG)

Combine embeddings with language models for knowledge-grounded responses:

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { embedMany, embed, generateText } from 'ai';

// 1. Create a knowledge base
const knowledgeBase = [
  'Python was created by Guido van Rossum in 1989.',
  'JavaScript is primarily used for web development.',
  'TypeScript adds static typing to JavaScript.',
  'Rust is known for memory safety without garbage collection.',
];

// 2. Index documents
const { embeddings } = await embedMany({
  model: oci.embeddingModel('cohere.embed-multilingual-v3.0'),
  values: knowledgeBase,
});

// 3. Process user query
const userQuery = 'Who created Python?';
const { embedding } = await embed({
  model: oci.embeddingModel('cohere.embed-multilingual-v3.0'),
  value: userQuery,
});

// 4. Find relevant documents
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

const similarities = embeddings.map((docEmb) => cosineSimilarity(embedding, docEmb));
const topDocIndex = similarities.indexOf(Math.max(...similarities));
const relevantContext = knowledgeBase[topDocIndex];

// 5. Generate answer using language model + context
const { text } = await generateText({
  model: oci.languageModel('cohere.command-r-plus'),
  system: `You are a helpful assistant. Answer based on the provided context.
Context: ${relevantContext}`,
  prompt: userQuery,
});

console.log(`Answer: ${text}`);
```

### Clustering

Group similar documents together:

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { embedMany } from 'ai';

const documents = [
  'I love playing soccer.',
  'Basketball is my favorite sport.',
  'Running marathons is challenging.',
  'Pizza is delicious.',
  'Cooking healthy meals is fun.',
];

const { embeddings } = await embedMany({
  model: oci.embeddingModel('cohere.embed-multilingual-v3.0'),
  values: documents,
});

// Simple clustering: group by similarity
function clusterDocuments(
  docs: string[],
  embeddings: number[][],
  threshold: number
) {
  const clusters: string[][] = [];

  for (let i = 0; i < docs.length; i++) {
    let foundCluster = false;

    for (const cluster of clusters) {
      const clusterEmb = embeddings[docs.indexOf(cluster[0])];
      const similarity = cosineSimilarity(embeddings[i], clusterEmb);

      if (similarity > threshold) {
        cluster.push(docs[i]);
        foundCluster = true;
        break;
      }
    }

    if (!foundCluster) {
      clusters.push([docs[i]]);
    }
  }

  return clusters;
}

const clusters = clusterDocuments(documents, embeddings, 0.7);
clusters.forEach((cluster, i) => {
  console.log(`Cluster ${i + 1}:`, cluster);
});
```

## Error Handling

```typescript
import {
  OCIGenAIError,
  NetworkError,
  AuthenticationError,
} from '@acedergren/oci-genai-provider';

try {
  const { embedding } = await embed({
    model: oci.embeddingModel('cohere.embed-multilingual-v3.0'),
    value: 'Hello world',
  });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Check your OCI credentials');
  } else if (error instanceof NetworkError) {
    console.error(`Network error: ${error.code}`);
  } else if (error instanceof OCIGenAIError) {
    console.error(`OCI error: ${error.message}`);
  }
}
```

## Best Practices

1. **Choose the right model**
   - Use multilingual v3 for multi-language applications
   - Use English v3 for English-only, highest accuracy
   - Use English Light v3 for speed-critical applications

2. **Batch embed when possible**
   - Batch up to 96 texts per request
   - More efficient than individual requests

3. **Optimize input type**
   - Use DOCUMENT for indexing long texts
   - Use QUERY for search queries

4. **Handle long texts**
   - Be aware of 512 token limit
   - Choose truncation strategy (START, END, or NONE)
   - Consider chunking very long documents

5. **Cache embeddings**
   - Store computed embeddings in a vector database
   - Reuse for multiple searches

6. **Monitor token usage**
   - Track `usage.tokens` in responses
   - Plan for scaling costs

7. **Test similarity threshold**
   - Not all scores above 0.5 are meaningful
   - Test with your domain-specific content

## Examples

See [RAG Demo Example](../examples/rag-demo) for a complete working example demonstrating:
- Embedding documents
- Searching with semantic similarity
- Finding most relevant results

## Limitations

- **Batch size**: Maximum 96 texts per request
- **Token limit**: 512 tokens per text (truncates automatically)
- **Dimensions**: Fixed per model (384 or 1024)
- **Rate limits**: Subject to OCI account limits
- **Latency**: Network round-trip time + processing

## References

- [OCI GenAI Documentation](https://docs.oracle.com/en-us/iaas/generative-ai/latest/index.html)
- [Cohere Embed Models](https://docs.cohere.com/docs/cohere-embed)
- [Vector Databases](https://www.pinecone.io/learn/vector-database/)
- [Semantic Search](https://www.elastic.co/guide/en/elasticsearch/reference/current/semantic-search.html)
