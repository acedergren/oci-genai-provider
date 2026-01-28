/**
 * Basic Chat Example
 *
 * Demonstrates simple chat completion using OCI OpenAI-compatible API
 */

import { createOCIOpenAI } from '../src';

async function main() {
  // Create client with OCI configuration
  const client = createOCIOpenAI({
    region: 'us-ashburn-1',
    apiKey: process.env.OCI_API_KEY,
    compartmentId: process.env.OCI_COMPARTMENT_ID,
  });

  // Simple chat completion
  const response = await client.chat.completions.create({
    model: 'meta.llama-3.3-70b-instruct',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant.',
      },
      {
        role: 'user',
        content: 'What is Oracle Cloud Infrastructure?',
      },
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  console.log('Response:', response.choices[0].message.content);
}

main().catch(console.error);
