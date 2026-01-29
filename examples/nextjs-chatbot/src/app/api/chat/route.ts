import { createOCI } from '@acedergren/oci-genai-provider';
import { streamText, type LanguageModelV1 } from 'ai';

// Create provider instance with environment configuration
const provider = createOCI({
  compartmentId: process.env.OCI_COMPARTMENT_ID,
  region: process.env.OCI_REGION ?? 'eu-frankfurt-1',
});

export async function POST(request: Request) {
  // Validate environment
  if (!process.env.OCI_COMPARTMENT_ID) {
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

  const { messages, model: modelId = 'meta.llama-3.3-70b-instruct' } = body;

  if (!Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'messages must be an array' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Type assertion needed due to AI SDK v1/v3 type mismatch
  // The provider implements LanguageModelV3 which is compatible at runtime
  const languageModel = provider.languageModel(modelId) as unknown as LanguageModelV1;

  const result = await streamText({
    model: languageModel,
    messages,
  });

  return result.toUIMessageStreamResponse();
}
