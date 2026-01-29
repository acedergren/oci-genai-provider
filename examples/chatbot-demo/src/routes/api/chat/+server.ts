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

    console.log('📨 Received messages:', JSON.stringify(messages, null, 2));

    // Convert UIMessage format (with parts) to CoreMessage format (with content)
    const convertedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.parts
        ? msg.parts.map((part: any) => part.text).join('')
        : msg.content || '',
    }));

    console.log('✅ Converted messages:', JSON.stringify(convertedMessages, null, 2));

    try {
      const result = await streamText({
        model: provider.languageModel(modelId),
        messages: convertedMessages,
      });

      console.log('🚀 StreamText result obtained, returning response...');
      return result.toUIMessageStreamResponse();
    } catch (streamError) {
      console.error('❌ StreamText error:', streamError);
      throw streamError;
    }
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
