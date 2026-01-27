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
- ✅ **Streaming** - Server-Sent Events (SSE) support
- ✅ **Tool Calling** - Function calling with AI SDK
- ✅ **Multiple Auth Methods** - Config file, instance principal, resource principal
- ✅ **Regional Support** - Frankfurt, Stockholm, Ashburn, and more
- ✅ **Type Safe** - Full TypeScript support

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

All OCI API errors are wrapped with `OCIGenAIError` providing contextual help:

```typescript
import { OCIGenAIError } from '@acedergren/oci-genai-provider';

try {
  const result = await generateText({ model, prompt: 'Hello!' });
} catch (error) {
  if (error instanceof OCIGenAIError) {
    console.error(error.message); // User-friendly message
    console.error(error.context); // Additional context

    if (error.retryable) {
      // Implement retry logic for 429, 500+ errors
    }
  }
}
```

**Error Types:**

- `401 Unauthorized`: Check authentication configuration
- `403 Forbidden`: Check IAM policies and compartment access
- `404 Not Found`: Verify model ID and region
- `429 Rate Limit`: Implement exponential backoff
- `500+ Server Error`: Retryable, implement retry logic

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
- [Testing Guide](https://github.com/acedergren/oci-genai-provider/tree/main/docs/testing)
- [TDD Plan](https://github.com/acedergren/oci-genai-provider/tree/main/docs/plans/2026-01-27-core-provider-tdd-implementation.md)
- [Examples](https://github.com/acedergren/oci-genai-provider/tree/main/packages/examples)
- [Issues](https://github.com/acedergren/oci-genai-provider/issues)
