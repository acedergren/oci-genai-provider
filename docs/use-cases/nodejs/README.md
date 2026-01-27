# Node.js Integration

Guide for using the OCI GenAI provider with Node.js applications.

## Overview

The OCI GenAI provider works with any Node.js application, including Express, Fastify, and standalone scripts.

## Quick Start

### Installation

```bash
npm install @acedergren/oci-genai-provider ai
```

### Basic Usage

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { generateText } from 'ai';

async function main() {
  const result = await generateText({
    model: oci('cohere.command-r-plus', {
      compartmentId: process.env.OCI_COMPARTMENT_ID,
      region: 'eu-frankfurt-1',
    }),
    prompt: 'Explain Node.js event loop',
  });

  console.log(result.text);
}

main();
```

## Express Integration

### Chat API

```typescript
import express from 'express';
import { oci } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';

const app = express();
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  const result = streamText({
    model: oci('xai.grok-4-maverick'),
    messages,
  });

  result.pipeDataStreamToResponse(res);
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

### Text Generation Endpoint

```typescript
app.post('/api/generate', async (req, res) => {
  const { prompt } = req.body;

  try {
    const result = await generateText({
      model: oci('meta.llama-3.3-70b-instruct'),
      prompt,
    });

    res.json({ text: result.text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Fastify Integration

```typescript
import Fastify from 'fastify';
import { oci } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';

const fastify = Fastify();

fastify.post('/api/chat', async (request, reply) => {
  const { messages } = request.body;

  const result = streamText({
    model: oci('cohere.command-r-plus'),
    messages,
  });

  return result.toDataStreamResponse();
});

await fastify.listen({ port: 3000 });
```

## CLI Tool Example

```typescript
#!/usr/bin/env node
import { oci } from '@acedergren/oci-genai-provider';
import { generateText } from 'ai';
import { program } from 'commander';

program.argument('<prompt>', 'The prompt to send to the AI').action(async (prompt) => {
  const result = await generateText({
    model: oci('xai.grok-4-maverick'),
    prompt,
  });

  console.log(result.text);
});

program.parse();
```

## Environment Variables

Create `.env`:

```bash
OCI_COMPARTMENT_ID=ocid1.compartment.oc1..your_id
OCI_REGION=eu-frankfurt-1
OCI_CONFIG_PROFILE=DEFAULT
```

## Features

### Streaming with Progress

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';

const stream = streamText({
  model: oci('google.gemini-2.5-flash'),
  prompt: 'Write a long essay',
});

for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}
```

### Tool Calling

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { generateText, tool } from 'ai';
import { z } from 'zod';

const result = await generateText({
  model: oci('cohere.command-r-plus'),
  prompt: 'What is the weather?',
  tools: {
    getWeather: tool({
      description: 'Get weather data',
      parameters: z.object({
        location: z.string(),
      }),
      execute: async ({ location }) => {
        return { temperature: 72, condition: 'sunny' };
      },
    }),
  },
});

console.log(result.text);
console.log(result.toolCalls);
```

### Batch Processing

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { generateText } from 'ai';

const prompts = ['Summarize article 1', 'Summarize article 2', 'Summarize article 3'];

const results = await Promise.all(
  prompts.map((prompt) =>
    generateText({
      model: oci('meta.llama-3.3-70b-instruct'),
      prompt,
    })
  )
);

results.forEach((result, i) => {
  console.log(`Result ${i + 1}:`, result.text);
});
```

## Best Practices

1. **Use environment variables** for configuration
2. **Handle errors** gracefully
3. **Enable streaming** for long responses
4. **Use connection pooling** for high traffic
5. **Implement rate limiting** for production

## Further Reading

- [Vercel AI SDK Integration](../../guides/vercel-ai-sdk-integration/README.md)
- [Core Provider Documentation](../../../packages/oci-genai-provider/README.md)
- [Express Documentation](https://expressjs.com/)
- [Fastify Documentation](https://www.fastify.io/)
