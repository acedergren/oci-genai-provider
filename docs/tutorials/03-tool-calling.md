# Tutorial: Tool Calling

Enable function calling for dynamic capabilities.

## Step 1: Define Tools

\`\`\`typescript
import { createOCI } from '@acedergren/oci-genai-provider';
import { generateText, tool } from 'ai';
import { z } from 'zod';

const tools = {
  getWeather: tool({
    description: 'Get current weather',
    parameters: z.object({
      location: z.string()
    }),
    execute: async ({ location }) => ({
      location,
      temperature: 22,
      conditions: 'Sunny'
    })
  })
};
\`\`\`

## Step 2: Use Tools

\`\`\`typescript
const oci = createOCI({ region: 'eu-frankfurt-1' });

const { text } = await generateText({
  model: oci('cohere.command-r-plus'),
  prompt: 'What's the weather in Frankfurt?',
  tools
});

console.log(text);
\`\`\`

## Next Steps

- [Tutorial 4: OpenCode Integration](04-opencode-integration.md)
- [Tool Calling Guide](../guides/tool-calling/)
