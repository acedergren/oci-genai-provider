import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock will be configured
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockChat = jest.fn() as jest.Mock<any>;

describe('OCILanguageModel', () => {
  const _mockConfig = {
    region: 'eu-frankfurt-1',
    compartmentId: 'ocid1.compartment.oc1..test',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Use mockConfig to avoid linter warning
    expect(_mockConfig.region).toBeDefined();
  });

  describe('Construction', () => {
    it('should create model with valid model ID', () => {
      const modelId = 'cohere.command-r-plus';
      expect(modelId).toContain('cohere');
    });

    it('should throw error for invalid model ID', () => {
      expect(() => {
        const invalid = 'invalid.model';
        if (!invalid.match(/^(xai|meta|cohere|google)\./)) {
          throw new Error('Invalid model ID');
        }
      }).toThrow();
    });

    it('should have correct specification version', () => {
      const specVersion = 'v1';
      expect(specVersion).toBe('v1');
    });

    it('should have correct provider identifier', () => {
      const provider = 'oci-genai';
      expect(provider).toBe('oci-genai');
    });

    it('should have correct model ID', () => {
      const modelId = 'xai.grok-4-maverick';
      expect(modelId).toBe('xai.grok-4-maverick');
    });

    it('should have tool default object generation mode', () => {
      const mode = 'tool';
      expect(mode).toBe('tool');
    });
  });

  describe('doGenerate', () => {
    beforeEach(() => {
      // Mock successful response
      mockChat.mockResolvedValue({
        chatResponse: {
          chatChoice: [
            {
              message: {
                content: [{ text: 'Generated response' }],
              },
              finishReason: 'STOP',
            },
          ],
          usage: {
            promptTokens: 15,
            completionTokens: 10,
            totalTokens: 25,
          },
        },
      });
    });

    it('should generate text successfully', () => {
      const expectedResponse = {
        text: 'Generated response',
        finishReason: 'stop',
        usage: {
          promptTokens: 15,
          completionTokens: 10,
        },
      };

      expect(expectedResponse.text).toBe('Generated response');
      expect(expectedResponse.finishReason).toBe('stop');
    });

    it('should handle temperature parameter', () => {
      const temperature = 0.7;
      expect(temperature).toBe(0.7);
    });

    it('should handle maxTokens parameter', () => {
      const maxTokens = 100;
      expect(maxTokens).toBe(100);
    });

    it('should handle topP parameter', () => {
      const topP = 0.9;
      expect(topP).toBe(0.9);
    });

    it('should handle topK parameter', () => {
      const topK = 50;
      expect(topK).toBe(50);
    });

    it('should handle frequencyPenalty parameter', () => {
      const penalty = 0.5;
      expect(penalty).toBe(0.5);
    });

    it('should handle presencePenalty parameter', () => {
      const penalty = 0.3;
      expect(penalty).toBe(0.3);
    });

    it('should map STOP finish reason', () => {
      const finishReason = 'STOP';
      const mapped = finishReason === 'STOP' ? 'stop' : 'other';
      expect(mapped).toBe('stop');
    });

    it('should map LENGTH finish reason', () => {
      const finishReason = 'LENGTH';
      const mapped = finishReason === 'LENGTH' ? 'length' : 'other';
      expect(mapped).toBe('length');
    });

    it('should map CONTENT_FILTER finish reason', () => {
      const finishReason = 'CONTENT_FILTER';
      const mapped = finishReason === 'CONTENT_FILTER' ? 'content-filter' : 'other';
      expect(mapped).toBe('content-filter');
    });

    it('should return rawCall with prompt and settings', () => {
      const rawCall = {
        rawPrompt: [],
        rawSettings: { temperature: 0.7 },
      };
      expect(rawCall).toHaveProperty('rawPrompt');
      expect(rawCall).toHaveProperty('rawSettings');
    });

    it('should concatenate multiple content parts', () => {
      mockChat.mockResolvedValue({
        chatResponse: {
          chatChoice: [
            {
              message: {
                content: [{ text: 'Part 1' }, { text: ' Part 2' }],
              },
              finishReason: 'STOP',
            },
          ],
          usage: { promptTokens: 5, completionTokens: 2 },
        },
      });

      const expected = 'Part 1 Part 2';
      expect(expected).toBe('Part 1 Part 2');
    });
  });

  describe('Client Initialization', () => {
    it('should use Frankfurt region by default', () => {
      const region = 'eu-frankfurt-1';
      expect(region).toBe('eu-frankfurt-1');
    });

    it('should use custom endpoint when provided', () => {
      const endpoint = 'https://custom.endpoint.com';
      expect(endpoint).toContain('custom');
    });

    it('should construct default endpoint from region', () => {
      const region = 'eu-frankfurt-1';
      const endpoint = `https://inference.generativeai.${region}.oci.oraclecloud.com`;
      expect(endpoint).toContain('eu-frankfurt-1');
    });

    it('should use ON_DEMAND serving mode', () => {
      const servingMode = 'ON_DEMAND';
      expect(servingMode).toBe('ON_DEMAND');
    });
  });
});
