import { createParser, type EventSourceMessage } from 'eventsource-parser';
import type { LanguageModelV3FinishReason } from '@ai-sdk/provider';
import type { StreamPart, UnifiedFinishReason } from './types';

/**
 * Maps OCI GenAI finish reasons to AI SDK v3 LanguageModelV3FinishReason structure.
 *
 * @param reason - The raw finish reason from OCI GenAI API
 * @returns A properly structured LanguageModelV3FinishReason object with unified and raw fields
 */
export function mapFinishReason(reason: string): LanguageModelV3FinishReason {
  const unified: UnifiedFinishReason = ((): UnifiedFinishReason => {
    switch (reason) {
      case 'STOP':
        return 'stop';
      case 'LENGTH':
        return 'length';
      case 'CONTENT_FILTER':
        return 'content-filter';
      case 'TOOL_CALLS':
        return 'tool-calls';
      case 'ERROR':
        return 'error';
      default:
        return 'other';
    }
  })();

  return {
    unified,
    raw: reason,
  };
}

interface OCIChatResponse {
  chatResponse?: {
    chatChoice?: Array<{
      message?: {
        content?: Array<{ text?: string }>;
      };
      finishReason?: string;
    }>;
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
    };
  };
}

export async function* parseSSEStream(response: Response): AsyncGenerator<StreamPart> {
  const body = response.body;
  if (!body) {
    throw new Error('Response body is not readable');
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  const parts: StreamPart[] = [];
  let yieldedIndex = 0;

  const parser = createParser({
    onEvent: (event: EventSourceMessage) => {
      const data = event.data;
      if (data === '[DONE]') return;

      try {
        const parsed = JSON.parse(data) as OCIChatResponse;
        const choice = parsed.chatResponse?.chatChoice?.[0];

        // Check for text delta
        const textContent = choice?.message?.content?.[0]?.text;
        if (textContent) {
          parts.push({
            type: 'text-delta',
            textDelta: textContent,
          });
        }

        // Check for finish
        const finishReason = choice?.finishReason;
        if (finishReason) {
          parts.push({
            type: 'finish',
            finishReason: mapFinishReason(finishReason),
            usage: {
              promptTokens: parsed.chatResponse?.usage?.promptTokens ?? 0,
              completionTokens: parsed.chatResponse?.usage?.completionTokens ?? 0,
            },
          });
        }
      } catch {
        // Ignore malformed JSON
      }
    },
  });

  while (true) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = await reader.read();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (result.done) break;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
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
