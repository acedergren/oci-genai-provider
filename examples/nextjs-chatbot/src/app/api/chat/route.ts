import { oci } from '@acedergren/oci-genai-provider';
import { streamText, type LanguageModelV1 } from 'ai';

export async function POST(request: Request) {
  const { messages, model = 'cohere.command-r-plus' } = await request.json();

  // Type assertion needed due to AI SDK v1/v3 type mismatch
  // The provider implements LanguageModelV3 which is compatible at runtime
  const languageModel = oci(model, {
    compartmentId: process.env.OCI_COMPARTMENT_ID!,
    region: process.env.OCI_REGION || 'eu-frankfurt-1',
  }) as unknown as LanguageModelV1;

  const result = streamText({
    model: languageModel,
    messages,
  });

  return result.toDataStreamResponse();
}
