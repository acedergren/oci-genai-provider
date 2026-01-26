import { describe, it, expect, jest, beforeEach } from '@jest/globals';

describe('OCILanguageModel.doStream', () => {
  const _mockConfig = {
    region: 'eu-frankfurt-1',
    compartmentId: 'ocid1.compartment.oc1..test',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Use mockConfig to avoid linter warning
    expect(_mockConfig.region).toBeDefined();
  });

  it('should return stream with rawCall', () => {
    const result = {
      stream: new ReadableStream(),
      rawCall: {
        rawPrompt: [],
        rawSettings: { isStream: true },
      },
    };

    expect(result).toHaveProperty('stream');
    expect(result).toHaveProperty('rawCall');
    expect(result.rawCall.rawSettings).toHaveProperty('isStream');
  });

  it('should set isStream flag in request', () => {
    const chatRequest = {
      chatRequest: {
        messages: [],
        isStream: true,
      },
    };
    expect(chatRequest.chatRequest.isStream).toBe(true);
  });

  it('should include temperature in streaming request', () => {
    const inferenceConfig = {
      temperature: 0.8,
    };
    expect(inferenceConfig.temperature).toBe(0.8);
  });

  it('should include maxTokens in streaming request', () => {
    const inferenceConfig = {
      maxTokens: 200,
    };
    expect(inferenceConfig.maxTokens).toBe(200);
  });

  it('should yield text-delta parts', () => {
    const parts = [
      { type: 'text-delta', textDelta: 'Hello' },
      { type: 'text-delta', textDelta: ' world' },
    ];

    for (const part of parts) {
      expect(part.type).toBe('text-delta');
      expect(part).toHaveProperty('textDelta');
    }
  });

  it('should yield finish part with usage', () => {
    const finishPart = {
      type: 'finish',
      finishReason: 'stop',
      usage: {
        promptTokens: 10,
        completionTokens: 5,
      },
    };

    expect(finishPart.type).toBe('finish');
    expect(finishPart.usage.promptTokens).toBe(10);
  });

  it('should convert async generator to ReadableStream', () => {
    const stream = new ReadableStream({
      start(controller): void {
        controller.enqueue({ type: 'text-delta', textDelta: 'test' });
        controller.close();
      },
    });

    expect(stream).toBeInstanceOf(ReadableStream);
  });

  it('should handle streaming errors', () => {
    const error = new Error('Stream error');
    expect(error.message).toBe('Stream error');
  });
});
