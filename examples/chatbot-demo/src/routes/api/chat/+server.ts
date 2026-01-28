import { createOCI } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';
import type { RequestHandler } from './$types';

// Create provider instance with environment configuration
const provider = createOCI({
  compartmentId: process.env.OCI_COMPARTMENT_ID,
  region: process.env.OCI_REGION ?? 'eu-frankfurt-1',
});

export const POST: RequestHandler = async ({ request }) => {
  try {
    if (!process.env.OCI_COMPARTMENT_ID) {
      return new Response(
        JSON.stringify({ error: 'OCI_COMPARTMENT_ID environment variable is required' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { messages, model: modelId } = await request.json();

    const result = streamText({
      model: provider.languageModel(modelId),
      messages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
