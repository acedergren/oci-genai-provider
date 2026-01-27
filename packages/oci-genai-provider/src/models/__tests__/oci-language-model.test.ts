import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { OCILanguageModel } from '../oci-language-model';

// Mock auth module
jest.mock('../../auth/index.js', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  createAuthProvider: jest.fn(() =>
    Promise.resolve({
      getKeyId: () => 'mock-key-id',
    })
  ),
  getRegion: jest.fn(() => 'eu-frankfurt-1'),
}));

// Mock OCI SDK
jest.mock('oci-generativeaiinference', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  GenerativeAiInferenceClient: jest.fn().mockImplementation(() => ({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    chat: jest.fn().mockImplementation(() =>
      Promise.resolve({
        chatResponse: {
          chatChoice: [
            {
              message: { content: [{ text: 'Generated response' }] },
              finishReason: 'STOP',
            },
          ],
          usage: { promptTokens: 15, completionTokens: 10, totalTokens: 25 },
        },
      })
    ),
  })),
}));

describe('OCILanguageModel', () => {
  const mockConfig = {
    region: 'eu-frankfurt-1',
    compartmentId: 'ocid1.compartment.oc1..test',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should initialize client with proper auth provider lazily', async () => {
      const config = {
        auth: 'config_file' as const,
        configPath: '~/.oci/config',
        compartmentId: 'ocid1.compartment.oc1..test',
      };

      const model = new OCILanguageModel('cohere.command-r-plus', config);

      // Verify model was created but client is not initialized yet
      expect(model.modelId).toBe('cohere.command-r-plus');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      expect((model as any)._client).toBeUndefined();

      const options = {
        prompt: [{ role: 'user' as const, content: [{ type: 'text' as const, text: 'test' }] }],
      };

      // Make API call which should trigger lazy client initialization
      await model.doGenerate(options);

      // Verify client is now initialized
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      expect((model as any)._client).toBeDefined();
    });
  });

  describe('Construction', () => {
    it('should create model with valid model ID', () => {
      const model = new OCILanguageModel('cohere.command-r-plus', mockConfig);
      expect(model.modelId).toBe('cohere.command-r-plus');
    });

    it('should throw error for invalid model ID', () => {
      expect(() => new OCILanguageModel('invalid.model', mockConfig)).toThrow('Invalid model ID');
    });

    it('should have correct specification version', () => {
      const model = new OCILanguageModel('cohere.command-r-plus', mockConfig);
      expect(model.specificationVersion).toBe('v3');
    });

    it('should have correct provider identifier', () => {
      const model = new OCILanguageModel('cohere.command-r-plus', mockConfig);
      expect(model.provider).toBe('oci-genai');
    });

    it('should have tool default object generation mode', () => {
      const model = new OCILanguageModel('cohere.command-r-plus', mockConfig);
      expect(model.defaultObjectGenerationMode).toBe('tool');
    });
  });

  describe('doGenerate', () => {
    it('should return content from response', async () => {
      const model = new OCILanguageModel('cohere.command-r-plus', mockConfig);

      const result = await model.doGenerate({
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
      });

      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.finishReason).toBe('stop');
    });

    it('should return usage statistics', async () => {
      const model = new OCILanguageModel('cohere.command-r-plus', mockConfig);

      const result = await model.doGenerate({
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }],
      });

      expect(result.usage.inputTokens.total).toBe(15);
      expect(result.usage.outputTokens.total).toBe(10);
    });
  });
});
