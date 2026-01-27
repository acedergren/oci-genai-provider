# Remix Integration

Guide for using the OCI GenAI provider with Remix applications.

## Overview

The OCI GenAI provider works seamlessly with Remix, supporting both loader and action patterns.

## Quick Start

### Installation

```bash
npm install @acedergren/oci-genai-provider ai
```

### Chat Route

```typescript
// app/routes/api.chat.ts
import { oci } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';
import type { ActionFunction } from '@remix-run/node';

export const action: ActionFunction = async ({ request }) => {
  const { messages } = await request.json();

  const result = streamText({
    model: oci('cohere.command-r-plus', {
      compartmentId: process.env.OCI_COMPARTMENT_ID,
      region: 'eu-frankfurt-1',
    }),
    messages,
  });

  return result.toDataStreamResponse();
};
```

### Chat Component

```typescript
// app/routes/chat.tsx
import { useChat } from 'ai/react';

export default function ChatRoute() {
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

## Environment Variables

Create `.env`:

```bash
OCI_COMPARTMENT_ID=ocid1.compartment.oc1..your_id
OCI_REGION=eu-frankfurt-1
OCI_CONFIG_PROFILE=DEFAULT
```

## Features

### Loader with AI Generation

```typescript
// app/routes/summary.$id.tsx
import { oci } from '@acedergren/oci-genai-provider';
import { generateText } from 'ai';
import type { LoaderFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

export const loader: LoaderFunction = async ({ params }) => {
  const result = await generateText({
    model: oci('xai.grok-4-maverick'),
    prompt: `Summarize document ${params.id}`,
  });

  return { summary: result.text };
};

export default function SummaryRoute() {
  const { summary } = useLoaderData<typeof loader>();
  return <div>{summary}</div>;
}
```

### Action with Streaming

```typescript
// app/routes/generate.tsx
import { oci } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';
import type { ActionFunction } from '@remix-run/node';

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const prompt = formData.get('prompt') as string;

  const result = streamText({
    model: oci('meta.llama-3.3-70b-instruct'),
    prompt,
  });

  return result.toDataStreamResponse();
};
```

## Best Practices

1. **Use loaders** for server-side generation
2. **Use actions** for user interactions
3. **Enable streaming** for better UX
4. **Handle errors** with error boundaries

## Further Reading

- [Vercel AI SDK Integration](../../guides/vercel-ai-sdk-integration/README.md)
- [Core Provider Documentation](../../../packages/oci-genai-provider/README.md)
- [Remix Documentation](https://remix.run/docs)
