# Tutorial: Streaming Responses

Implement real-time streaming for better user experience.

## Step 1: Basic Streaming

\`\`\`typescript
import { createOCI } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';

const oci = createOCI({ region: 'eu-frankfurt-1' });

const { textStream } = await streamText({
  model: oci('cohere.command-r-plus'),
  prompt: 'Write a story about AI'
});

for await (const textPart of textStream) {
  process.stdout.write(textPart);
}
\`\`\`

## Step 2: Web Server Example

\`\`\`typescript
import express from 'express';
import { createOCI } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';

const app = express();
const oci = createOCI({ region: 'eu-frankfurt-1' });

app.post('/api/chat', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');

  const { textStream } = await streamText({
    model: oci('xai.grok-4-maverick'),
    prompt: req.body.prompt
  });

  for await (const text of textStream) {
    res.write(\`data: \${JSON.stringify({ text })}\n\n\`);
  }

  res.end();
});

app.listen(3000);
\`\`\`

## Next Steps

- [Tutorial 3: Tool Calling](03-tool-calling.md)
- [Streaming Guide](../guides/streaming/)
