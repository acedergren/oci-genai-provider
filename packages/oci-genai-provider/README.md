# @acedergren/oci-genai-provider

Oracle Cloud Infrastructure (OCI) Generative AI provider for the [Vercel AI SDK](https://sdk.vercel.ai/docs).

## Features

- ✅ **16+ Models** - Grok, Llama, Cohere, Gemini
- ✅ **Streaming** - Server-Sent Events (SSE) support
- ✅ **Tool Calling** - Function calling with AI SDK
- ✅ **Multiple Auth Methods** - Config file, instance principal, resource principal
- ✅ **Regional Support** - Frankfurt, Stockholm, Ashburn, and more
- ✅ **Type Safe** - Full TypeScript support

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

The provider includes helpful error messages:

```typescript
try {
  const result = await generateText({
    model: oci('invalid.model'),
    prompt: 'Test',
  });
} catch (error) {
  if (error.statusCode === 401) {
    // Authentication error - check your OCI config
  } else if (error.statusCode === 403) {
    // Permission error - check IAM policies
  } else if (error.statusCode === 404) {
    // Model not found - check model ID and region
  } else if (error.statusCode === 429) {
    // Rate limit - implement retry with backoff
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

## License

MIT

## Links

- [Documentation](https://github.com/acedergren/opencode-oci-genai/tree/main/docs)
- [Examples](https://github.com/acedergren/opencode-oci-genai/tree/main/packages/examples)
- [Issues](https://github.com/acedergren/opencode-oci-genai/issues)
