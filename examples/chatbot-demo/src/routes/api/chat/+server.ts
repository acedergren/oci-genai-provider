import { oci } from '@acedergren/oci-genai-provider';
import { streamText } from 'ai';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const compartmentId = process.env.OCI_COMPARTMENT_ID;
    if (!compartmentId) {
      return new Response(
        JSON.stringify({ error: 'OCI_COMPARTMENT_ID environment variable is required' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { messages, model } = await request.json();

    const result = streamText({
      model: oci(model, {
        compartmentId,
        region: process.env.OCI_REGION ?? 'eu-frankfurt-1',
      }),
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
