import { oci } from '@acedergren/oci-genai-provider';
import { streamText, type LanguageModelV1 } from 'ai';

export async function POST(request: Request) {
  // Validate environment
  const compartmentId = process.env.OCI_COMPARTMENT_ID;
  if (!compartmentId) {
    return new Response(JSON.stringify({ error: 'OCI_COMPARTMENT_ID not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse and validate request body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { messages, model = 'cohere.command-r-plus' } = body;

  if (!Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'messages must be an array' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Type assertion needed due to AI SDK v1/v3 type mismatch
  // The provider implements LanguageModelV3 which is compatible at runtime
  const languageModel = oci(model, {
    compartmentId,
    region: process.env.OCI_REGION ?? 'eu-frankfurt-1',
  }) as unknown as LanguageModelV1;

  const result = streamText({
    model: languageModel,
    messages,
  });

  return result.toDataStreamResponse();
}
