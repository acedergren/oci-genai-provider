/**
 * Streaming Chat Example
 *
 * Demonstrates streaming chat completion with OCI OpenAI-compatible API
 */

import { createOCIOpenAI } from '../src';

async function main() {
  const client = createOCIOpenAI({
    region: 'eu-frankfurt-1',
    apiKey: process.env.OCI_API_KEY,
    compartmentId: process.env.OCI_COMPARTMENT_ID,
  });

  // Streaming chat completion
  const stream = await client.chat.completions.create({
    model: 'meta.llama-3.3-70b-instruct',
    messages: [
      {
        role: 'user',
        content: 'Write a haiku about cloud computing.',
      },
    ],
    stream: true,
    temperature: 0.9,
  });

  console.log('Streaming response:');
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    process.stdout.write(content);
  }

  console.log('\n\nDone!');
}

main().catch(console.error);
