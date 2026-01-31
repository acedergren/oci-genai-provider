# Streaming Implementation Guide

Complete guide to implementing real-time streaming responses with the OCI GenAI provider using Server-Sent Events (SSE).

## Overview

Streaming allows tokens to be delivered incrementally as they're generated, providing a better user experience for long-form content generation.

**Benefits:**

- Lower perceived latency (first token arrives faster)
- Real-time feedback for users
- Better UX for chat interfaces
- Ability to cancel long-running requests

**All OCI GenAI models support streaming.**

---

## Quick Start

```typescript
import { createOCI } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';

const oci = createOCI({
  region: 'us-ashburn-1',
});

const { textStream } = await streamText({
  model: oci('cohere.command-r-plus'),
  prompt: 'Write a story about AI',
});

// Consume the stream
for await (const textPart of textStream) {
  process.stdout.write(textPart);
}
```

**That's it!** The AI SDK handles all the streaming protocol details.

---

## How Streaming Works

### Architecture Overview

```
User Request
     ↓
AI SDK (streamText)
     ↓
OCI Provider (doStream)
     ↓
OCI GenAI API (isStream: true)
     ↓
Server-Sent Events (SSE)
     ↓
EventSourceParser
     ↓
TransformStream
     ↓
Async Iterator (textStream)
     ↓
User Application
```

### Protocol Flow

1. **Request:** Provider sets `isStream: true` in API request
2. **Response:** OCI returns `text/event-stream` content type
3. **Events:** Tokens arrive as SSE events
4. **Parsing:** `eventsource-parser` converts SSE to chunks
5. **Transform:** Provider transforms to AI SDK format
6. **Delivery:** User receives async iterator

---

## Server-Sent Events (SSE)

### SSE Format

Server-Sent Events is a standard for server-to-client streaming over HTTP.

**Event Structure:**

```
event: message
data: {"text": "Hello", "finishReason": null}

event: message
data: {"text": " world", "finishReason": null}

event: done
data: {"finishReason": "COMPLETE"}
```

**Fields:**

- `event`: Event type (`message`, `done`, `error`)
- `data`: JSON payload with chunk data

### OCI GenAI SSE Format

**Text Delta Event:**

```
event: message
data: {
  "text": "Once",
  "finishReason": null
}
```

**Completion Event:**

```
event: done
data: {
  "finishReason": "COMPLETE",
  "usage": {
    "inputTokens": 10,
    "outputTokens": 50
  }
}
```

**Error Event:**

```
event: error
data: {
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded"
}
```

---

## Using eventsource-parser

The `eventsource-parser` library parses SSE streams into structured events.

### Installation

```bash
npm install eventsource-parser
```

### Basic Usage

```typescript
import { createParser, ParsedEvent, ReconnectInterval } from 'eventsource-parser';

function createSSEParser() {
  return createParser((event: ParsedEvent | ReconnectInterval) => {
    if (event.type === 'event') {
      const data = JSON.parse(event.data);
      console.log('Received:', data);
    }
  });
}
```

### Parsing OCI Streams

```typescript
import { createParser } from 'eventsource-parser';

async function parseOCIStream(response: Response) {
  const parser = createParser((event) => {
    if (event.type === 'event') {
      const chunk = JSON.parse(event.data);

      // Handle different event types
      if (event.event === 'message' && chunk.text) {
        console.log(chunk.text); // Token delta
      } else if (event.event === 'done') {
        console.log('Stream complete');
      } else if (event.event === 'error') {
        console.error('Stream error:', chunk);
      }
    }
  });

  // Feed stream to parser
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    parser.feed(text);
  }
}
```

---

## Async Iterator Pattern

The AI SDK converts streams to async iterators for easy consumption.

### Text Stream

```typescript
const { textStream } = await streamText({
  model: oci('meta.llama-3.3-70b-instruct'),
  prompt: 'Explain quantum computing',
});

// Consume as async iterator
for await (const textPart of textStream) {
  console.log(textPart); // Each token or chunk
}
```

### Full Stream (with metadata)

```typescript
const { fullStream } = await streamText({
  model: oci('cohere.command-r-plus'),
  prompt: 'Write a poem',
});

for await (const part of fullStream) {
  switch (part.type) {
    case 'text-delta':
      process.stdout.write(part.textDelta);
      break;
    case 'finish':
      console.log('\nTokens used:', part.usage.totalTokens);
      break;
  }
}
```

### Handling Errors in Streams

```typescript
try {
  const { textStream } = await streamText({
    model: oci('xai.grok-4'),
    prompt: 'Generate code',
  });

  for await (const text of textStream) {
    process.stdout.write(text);
  }
} catch (error: any) {
  if (error.name === 'AbortError') {
    console.log('Stream cancelled by user');
  } else {
    console.error('Stream error:', error.message);
  }
}
```

