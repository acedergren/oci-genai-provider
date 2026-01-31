# Using with Vercel AI SDK

This guide explains how the OCI GenAI provider integrates with the Vercel AI SDK.

## Overview

The OCI GenAI provider is a **standard Vercel AI SDK provider** that implements the `LanguageModelV1` interface. This means it works exactly like any other AI SDK provider (OpenAI, Anthropic, Google, etc.).

## Basic Usage

### Installation

```bash
npm install @acedergren/oci-genai-provider ai
```

### Text Generation

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { generateText } from 'ai';

const result = await generateText({
  model: oci('cohere.command-r-plus'),
  prompt: 'Explain quantum computing',
});

console.log(result.text);
```

### Streaming Responses

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';

const stream = streamText({
  model: oci('meta.llama-3.3-70b-instruct'),
  prompt: 'Write a long essay about AI',
});

for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}
```

## Configuration

### Basic Configuration

```typescript
import { oci } from '@acedergren/oci-genai-provider';

// Use default OCI config (~/.oci/config)
const model = oci('xai.grok-4');

// Or specify configuration
const model = oci('cohere.command-r-plus', {
  region: 'eu-frankfurt-1',
  compartmentId: process.env.OCI_COMPARTMENT_ID,
  profile: 'DEFAULT',
});
```

### Provider Factory

For multiple models with shared configuration:

```typescript
import { createOCI } from '@acedergren/oci-genai-provider';

const oci = createOCI({
  region: 'eu-frankfurt-1',
  compartmentId: process.env.OCI_COMPARTMENT_ID,
});

// Use with different models
const grokModel = oci('xai.grok-4');
const llamaModel = oci('meta.llama-3.3-70b-instruct');
```

## Advanced Features

### Tool Calling

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { generateText, tool } from 'ai';
import { z } from 'zod';

const result = await generateText({
  model: oci('cohere.command-r-plus'),
  prompt: 'What is the weather in San Francisco?',
  tools: {
    getWeather: tool({
      description: 'Get the weather for a location',
      parameters: z.object({
        location: z.string(),
      }),
      execute: async ({ location }) => {
        // Your weather API call
        return { temperature: 72, condition: 'sunny' };
      },
    }),
  },
});

console.log(result.text);
console.log(result.toolCalls);
```

### Multi-Turn Conversations

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { generateText } from 'ai';

const conversation = await generateText({
  model: oci('xai.grok-4'),
  messages: [
    { role: 'user', content: 'Hello!' },
    { role: 'assistant', content: 'Hi! How can I help you today?' },
    { role: 'user', content: 'Tell me about TypeScript' },
  ],
});

console.log(conversation.text);
```

### Embeddings (if supported)

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { embed } from 'ai';

const result = await embed({
  model: oci.embedding('cohere.embed-english-v3.0'),
  value: 'Hello, world!',
});

console.log(result.embedding); // [0.123, -0.456, ...]
```

## Framework Integration

### Next.js App Router

```typescript
// app/api/chat/route.ts
import { oci } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: oci('cohere.command-r-plus'),
    messages,
  });

  return result.toDataStreamResponse();
}
```

### Remix

```typescript
// app/routes/api.chat.ts
import { oci } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';
import type { ActionFunction } from '@remix-run/node';

export const action: ActionFunction = async ({ request }) => {
  const { messages } = await request.json();

  const result = streamText({
    model: oci('meta.llama-3.3-70b-instruct'),
    messages,
  });

  return result.toDataStreamResponse();
};
```

### Express

```typescript
import express from 'express';
import { oci } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';

const app = express();
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  const result = streamText({
    model: oci('xai.grok-4'),
    messages,
  });

  result.pipeDataStreamToResponse(res);
});

app.listen(3000);
```

## Error Handling

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { generateText } from 'ai';

try {
  const result = await generateText({
    model: oci('cohere.command-r-plus'),
    prompt: 'Hello!',
  });
  console.log(result.text);
} catch (error) {
  if (error.name === 'AI_APICallError') {
    console.error('API call failed:', error.message);
  } else if (error.name === 'AI_InvalidModelError') {
    console.error('Invalid model:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Best Practices

### 1. Environment Variables

```typescript
// Good: Use environment variables
const model = oci('cohere.command-r-plus', {
  compartmentId: process.env.OCI_COMPARTMENT_ID,
  region: process.env.OCI_REGION,
});

// Bad: Hardcode sensitive values
const model = oci('cohere.command-r-plus', {
  compartmentId: 'ocid1.compartment...',
});
```

### 2. Provider Reuse

```typescript
// Good: Create provider once, reuse for multiple models
const oci = createOCI({ region: 'eu-frankfurt-1' });
const model1 = oci('xai.grok-4');
const model2 = oci('cohere.command-r-plus');

// Bad: Recreate provider for each model
const model1 = oci('xai.grok-4', { region: 'us-chicago-1' });
const model2 = oci('cohere.command-r-plus', { region: 'eu-frankfurt-1' });
```

### 3. Error Handling

```typescript
// Good: Handle errors gracefully
try {
  const result = await generateText({ model, prompt });
} catch (error) {
  console.error('Generation failed:', error);
  // Provide fallback or retry
}

// Bad: Let errors crash the app
const result = await generateText({ model, prompt });
```

## Performance Optimization

### Streaming for Long Responses

```typescript
// For long responses, always use streaming
const stream = streamText({
  model: oci('google.gemini-2.5-flash'),
  prompt: 'Write a comprehensive guide to TypeScript',
});

for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}
```

### Model Selection

```typescript
// Fast models for quick responses
const fastModel = oci('google.gemini-2.5-flash');

// Powerful models for complex tasks
const powerfulModel = oci('xai.grok-4');

// Cost-effective for high volume
const economicalModel = oci('meta.llama-3.3-70b-instruct');
```

## Type Safety

The provider is fully type-safe with TypeScript:

```typescript
import type { LanguageModelV1 } from 'ai';
import { oci } from '@acedergren/oci-genai-provider';

// Type is inferred as LanguageModelV1
const model = oci('cohere.command-r-plus');

// Full IntelliSense support
const result = await generateText({
  model,
  prompt: 'Hello!',
  // TypeScript will suggest and validate all options
});
```

## Next Steps

- [Authentication Guide](../authentication/README.md) - Configure OCI authentication
- [Streaming Guide](../streaming/README.md) - Implement streaming
- [Tool Calling Guide](../tool-calling/README.md) - Add function calling
- [Model Catalog](../../reference/oci-genai-models/README.md) - Browse available models
- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs) - Official AI SDK documentation
