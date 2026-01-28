import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NoSuchModelError } from '@ai-sdk/provider';
import { createOCI, createOCILegacy, oci } from '../index';
import { OCIGenAIProvider } from '../provider';

// Mock OCI SDK
jest.mock('oci-common', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  ConfigFileAuthenticationDetailsProvider: jest.fn().mockImplementation(() => ({})),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  InstancePrincipalsAuthenticationDetailsProviderBuilder: jest.fn().mockImplementation(() => ({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    build: jest.fn().mockImplementation(() => Promise.resolve({})),
  })),
  ResourcePrincipalAuthenticationDetailsProvider: {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    builder: jest.fn().mockImplementation(() => ({})),
  },
}));

jest.mock('oci-generativeaiinference', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  GenerativeAiInferenceClient: jest.fn().mockImplementation(() => ({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    chat: jest.fn().mockImplementation(() =>
      Promise.resolve({
        chatResponse: {
          chatChoice: [{ message: { content: [{ text: 'Response' }] }, finishReason: 'STOP' }],
          usage: { promptTokens: 5, completionTokens: 3 },
        },
      })
    ),
  })),
}));

describe('createOCI Provider Factory (ProviderV3)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.OCI_COMPARTMENT_ID = 'ocid1.compartment.oc1..test';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Factory Creation', () => {
    it('should create provider with default config', () => {
      const provider = createOCI();
      expect(provider.specificationVersion).toBe('v3');
      expect(typeof provider.languageModel).toBe('function');
    });

    it('should create provider with Frankfurt region', () => {
      const provider = createOCI({ region: 'eu-frankfurt-1' });
      expect(provider.specificationVersion).toBe('v3');
    });

    it('should create provider with custom profile', () => {
      const provider = createOCI({ region: 'eu-frankfurt-1', profile: 'FRANKFURT' });
      expect(provider.specificationVersion).toBe('v3');
    });

    it('should create provider with compartment ID', () => {
      const provider = createOCI({ compartmentId: 'ocid1.compartment.oc1..test' });
      expect(provider.specificationVersion).toBe('v3');
    });

    it('should create provider with instance principal auth', () => {
      const provider = createOCI({ auth: 'instance_principal' });
      expect(provider.specificationVersion).toBe('v3');
    });
  });

  describe('Model Creation via languageModel()', () => {
    it('should create language model instance', () => {
      const provider = createOCI();
      const model = provider.languageModel('cohere.command-r-plus');
      expect(model.modelId).toBe('cohere.command-r-plus');
      expect(model.provider).toBe('oci-genai');
    });

    it('should create Grok model', () => {
      const provider = createOCI();
      const model = provider.languageModel('xai.grok-4-maverick');
      expect(model.modelId).toContain('grok');
    });

    it('should create Llama model', () => {
      const provider = createOCI();
      const model = provider.languageModel('meta.llama-3.3-70b-instruct');
      expect(model.modelId).toContain('llama');
    });

    it('should create Cohere model', () => {
      const provider = createOCI();
      const model = provider.languageModel('cohere.command-r-plus');
      expect(model.modelId).toContain('cohere');
    });

    it('should create Gemini model', () => {
      const provider = createOCI();
      const model = provider.languageModel('google.gemini-2.5-flash');
      expect(model.modelId).toContain('gemini');
    });

    it('should throw error for invalid model ID', () => {
      const provider = createOCI();
      expect(() => provider.languageModel('invalid.model')).toThrow('Invalid model ID');
    });
  });

  describe('Configuration Cascade', () => {
    it('should prioritize config over environment', () => {
      process.env.OCI_REGION = 'us-ashburn-1';
      const provider = createOCI({ region: 'eu-frankfurt-1' });
      const model = provider.languageModel('cohere.command-r-plus');
      expect(model).toBeDefined();
    });

    it('should use environment when config not provided', () => {
      process.env.OCI_REGION = 'eu-stockholm-1';
      const provider = createOCI();
      expect(provider).toBeDefined();
    });

    it('should use Frankfurt as final default', () => {
      delete process.env.OCI_REGION;
      const provider = createOCI();
      expect(provider).toBeDefined();
    });
  });

  describe('oci default instance', () => {
    it('should export default provider instance', () => {
      expect(oci).toBeInstanceOf(OCIGenAIProvider);
      expect(oci.specificationVersion).toBe('v3');
    });

    it('should create language models from default instance', () => {
      const model = oci.languageModel('cohere.command-r');
      expect(model).toBeDefined();
      expect(model.modelId).toBe('cohere.command-r');
    });
  });
});

describe('createOCILegacy (Backward Compatibility)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.OCI_COMPARTMENT_ID = 'ocid1.compartment.oc1..test';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should create legacy provider with model() method', () => {
    const provider = createOCILegacy();
    expect(provider.provider).toBe('oci-genai');
    expect(typeof provider.model).toBe('function');
  });

  it('should create models via model() method', () => {
    const provider = createOCILegacy();
    const model = provider.model('cohere.command-r-plus');
    expect(model.modelId).toBe('cohere.command-r-plus');
    expect(model.provider).toBe('oci-genai');
  });
});

