# Next.js Integration

Guide for using the OCI GenAI provider with Next.js applications.

## Overview

The OCI GenAI provider works seamlessly with Next.js App Router and Pages Router, supporting both Server-Side Rendering (SSR) and API routes.

## Quick Start

### Installation

```bash
npm install @acedergren/oci-genai-provider ai
```

### App Router (Recommended)

Create an API route for chat:

```typescript
// app/api/chat/route.ts
import { oci } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: oci('cohere.command-r-plus', {
      compartmentId: process.env.OCI_COMPARTMENT_ID,
      region: 'eu-frankfurt-1',
    }),
    messages,
  });

  return result.toDataStreamResponse();
}
```

Create a chat component:

```typescript
// app/chat/page.tsx
'use client';

import { useChat } from 'ai/react';

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
  });

  return (
    <div>
      {messages.map((message) => (
        <div key={message.id}>
          <strong>{message.role}:</strong> {message.content}
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

### Environment Variables

Create `.env.local`:

```bash
OCI_COMPARTMENT_ID=ocid1.compartment.oc1..your_id
OCI_REGION=eu-frankfurt-1
OCI_CONFIG_PROFILE=DEFAULT
```

## Features

### Server-Side Generation

```typescript
// app/page.tsx
import { oci } from '@acedergren/oci-genai-provider';
import { generateText } from 'ai';

export default async function Page() {
  const result = await generateText({
    model: oci('xai.grok-4'),
    prompt: 'Explain Next.js App Router',
  });

  return <div>{result.text}</div>;
}
```

### Streaming

```typescript
// app/api/stream/route.ts
import { oci } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const result = streamText({
    model: oci('meta.llama-3.3-70b-instruct'),
    prompt,
  });

  return result.toDataStreamResponse();
}
```

### Tool Calling

```typescript
// app/api/tools/route.ts
import { oci } from '@acedergren/oci-genai-provider';
import { generateText, tool } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await generateText({
    model: oci('cohere.command-r-plus'),
    messages,
    tools: {
      getWeather: tool({
        description: 'Get weather for a location',
        parameters: z.object({
          location: z.string(),
        }),
        execute: async ({ location }) => {
          // Your weather API
          return { temperature: 72, condition: 'sunny' };
        },
      }),
    },
  });

  return Response.json(result);
}
```

## Best Practices

1. **Use environment variables** for OCI configuration
2. **Enable streaming** for better UX
3. **Use App Router** for better performance
4. **Handle errors** gracefully in API routes

## Further Reading

- [Vercel AI SDK Integration](../../guides/vercel-ai-sdk-integration/README.md)
- [Core Provider Documentation](../../../packages/oci-genai-provider/README.md)
- [Next.js Documentation](https://nextjs.org/docs)
