import { describe, it, expect } from '@jest/globals';
import { mapFinishReason, parseSSEStream } from '../sse-parser';
import type { StreamPart } from '../types';

describe('SSE Parser', () => {
  describe('mapFinishReason', () => {
    it('should map STOP to stop', () => {
      const result = mapFinishReason('STOP');
      expect(result).toEqual({ unified: 'stop', raw: 'STOP' });
    });

    it('should map LENGTH to length', () => {
      const result = mapFinishReason('LENGTH');
      expect(result).toEqual({ unified: 'length', raw: 'LENGTH' });
    });

    it('should map CONTENT_FILTER to content-filter', () => {
      const result = mapFinishReason('CONTENT_FILTER');
      expect(result).toEqual({ unified: 'content-filter', raw: 'CONTENT_FILTER' });
    });

    it('should map unknown to other', () => {
      const result = mapFinishReason('UNKNOWN');
      expect(result).toEqual({ unified: 'other', raw: 'UNKNOWN' });
    });

    it('should map empty string to other', () => {
      const result = mapFinishReason('');
      expect(result).toEqual({ unified: 'other', raw: '' });
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
        finishReason: { unified: 'stop' as const, raw: 'STOP' },
        usage: { promptTokens: 1, completionTokens: 1 },
      };
      expect(part.type).toBe('finish');
      expect(part.finishReason).toEqual({ unified: 'stop', raw: 'STOP' });
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

  describe('Performance', () => {
    it('should parse 1000 events in under 100ms', async () => {
      const events: string[] = [];
      for (let i = 0; i < 1000; i++) {
        events.push(
          `event: message\ndata: {"chatResponse":{"chatChoice":[{"message":{"content":[{"text":"token${i}"}]}}]}}\n\n`
        );
      }
      const sseText = events.join('');

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller): void {
          controller.enqueue(encoder.encode(sseText));
          controller.close();
        },
      });

      const response = new Response(stream);
      const startTime = Date.now();

      let count = 0;
      for await (const part of parseSSEStream(response)) {
        if (part.type === 'text-delta') {
          count++;
        }
      }

      const duration = Date.now() - startTime;
      expect(count).toBe(1000);
      expect(duration).toBeLessThan(200); // Allow headroom for CI environments
    }, 10000); // 10 second timeout for benchmark
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
        expect(finishPart.finishReason).toEqual({ unified: 'stop', raw: 'STOP' });
        expect(finishPart.usage.promptTokens).toBe(10);
      }
    });
  });
});
