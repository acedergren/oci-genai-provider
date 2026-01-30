import { createParser, type EventSourceMessage } from 'eventsource-parser';
import type { LanguageModelV3FinishReason } from '@ai-sdk/provider';
import type { StreamPart, UnifiedFinishReason } from './types';

const FINISH_REASON_MAP: Record<string, UnifiedFinishReason> = {
  STOP: 'stop',
  LENGTH: 'length',
  CONTENT_FILTER: 'content-filter',
  TOOL_CALLS: 'tool-calls',
  ERROR: 'error',
};

/**
 * Maps OCI GenAI finish reasons to AI SDK v3 LanguageModelV3FinishReason structure.
 */
export function mapFinishReason(reason: string): LanguageModelV3FinishReason {
  return {
    unified: FINISH_REASON_MAP[reason] ?? 'other',
    raw: reason,
  };
}

/**
 * OCI streaming format (2025+):
 * Text chunk:  {"index":0,"message":{"role":"ASSISTANT","content":[{"type":"TEXT","text":"..."}]},"pad":"..."}
 * Tool call:   {"message":{"role":"ASSISTANT","toolCalls":[{"id":"...","type":"FUNCTION","function":{"name":"...","arguments":"..."}}]},...}
 * Finish:      {"message":{"role":"ASSISTANT"},"finishReason":"stop","pad":"..."}
 */
interface OCIStreamToolCall {
  id?: string;
  type?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
  // Cohere format
  name?: string;
  parameters?: Record<string, unknown>;
}

interface OCIStreamChunk {
  index?: number;
  message?: {
    role?: string;
    content?: Array<{ type?: string; text?: string }>;
    toolCalls?: OCIStreamToolCall[];
  };
  // Cohere format: tool calls at top level
  toolCalls?: OCIStreamToolCall[];
  finishReason?: string;
  pad?: string;
}

/**
 * Parses an OCI GenAI streaming response.
 * Accepts either a ReadableStream directly (new OCI SDK behavior) or a Response object.
 */
export async function* parseSSEStream(
  input: ReadableStream<Uint8Array> | Response,
  options?: { includeRawChunks?: boolean }
): AsyncGenerator<StreamPart> {
  // Handle both ReadableStream and Response objects
  const stream = input instanceof ReadableStream ? input : input.body;
  if (!stream) {
    throw new Error('Response body is not readable');
  }

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const parts: StreamPart[] = [];
  let yieldedIndex = 0;

  const includeRawChunks = options?.includeRawChunks ?? false;

  const parser = createParser({
    onEvent: (event: EventSourceMessage) => {
      const data = event.data;
      if (data === '[DONE]') return;

      try {
        const parsed = JSON.parse(data) as OCIStreamChunk;

        if (includeRawChunks) {
          parts.push({
            type: 'raw',
            rawValue: parsed,
          });
        }

        // Check for text delta in the new OCI format
        const textContent = parsed.message?.content?.[0]?.text;
        if (textContent) {
          parts.push({
            type: 'text-delta',
            textDelta: textContent,
          });
        }

        // Check for tool calls (GENERIC or COHERE format)
        const toolCalls = parsed.message?.toolCalls ?? parsed.toolCalls;
        if (toolCalls && toolCalls.length > 0) {
          for (const toolCall of toolCalls) {
            // GENERIC format: { id, type: 'FUNCTION', function: { name, arguments } }
            // COHERE format: { name, parameters }
            if (toolCall.function?.name) {
              parts.push({
                type: 'tool-call',
                toolCallId: toolCall.id ?? `tool-call-${Date.now()}`,
                toolName: toolCall.function.name,
                input: toolCall.function.arguments ?? '{}',
              });
            } else if (toolCall.name) {
              // Cohere format
              parts.push({
                type: 'tool-call',
                toolCallId: `tool-call-${Date.now()}`,
                toolName: toolCall.name,
                input: JSON.stringify(toolCall.parameters ?? {}),
              });
            }
          }
        }

        // Check for finish (OCI returns lowercase 'stop')
        const finishReason = parsed.finishReason;
        if (finishReason) {
          parts.push({
            type: 'finish',
            finishReason: mapFinishReason(finishReason.toUpperCase()),
            usage: {
              promptTokens: 0,
              completionTokens: 0,
            },
          });
        }
      } catch {
        if (includeRawChunks) {
          parts.push({
            type: 'raw',
            rawValue: data,
          });
        }
      }
    },
  });

  while (true) {
    const result = await reader.read();

    if (result.done) break;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    parser.feed(decoder.decode(result.value, { stream: true }));

    // Yield any parts that were parsed (O(1) per yield)
    while (yieldedIndex < parts.length) {
      yield parts[yieldedIndex++];
    }
  }

  // Yield any remaining parts
  while (yieldedIndex < parts.length) {
    yield parts[yieldedIndex++];
  }
}
