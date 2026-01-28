# @acedergren/oci-genai-provider

Oracle Cloud Infrastructure (OCI) Generative AI provider for the [Vercel AI SDK](https://sdk.vercel.ai/docs).

## Works with Any Vercel AI SDK Application

This provider implements the Vercel AI SDK's `LanguageModelV1` interface, which means it works with:

- ✅ **Next.js** - App Router and Pages Router
- ✅ **Remix** - Streaming and non-streaming
- ✅ **SvelteKit** - Any SvelteKit app
- ✅ **Express/Fastify** - Node.js servers
- ✅ **OpenCode** - Terminal and Desktop (with optional integration package)
- ✅ **Any Framework** - If it uses Vercel AI SDK, it works

**No special setup required** - just install and use like any other AI SDK provider.

> 💡 **Using OpenCode?** Check out [@acedergren/oci-genai-provider](../opencode-integration) for a convenient integration package with config helpers and model presets.

## Features

- ✅ **16+ Models** - Grok, Llama, Cohere, Gemini
- ✅ **Embeddings** - Semantic search, RAG, clustering
- ✅ **Streaming** - Server-Sent Events (SSE) support
- ✅ **Tool Calling** - Function calling with AI SDK
- ✅ **Multiple Auth Methods** - Config file, instance principal, resource principal
- ✅ **Regional Support** - Frankfurt, Stockholm, Ashburn, and more
- ✅ **Type Safe** - Full TypeScript support
- ✅ **Built-in Retry** - Automatic retry with exponential backoff
- ✅ **Timeout Control** - Configurable request timeouts
- ✅ **Rich Errors** - Specific error types for different failures

## Why Use OCI GenAI?

| Feature                | OCI GenAI               | Other Providers |
| ---------------------- | ----------------------- | --------------- |
| **EU Data Residency**  | ✅ Frankfurt, Stockholm | Limited         |
| **Grok Models**        | ✅ xAI Grok 4           | ❌              |
| **Cost**               | 💰 Competitive          | Varies          |
| **Context Window**     | Up to 1M tokens         | Up to 2M tokens |
| **Enterprise Support** | ✅ Oracle Cloud         | Varies          |

## Installation

```bash
npm install @acedergren/oci-genai-provider ai
```

Or with pnpm:

```bash
pnpm add @acedergren/oci-genai-provider ai
```

## Quick Start

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { generateText } from 'ai';

const result = await generateText({
  model: oci('cohere.command-r-plus', {
    region: 'eu-frankfurt-1',
    compartmentId: process.env.OCI_COMPARTMENT_ID,
  }),
  prompt: 'Explain quantum computing in simple terms',
});

console.log(result.text);
```

## Available Models

### Grok (xAI)

- `xai.grok-4-maverick` - Most capable, 131K context
- `xai.grok-4-scout` - Fast, efficient
- `xai.grok-3` - Previous generation
- `xai.grok-3-mini` - Lightweight

### Llama (Meta)

- `meta.llama-3.3-70b-instruct` - Latest, 128K context
- `meta.llama-3.2-vision-90b-instruct` - Vision support
- `meta.llama-3.1-405b-instruct` - Largest model

### Cohere

- `cohere.command-r-plus` - Best for RAG
- `cohere.command-a` - Agentic workflows
- `cohere.command-a-reasoning` - Chain-of-thought
- `cohere.command-a-vision` - Vision support

### Gemini (Google)

- `google.gemini-2.5-pro` - Most capable, 1M context
- `google.gemini-2.5-flash` - Fast, efficient
- `google.gemini-2.5-flash-lite` - Lightweight

## Authentication

The provider uses lazy initialization for OCI authentication. The auth provider is created on the first API call using your configuration:

```typescript
import { createOCI } from '@acedergren/oci-genai-provider';

const provider = createOCI({
  authMethod: 'config_file', // or 'instance_principal', 'resource_principal'
  configFilePath: '~/.oci/config',
  compartmentId: process.env.OCI_COMPARTMENT_ID,
  region: 'us-ashburn-1',
});

const model = provider.model('cohere.command-r-plus');
// Auth provider created on first API call
const result = await generateText({ model, prompt: 'Hello!' });
```

**Authentication Methods:**

- `config_file` (default): Uses `~/.oci/config` file
- `instance_principal`: For OCI compute instances
- `resource_principal`: For OCI Functions

**Required Configuration:**

- `compartmentId`: Always required (from config or `OCI_COMPARTMENT_ID` env var)
- `region`: Optional, defaults to `eu-frankfurt-1`

### Config File (Default)

Uses `~/.oci/config`:

```typescript
import { oci } from '@acedergren/oci-genai-provider';

const model = oci('cohere.command-r-plus', {
  region: 'eu-frankfurt-1',
  compartmentId: process.env.OCI_COMPARTMENT_ID,
});
```

### Custom Profile

```typescript
const model = oci('xai.grok-4-maverick', {
  region: 'eu-frankfurt-1',
  profile: 'FRANKFURT',
  compartmentId: process.env.OCI_COMPARTMENT_ID,
});
```

### Instance Principal

For OCI compute instances:

```typescript
const model = oci('meta.llama-3.3-70b-instruct', {
  region: 'eu-frankfurt-1',
  auth: 'instance_principal',
  compartmentId: process.env.OCI_COMPARTMENT_ID,
});
```

### Resource Principal

For OCI Functions:

```typescript
const model = oci('google.gemini-2.5-flash', {
  region: 'eu-frankfurt-1',
  auth: 'resource_principal',
  compartmentId: process.env.OCI_COMPARTMENT_ID,
});
```

## Streaming

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';

const result = streamText({
  model: oci('cohere.command-r-plus'),
  prompt: 'Write a haiku about TypeScript',
});

for await (const textPart of result.textStream) {
  process.stdout.write(textPart);
}
```

## Embeddings

Generate text embeddings for semantic search, clustering, and RAG applications:

```typescript
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
```

### Available Embedding Models

| Model ID | Dimensions | Max Batch | Best For |
|----------|-----------|-----------|----------|
| `cohere.embed-multilingual-v3.0` | 1024 | 96 | Multilingual semantic search |
| `cohere.embed-english-v3.0` | 1024 | 96 | English semantic search |
| `cohere.embed-english-light-v3.0` | 384 | 96 | Fast English embeddings |

### Embedding Options

```typescript
oci.embeddingModel('cohere.embed-multilingual-v3.0', {
  truncate: 'END',       // 'START' | 'END' | 'NONE'
  inputType: 'DOCUMENT', // 'QUERY' | 'DOCUMENT'
  dimensions: 1024,      // 384 | 1024 (model dependent)
});
```

### Example: RAG Application

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { embedMany, embed } from 'ai';

// Index documents
const documents = [
  'The capital of France is Paris.',
  'Python is a popular programming language.',
  'The Pacific Ocean is the largest ocean.',
];

const { embeddings } = await embedMany({
  model: oci.embeddingModel('cohere.embed-multilingual-v3.0'),
  values: documents,
});

// Search: embed query and find most similar documents
const query = 'What is the largest ocean?';
const { embedding: queryEmbedding } = await embed({
  model: oci.embeddingModel('cohere.embed-multilingual-v3.0'),
  value: query,
});

// Calculate similarity and find best match
const similarities = embeddings.map((docEmb) =>
  cosineSimilarity(queryEmbedding, docEmb)
);
const bestMatchIndex = similarities.indexOf(Math.max(...similarities));
console.log(`Best match: ${documents[bestMatchIndex]}`);
```

See [RAG Demo Example](../../examples/rag-demo) for a complete working example.

## Tool Calling

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { generateText, tool } from 'ai';
import { z } from 'zod';

const result = await generateText({
  model: oci('cohere.command-a'),
  prompt: 'What is the weather in San Francisco?',
  tools: {
    getWeather: tool({
      description: 'Get the weather in a location',
      parameters: z.object({
        location: z.string().describe('The location to get the weather for'),
      }),
      execute: async ({ location }) => ({
        location,
        temperature: 72,
        condition: 'Sunny',
      }),
    }),
  },
});

console.log(result.text);
console.log(result.toolCalls);
```

## Configuration

### Environment Variables

```bash
# Required
OCI_COMPARTMENT_ID=ocid1.compartment.oc1..your-compartment-id

# Optional (defaults shown)
OCI_REGION=eu-frankfurt-1
OCI_CONFIG_PROFILE=DEFAULT
OCI_CONFIG_FILE=~/.oci/config
OCI_CLI_AUTH=api_key
```

### Regions

- `eu-frankfurt-1` (default)
- `eu-stockholm-1`
- `us-ashburn-1`
- `us-phoenix-1`
- And more...

## Error Handling

The provider includes specific error classes for different failure scenarios:

```typescript
import {
  OCIGenAIError,
  NetworkError,
  RateLimitError,
  AuthenticationError,
  ModelNotFoundError,
} from '@acedergren/oci-genai-provider';

try {
  const result = await generateText({ model, prompt: 'Hello!' });
} catch (error) {
  if (error instanceof RateLimitError) {
    // Rate limited - retry after delay
    console.log(`Retry after ${error.retryAfterMs}ms`);
  } else if (error instanceof NetworkError) {
    // Network issue - retryable
    console.log(`Network error: ${error.code}`);
  } else if (error instanceof AuthenticationError) {
    // Auth failed - check credentials
    console.log(`Auth type: ${error.authType}`);
  } else if (error instanceof ModelNotFoundError) {
    // Invalid model ID
    console.log(`Model: ${error.modelId}`);
  } else if (error instanceof OCIGenAIError) {
    // Generic OCI error
    if (error.retryable) {
      // Safe to retry
    }
  }
}
```

**Error Types:**

| Error Class           | Retryable | When Thrown                           |
| --------------------- | --------- | ------------------------------------- |
| `NetworkError`        | Yes       | Connection failures, timeouts, DNS    |
| `RateLimitError`      | Yes       | 429 Too Many Requests                 |
| `AuthenticationError` | No        | 401 Unauthorized, invalid credentials |
| `ModelNotFoundError`  | No        | 404 Not Found, invalid model ID       |
| `OCIGenAIError`       | Varies    | Other OCI API errors                  |

## Retry and Timeout

The provider includes utilities for handling transient failures:

### Automatic Retry

```typescript
import { withRetry } from '@acedergren/oci-genai-provider';

const result = await withRetry(() => generateText({ model, prompt: 'Hello!' }), {
  maxRetries: 3, // Default: 3
  baseDelayMs: 100, // Default: 100ms
  maxDelayMs: 10000, // Default: 10s
});
```

Retries automatically on:

- HTTP 429 (rate limit)
- HTTP 5xx (server errors)
- Network errors (ECONNRESET, ETIMEDOUT, etc.)

### Request Timeout

```typescript
import { withTimeout, TimeoutError } from '@acedergren/oci-genai-provider';

try {
  const result = await withTimeout(
    generateText({ model, prompt: 'Hello!' }),
    30000, // 30 second timeout
    'OCI GenAI request'
  );
} catch (error) {
  if (error instanceof TimeoutError) {
    console.log(`Timed out after ${error.timeoutMs}ms`);
  }
}
```

## TypeScript

Full type safety:

```typescript
import type { OCIConfig, ModelMetadata } from '@acedergren/oci-genai-provider';

const config: OCIConfig = {
  region: 'eu-frankfurt-1',
  auth: 'config_file',
  compartmentId: 'ocid1.compartment.oc1..test',
};
```

## Development

This package is part of a monorepo. For contributors:

```bash
# Clone the monorepo
git clone https://github.com/acedergren/oci-genai-provider.git
cd oci-genai-provider

# Install dependencies (requires pnpm 8+)
pnpm install

# Build this package
pnpm --filter @acedergren/oci-genai-provider build

# Run tests
pnpm --filter @acedergren/oci-genai-provider test

# Run tests in watch mode
pnpm --filter @acedergren/oci-genai-provider test -- --watch

# Type check
pnpm --filter @acedergren/oci-genai-provider type-check
```

### Test Suite

- **121 comprehensive tests** covering all modules
- **80%+ coverage** target
- **TDD workflow** with RED-GREEN-REFACTOR cycles
- See [Testing Guide](../../docs/testing/README.md)

### Contributing

1. Follow the [TDD Implementation Plan](../../docs/plans/2026-01-27-core-provider-tdd-implementation.md)
2. Write tests first (RED)
3. Implement minimal code (GREEN)
4. Commit atomically

## License

MIT

## Links

- [Documentation](https://github.com/acedergren/oci-genai-provider/tree/main/docs)
- [Examples](https://github.com/acedergren/oci-genai-provider/tree/main/examples) - SvelteKit, Next.js, CLI demos
- [Troubleshooting Guide](https://github.com/acedergren/oci-genai-provider/tree/main/docs/guides/troubleshooting.md)
- [Testing Guide](https://github.com/acedergren/oci-genai-provider/tree/main/docs/testing)
- [Issues](https://github.com/acedergren/oci-genai-provider/issues)
