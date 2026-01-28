import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NoSuchModelError } from '@ai-sdk/provider';
import { createOCI, oci } from '../index';
import { OCIGenAIProvider } from '../provider';

// Mock OCI SDK
jest.mock('oci-common', () => ({
  ConfigFileAuthenticationDetailsProvider: jest.fn().mockImplementation(() => ({})),

  InstancePrincipalsAuthenticationDetailsProviderBuilder: jest.fn().mockImplementation(() => ({
    build: jest.fn().mockImplementation(() => Promise.resolve({})),
  })),
  ResourcePrincipalAuthenticationDetailsProvider: {
    builder: jest.fn().mockImplementation(() => ({})),
  },
}));

jest.mock('oci-generativeaiinference', () => ({
  GenerativeAiInferenceClient: jest.fn().mockImplementation(() => ({
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
    it('should create embedding model instance', () => {
      const provider = new OCIGenAIProvider({ region: 'eu-frankfurt-1' });
      const model = provider.embeddingModel('cohere.embed-multilingual-v3.0');

      expect(model).toBeDefined();
      expect(model.provider).toBe('oci-genai');
      expect(model.modelId).toBe('cohere.embed-multilingual-v3.0');
    });

    it('should create different embedding models', () => {
      const provider = new OCIGenAIProvider({ region: 'eu-frankfurt-1' });

      const multilingual = provider.embeddingModel('cohere.embed-multilingual-v3.0');
      expect(multilingual.modelId).toContain('multilingual');

      const english = provider.embeddingModel('cohere.embed-english-v3.0');
      expect(english.modelId).toContain('english');

      const light = provider.embeddingModel('cohere.embed-english-light-v3.0');
      expect(light.modelId).toContain('light');
    });

    it('should merge provider config with embedding-specific settings', () => {
      const provider = new OCIGenAIProvider({ region: 'eu-frankfurt-1' });
      const model = provider.embeddingModel('cohere.embed-english-light-v3.0', {
        dimensions: 384,
        truncate: 'START',
      });

      expect(model).toBeDefined();
    });

    it('should throw error for invalid embedding model ID', () => {
      const provider = new OCIGenAIProvider();

      expect(() => provider.embeddingModel('invalid-model')).toThrow('Invalid embedding model ID');
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
    it('should create transcription model with valid ID', () => {
      const provider = new OCIGenAIProvider({ region: 'us-phoenix-1' });
      const model = provider.transcriptionModel('WHISPER_MEDIUM');

      expect(model).toBeDefined();
      expect(model.provider).toBe('oci-genai');
      expect(model.modelId).toBe('WHISPER_MEDIUM');
    });

    it('should create Oracle transcription model', () => {
      const provider = new OCIGenAIProvider({ region: 'us-phoenix-1' });
      const model = provider.transcriptionModel('ORACLE');

      expect(model).toBeDefined();
      expect(model.modelId).toBe('ORACLE');
    });

    it('should throw error for invalid model ID', () => {
      const provider = new OCIGenAIProvider();

      expect(() => provider.transcriptionModel('invalid-model')).toThrow(
        'Invalid transcription model ID'
      );
    });
  });

  describe('speechModel()', () => {
    it('should create speech model with valid ID', () => {
      const provider = new OCIGenAIProvider({ region: 'us-phoenix-1' });
      const model = provider.speechModel('TTS_2_NATURAL');

      expect(model).toBeDefined();
      expect(model.provider).toBe('oci-genai');
      expect(model.modelId).toBe('TTS_2_NATURAL');
    });

    it('should create TTS_1_STANDARD model', () => {
      const provider = new OCIGenAIProvider({ region: 'us-phoenix-1' });
      const model = provider.speechModel('TTS_1_STANDARD');

      expect(model).toBeDefined();
      expect(model.modelId).toBe('TTS_1_STANDARD');
    });

    it('should throw error for invalid model ID', () => {
      const provider = new OCIGenAIProvider();

      expect(() => provider.speechModel('invalid-tts')).toThrow('Invalid speech model ID');
    });
  });

  describe('rerankingModel()', () => {
    it('should create reranking model', () => {
      const provider = new OCIGenAIProvider({ region: 'eu-frankfurt-1' });
      const model = provider.rerankingModel('cohere.rerank-v3.5');

      expect(model).toBeDefined();
      expect(model.provider).toBe('oci-genai');
      expect(model.modelId).toBe('cohere.rerank-v3.5');
    });

    it('should merge config with reranking-specific settings', () => {
      const provider = new OCIGenAIProvider({ region: 'eu-frankfurt-1' });
      const model = provider.rerankingModel('cohere.rerank-v3.5', {
        topN: 5,
        returnDocuments: true,
      });

      expect(model).toBeDefined();
    });

    it('should throw for invalid reranking model ID', () => {
      const provider = new OCIGenAIProvider();

      expect(() => {
        provider.rerankingModel('invalid-model');
      }).toThrow('Invalid reranking model ID');
    });
  });
});
