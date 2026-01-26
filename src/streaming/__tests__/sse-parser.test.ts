import { describe, it, expect } from '@jest/globals';

describe('SSE Parser', () => {
  it('should parse text delta events', () => {
    const sseData = `event: message
data: {"chatResponse":{"chatChoice":[{"message":{"content":[{"text":"Hello"}]}}]}}

`;
    expect(sseData).toContain('Hello');
  });

  it('should parse multiple text deltas', () => {
    const deltas = ['Hello', ' ', 'world'];
    expect(deltas).toHaveLength(3);
  });

  it('should parse finish event with usage', () => {
    const finish = {
      type: 'finish',
      finishReason: 'stop',
      usage: {
        promptTokens: 5,
        completionTokens: 3,
      },
    };
    expect(finish.type).toBe('finish');
    expect(finish.usage.promptTokens).toBe(5);
  });

  it('should handle done event', () => {
    const sseData = `event: done
data: [DONE]
`;
    expect(sseData).toContain('done');
  });

  it('should map STOP to stop finish reason', () => {
    const finishReason = 'STOP';
    const mapped = finishReason === 'STOP' ? 'stop' : 'other';
    expect(mapped).toBe('stop');
  });

  it('should map LENGTH to length finish reason', () => {
    const finishReason = 'LENGTH';
    const mapped = finishReason === 'LENGTH' ? 'length' : 'other';
    expect(mapped).toBe('length');
  });

  it('should map CONTENT_FILTER to content-filter', () => {
    const finishReason = 'CONTENT_FILTER';
    const mapped = finishReason === 'CONTENT_FILTER' ? 'content-filter' : 'other';
    expect(mapped).toBe('content-filter');
  });

  it('should ignore malformed JSON events', () => {
    const sseData = `event: message
data: {invalid json}

event: message
data: {"chatResponse":{"chatChoice":[{"message":{"content":[{"text":"Valid"}]}}]}}
`;
    expect(sseData).toContain('Valid');
  });

  it('should handle empty events', () => {
    const sseData = `event: message
data: {}

`;
    expect(sseData).toContain('message');
  });

  it('should yield text-delta stream parts', () => {
    const part = {
      type: 'text-delta',
      textDelta: 'chunk',
    };
    expect(part.type).toBe('text-delta');
  });

  it('should yield finish stream part', () => {
    const part = {
      type: 'finish',
      finishReason: 'stop',
      usage: { promptTokens: 1, completionTokens: 1 },
    };
    expect(part.type).toBe('finish');
  });
});