// ============================================================================
// OCIGenAIProvider Class Tests (ProviderV3)
// ============================================================================

describe('OCIGenAIProvider (ProviderV3)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.OCI_COMPARTMENT_ID = 'ocid1.compartment.oc1..test';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('specificationVersion', () => {
    it('should have specificationVersion v3', () => {
      const provider = new OCIGenAIProvider();
      expect(provider.specificationVersion).toBe('v3');
    });
  });

  describe('languageModel()', () => {
    it('should create language model with model ID', () => {
      const provider = new OCIGenAIProvider({ region: 'eu-frankfurt-1' });
      const model = provider.languageModel('cohere.command-r-plus');

      expect(model).toBeDefined();
      expect(model.provider).toBe('oci-genai');
      expect(model.modelId).toBe('cohere.command-r-plus');
    });

    it('should pass config to language models', () => {
      const provider = new OCIGenAIProvider({
        region: 'eu-stockholm-1',
        compartmentId: 'ocid1.compartment.test',
      });

      const model = provider.languageModel('meta.llama-3.3-70b-instruct');
      expect(model).toBeDefined();
    });

    it('should merge provider config with model-specific settings', () => {
      const provider = new OCIGenAIProvider({ region: 'eu-frankfurt-1' });
      const model = provider.languageModel('cohere.command-r', {
        region: 'us-ashburn-1', // Override provider region
        requestOptions: { timeoutMs: 60000 },
      });

      expect(model).toBeDefined();
    });

    it('should throw error for invalid model ID', () => {
      const provider = new OCIGenAIProvider();
      expect(() => provider.languageModel('invalid.model')).toThrow('Invalid model ID');
    });
  });

  describe('embeddingModel()', () => {
    it('should throw NoSuchModelError - not yet implemented', () => {
      const provider = new OCIGenAIProvider();

      expect(() => provider.embeddingModel('cohere.embed-multilingual-v3.0')).toThrow(
        NoSuchModelError
      );
    });

    it('should include helpful message in error', () => {
      const provider = new OCIGenAIProvider();

      try {
        provider.embeddingModel('cohere.embed-multilingual-v3.0');
        fail('Expected NoSuchModelError');
      } catch (error) {
        expect(error).toBeInstanceOf(NoSuchModelError);
        expect((error as NoSuchModelError).message).toContain('Plan 2');
      }
    });
  });

  describe('imageModel()', () => {
    it('should throw NoSuchModelError - OCI does not support image generation', () => {
      const provider = new OCIGenAIProvider();

      expect(() => provider.imageModel('dalle-3')).toThrow(NoSuchModelError);
    });

    it('should include helpful message about OCI limitations', () => {
      const provider = new OCIGenAIProvider();

      try {
        provider.imageModel('dalle-3');
        fail('Expected NoSuchModelError');
      } catch (error) {
        expect(error).toBeInstanceOf(NoSuchModelError);
        expect((error as NoSuchModelError).message).toContain('does not provide');
      }
    });
  });

  describe('transcriptionModel()', () => {
    it('should throw NoSuchModelError - not yet implemented', () => {
      const provider = new OCIGenAIProvider();

      expect(() => provider.transcriptionModel('whisper-1')).toThrow(NoSuchModelError);
    });

    it('should include helpful message in error', () => {
      const provider = new OCIGenAIProvider();

      try {
        provider.transcriptionModel('whisper-1');
        fail('Expected NoSuchModelError');
      } catch (error) {
        expect(error).toBeInstanceOf(NoSuchModelError);
        expect((error as NoSuchModelError).message).toContain('Plan 4');
      }
    });
  });

  describe('speechModel()', () => {
    it('should throw NoSuchModelError - not yet implemented', () => {
      const provider = new OCIGenAIProvider();

      expect(() => provider.speechModel('tts-1')).toThrow(NoSuchModelError);
    });

    it('should include helpful message in error', () => {
      const provider = new OCIGenAIProvider();

      try {
        provider.speechModel('tts-1');
        fail('Expected NoSuchModelError');
      } catch (error) {
        expect(error).toBeInstanceOf(NoSuchModelError);
        expect((error as NoSuchModelError).message).toContain('Plan 3');
      }
    });
  });

  describe('rerankingModel()', () => {
    it('should throw NoSuchModelError - not yet implemented', () => {
      const provider = new OCIGenAIProvider();

      expect(() => provider.rerankingModel('cohere.rerank-multilingual-v3.0')).toThrow(
        NoSuchModelError
      );
    });

    it('should include helpful message in error', () => {
      const provider = new OCIGenAIProvider();

      try {
        provider.rerankingModel('cohere.rerank-multilingual-v3.0');
        fail('Expected NoSuchModelError');
      } catch (error) {
        expect(error).toBeInstanceOf(NoSuchModelError);
        expect((error as NoSuchModelError).message).toContain('Plan 5');
      }
    });
  });
});