---

## Provider Implementation

### doStream Method

The provider's `doStream` method converts OCI SSE to AI SDK format.

```typescript
async doStream(
  options: LanguageModelV3CallOptions
): Promise<LanguageModelV3StreamResult> {
  const { args, warnings } = this.prepareRequest(options);

  // Make streaming API request
  const response = await fetch(`${this.baseURL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...this.authHeaders(),
    },
    body: JSON.stringify({ ...args, isStream: true }),
    signal: options.abortSignal,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  // Transform SSE stream to AI SDK format
  const stream = response.body!
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(this.createSSEParser())
    .pipeThrough(this.createStreamTransformer(warnings));

  return { stream, warnings };
}
```

### SSE Parser Transform

```typescript
private createSSEParser(): TransformStream<string, OCIStreamChunk> {
  let buffer = '';

  return new TransformStream({
    transform(chunk, controller) {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            controller.enqueue(data);
          } catch (e) {
            console.error('Failed to parse SSE data:', line);
          }
        }
      }
    },
    flush(controller) {
      if (buffer.trim()) {
        try {
          const data = JSON.parse(buffer.slice(6));
          controller.enqueue(data);
        } catch (e) {
          // Ignore parse errors in final buffer
        }
      }
    }
  });
}
```

### Stream Transformer

```typescript
private createStreamTransformer(
  warnings: SharedV3Warning[]
): TransformStream<OCIStreamChunk, LanguageModelV3StreamPart> {
  let isFirstChunk = true;

  return new TransformStream({
    async transform(chunk, controller) {
      // Send warnings with first chunk
      if (isFirstChunk) {
        controller.enqueue({ type: 'stream-start', warnings });
        isFirstChunk = false;
      }

      // Handle text delta
      if (chunk.text) {
        controller.enqueue({
          type: 'text-delta',
          textDelta: chunk.text,
        });
      }

      // Handle tool calls
      if (chunk.toolCalls) {
        for (const toolCall of chunk.toolCalls) {
          controller.enqueue({
            type: 'tool-call-delta',
            toolCallId: toolCall.id,
            toolName: toolCall.name,
            argsTextDelta: toolCall.arguments,
          });
        }
      }

      // Handle completion
      if (chunk.finishReason) {
        controller.enqueue({
          type: 'finish',
          finishReason: this.mapFinishReason(chunk.finishReason),
          usage: {
            inputTokens: chunk.usage?.inputTokens || 0,
            outputTokens: chunk.usage?.outputTokens || 0,
            totalTokens: chunk.usage?.totalTokens || 0,
          },
        });
      }
    },
  });
}
```

---

## Real-World Examples

### Example 1: Console Streaming

```typescript
import { createOCI } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';

async function streamToConsole() {
  const oci = createOCI({ region: 'us-ashburn-1' });

  console.log('Generating response...\n');

  const { textStream } = await streamText({
    model: oci('xai.grok-4'),
    prompt: 'Explain how streaming works in 3 paragraphs',
  });

  for await (const textPart of textStream) {
    process.stdout.write(textPart);
  }

  console.log('\n\nDone!');
}

streamToConsole();
```

### Example 2: Web Server (Express)

```typescript
import express from 'express';
import { createOCI } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';

const app = express();
const oci = createOCI({ region: 'us-ashburn-1' });

app.post('/api/chat', async (req, res) => {
  const { prompt } = req.body;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const { textStream } = await streamText({
    model: oci('cohere.command-r-plus'),
    prompt,
  });

  // Stream to client
  for await (const textPart of textStream) {
    res.write(`data: ${JSON.stringify({ text: textPart })}\n\n`);
  }

  res.write('data: [DONE]\n\n');
  res.end();
});

app.listen(3000);
```

### Example 3: React Client

```typescript
import { useState } from 'react';

export function ChatInterface() {
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  async function handleSubmit(prompt: string) {
    setIsStreaming(true);
    setResponse('');

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          if (data.text) {
            setResponse((prev) => prev + data.text);
          }
        }
      }
    }

    setIsStreaming(false);
  }

  return (
    <div>
      <div className="response">{response}</div>
      {isStreaming && <div className="spinner">●●●</div>}
    </div>
  );
}
```

### Example 4: Cancellable Streaming

```typescript
import { createOCI } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';

async function cancellableStream() {
  const oci = createOCI({ region: 'us-ashburn-1' });
  const abortController = new AbortController();

  // Cancel after 5 seconds
  setTimeout(() => abortController.abort(), 5000);

  try {
    const { textStream } = await streamText({
      model: oci('meta.llama-3.3-70b-instruct'),
      prompt: 'Write a very long story',
      abortSignal: abortController.signal,
    });

    for await (const text of textStream) {
      process.stdout.write(text);
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('\nStream cancelled successfully');
    } else {
      throw error;
    }
  }
}

