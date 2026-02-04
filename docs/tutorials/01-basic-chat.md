# Tutorial: Basic Chat Implementation

Learn to implement a simple chat application using the OCI GenAI provider.

## Prerequisites

- Node.js 18+
- OCI account with GenAI access
- OCI credentials configured (`~/.oci/config`)

## Step 1: Install Dependencies

\`\`\`bash
npm install @acedergren/oci-genai-provider ai
\`\`\`

## Step 2: Create Basic Chat

Create `chat.ts`:

\`\`\`typescript
import { createOCI } from '@acedergren/oci-genai-provider';
import { generateText } from 'ai';

const oci = createOCI({
region: 'eu-frankfurt-1',
profile: 'DEFAULT'
});

const { text } = await generateText({
model: oci('meta.llama-3.3-70b-instruct'),
prompt: 'Explain quantum computing in simple terms'
});

console.log(text);
\`\`\`

## Step 3: Run

\`\`\`bash
npx tsx chat.ts
\`\`\`

**Expected output:** Explanation of quantum computing.

## Next Steps

- [Tutorial 2: Streaming Responses](02-streaming-responses.md)
- [API Reference](../api-reference/oci-sdk/)
