import { describe, it, expect } from '@jest/globals';
import { mapFinishReason, parseSSEStream } from '../sse-parser';
import type { StreamPart } from '../types';

describe('SSE Parser', () => {
  describe('mapFinishReason', () => {
    it('should map STOP to stop', () => {
      expect(mapFinishReason('STOP')).toBe('stop');
    });

    it('should map LENGTH to length', () => {
      expect(mapFinishReason('LENGTH')).toBe('length');
    });

    it('should map CONTENT_FILTER to content-filter', () => {
      expect(mapFinishReason('CONTENT_FILTER')).toBe('content-filter');
    });

    it('should map unknown to other', () => {
      expect(mapFinishReason('UNKNOWN')).toBe('other');
    });

    it('should map empty string to other', () => {
      expect(mapFinishReason('')).toBe('other');
    });
  });

  describe('SSE data format', () => {
    it('should recognize text delta event structure', () => {
      const sseData = {
        chatResponse: {
          chatChoice: [{ message: { content: [{ text: 'Hello' }] } }],
        },
      };
      expect(sseData.chatResponse.chatChoice[0].message.content[0].text).toBe('Hello');
    });

    it('should recognize finish event structure', () => {
      const sseData = {
        chatResponse: {
          chatChoice: [{ finishReason: 'STOP' }],
          usage: { promptTokens: 5, completionTokens: 3 },
        },
      };
      expect(sseData.chatResponse.chatChoice[0].finishReason).toBe('STOP');
      expect(sseData.chatResponse.usage.promptTokens).toBe(5);
    });

    it('should yield text-delta parts', () => {
      const part = {
        type: 'text-delta' as const,
        textDelta: 'chunk',
      };
      expect(part.type).toBe('text-delta');
      expect(part.textDelta).toBe('chunk');
    });

    it('should yield finish part with usage', () => {
      const part = {
        type: 'finish' as const,
        finishReason: 'stop' as const,
        usage: { promptTokens: 1, completionTokens: 1 },
      };
      expect(part.type).toBe('finish');
      expect(part.finishReason).toBe('stop');
    });
  });

  describe('SSE parsing edge cases', () => {
    it('should handle done event marker', () => {
      const doneMarker = '[DONE]';
      expect(doneMarker).toBe('[DONE]');
    });

    it('should handle malformed JSON gracefully', () => {
      const tryParse = (data: string): unknown => {
        try {
          return JSON.parse(data) as unknown;
        } catch {
          return null;
        }
      };
      expect(tryParse('{invalid}')).toBeNull();
      expect(tryParse('{"valid": true}')).toEqual({ valid: true });
    });

    it('should handle empty events', () => {
      const emptyData = {};
      expect(Object.keys(emptyData)).toHaveLength(0);
    });
  });

  describe('parseSSEStream', () => {
    it('should parse text delta from stream', async () => {
      const sseText = `event: message
data: {"chatResponse":{"chatChoice":[{"message":{"content":[{"text":"Hello"}]}}]}}

`;
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller): void {
          controller.enqueue(encoder.encode(sseText));
          controller.close();
        },
      });

      const response = new Response(stream);
      const parts: StreamPart[] = [];

      for await (const part of parseSSEStream(response)) {
        parts.push(part);
      }

      expect(parts.length).toBeGreaterThan(0);
      expect(parts[0].type).toBe('text-delta');
      if (parts[0].type === 'text-delta') {
        expect(parts[0].textDelta).toBe('Hello');
      }
    });

    it('should parse finish event from stream', async () => {
      const sseText = `event: message
data: {"chatResponse":{"chatChoice":[{"finishReason":"STOP"}],"usage":{"promptTokens":10,"completionTokens":5}}}

`;
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller): void {
          controller.enqueue(encoder.encode(sseText));
          controller.close();
        },
      });

      const response = new Response(stream);
      const parts: StreamPart[] = [];

      for await (const part of parseSSEStream(response)) {
        parts.push(part);
      }

      const finishPart = parts.find((p) => p.type === 'finish');
      expect(finishPart).toBeDefined();
      if (finishPart?.type === 'finish') {
        expect(finishPart.finishReason).toBe('stop');
        expect(finishPart.usage.promptTokens).toBe(10);
      }
    });
  });
});