cancellableStream();
```

---

## Error Handling

### Stream Errors

Errors can occur at different stages of streaming.

**Connection Errors:**

```typescript
try {
  const { textStream } = await streamText({
    model: oci('xai.grok-4'),
    prompt: 'Hello',
  });

  for await (const text of textStream) {
    console.log(text);
  }
} catch (error: any) {
  if (error.cause?.code === 'ECONNREFUSED') {
    console.error('Cannot connect to OCI API');
  } else if (error.statusCode === 503) {
    console.error('OCI service unavailable');
  }
}
```

**Mid-Stream Errors:**

```typescript
const { fullStream } = await streamText({
  model: oci('cohere.command-r-plus'),
  prompt: 'Generate content',
});

for await (const part of fullStream) {
  if (part.type === 'error') {
    console.error('Stream error:', part.error);
    break;
  } else if (part.type === 'text-delta') {
    console.log(part.textDelta);
  }
}
```

**Timeout Handling:**

```typescript
import { setTimeout } from 'timers/promises';

async function streamWithTimeout(timeoutMs: number) {
  const oci = createOCI({ region: 'us-ashburn-1' });
  const abortController = new AbortController();

  const timeoutPromise = setTimeout(timeoutMs).then(() => {
    abortController.abort();
    throw new Error('Stream timeout');
  });

  const streamPromise = (async () => {
    const { textStream } = await streamText({
      model: oci('meta.llama-3.3-70b-instruct'),
      prompt: 'Long prompt...',
      abortSignal: abortController.signal,
    });

    for await (const text of textStream) {
      process.stdout.write(text);
    }
  })();

  await Promise.race([streamPromise, timeoutPromise]);
}
```

---

## Performance Optimization

### Buffering Strategies

**No Buffering (lowest latency):**

```typescript
for await (const text of textStream) {
  process.stdout.write(text); // Immediately output
}
```

**Character Buffering:**

```typescript
let buffer = '';
for await (const text of textStream) {
  buffer += text;
  if (buffer.length >= 10) {
    process.stdout.write(buffer);
    buffer = '';
  }
}
if (buffer) process.stdout.write(buffer);
```

**Word Buffering:**

```typescript
let buffer = '';
for await (const text of textStream) {
  buffer += text;
  const words = buffer.split(/(\s+)/);

  if (words.length > 1) {
    process.stdout.write(words.slice(0, -1).join(''));
    buffer = words[words.length - 1];
  }
}
if (buffer) process.stdout.write(buffer);
```

### Backpressure Handling

Async iterators naturally handle backpressure - if consumption is slow, the stream will pause.

```typescript
for await (const text of textStream) {
  // Slow consumer
  await someSlowOperation(text);

  // Stream automatically pauses until this completes
}
```

---

## Troubleshooting

### Stream Not Starting

**Problem:** No chunks received.

**Check:**

1. `isStream: true` set in request
2. Response has `Content-Type: text/event-stream`
3. No proxy/middleware buffering responses

**Debug:**

```typescript
const response = await fetch(url, { ...options });
console.log('Content-Type:', response.headers.get('content-type'));
console.log('Status:', response.status);
```

### Chunks Arriving Slowly

**Problem:** Long delays between tokens.

**Possible Causes:**

- Network latency
- Model generating slowly (complex prompt)
- Rate limiting

**Solutions:**

- Use faster model (`gemini-2.5-flash`)
- Reduce prompt complexity
- Check rate limits

### Incomplete Streams

**Problem:** Stream ends unexpectedly.

**Check:**

1. Network stability
2. Timeout settings
3. Error events in stream

**Debug:**

```typescript
const { fullStream } = await streamText({ ... });

for await (const part of fullStream) {
  console.log('Part type:', part.type);
  if (part.type === 'finish') {
    console.log('Finish reason:', part.finishReason);
  }
}
```

---

## Next Steps

- **[Tool Calling Guide](../tool-calling/)** - Combine streaming with tools
- **[First Chat Tutorial](../../tutorials/01-basic-chat.md)** - Basic implementation
- **[Streaming Tutorial](../../tutorials/02-streaming-responses.md)** - Step-by-step guide
- **[Error Codes Reference](../../reference/error-codes/)** - Handle errors

---

**Sources:**

- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs/ai-sdk-core/stream-text)
- [EventSource API Standard](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [eventsource-parser Library](https://www.npmjs.com/package/eventsource-parser)
- Project Archive Requirements Specification
- Context7 Query Results (2026-01-26)

**Last Updated:** 2026-01-26
