import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { OCILanguageModel } from '../OCILanguageModel';

const originalFetch = global.fetch;
const fetchMock = jest.fn<typeof fetch>();

function createSSEStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller): void {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

describe('OCILanguageModel api_key transport', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should use the OpenAI-compatible endpoint and parse tool calls', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        createSSEStream([
          'data: {"choices":[{"delta":{"content":"Working on it. "}}]}\n\n',
          'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_1","type":"function","function":{"name":"get_weather","arguments":"{\\"city\\":\\"London\\"}"}}]}}]}\n\n',
          'data: {"choices":[{"finish_reason":"tool_calls"}],"usage":{"prompt_tokens":12,"completion_tokens":8}}\n\n',
          'data: [DONE]\n\n',
        ]),
        {
          status: 200,
          headers: {
            'content-type': 'text/event-stream',
            'opc-request-id': 'req_123',
          },
        }
      )
    );

    const model = new OCILanguageModel('openai.gpt-oss-120b', {
      auth: 'api_key',
      apiKey: 'sk-test',
      region: 'us-chicago-1',
      compartmentId: 'ocid1.compartment.oc1..test',
    });

    const result = await model.doGenerate({
      prompt: [{ role: 'user', content: [{ type: 'text', text: 'What is the weather?' }] }],
      tools: [
        {
          type: 'function',
          name: 'get_weather',
          description: 'Get weather',
          inputSchema: {
            type: 'object',
            properties: {
              city: { type: 'string' },
            },
            required: ['city'],
          },
        },
      ],
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://inference.generativeai.us-chicago-1.oci.oraclecloud.com/20231130/actions/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test',
          'x-oci-compartment-id': 'ocid1.compartment.oc1..test',
        }),
      })
    );

    const requestBody = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
    expect(requestBody.model).toBe('openai.gpt-oss-120b');
    expect(requestBody.tools).toHaveLength(1);

    expect(result.content).toContainEqual({
      type: 'tool-call',
      toolCallId: 'call_1',
      toolName: 'get_weather',
      input: '{"city":"London"}',
    });
    expect(result.providerMetadata?.oci).toMatchObject({
      requestId: 'req_123',
      transport: 'openai-compatible',
    });
  });
});
