import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { createOCI, oci } from '../index';

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

describe('createOCI Provider Factory', () => {
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
      expect(provider.provider).toBe('oci-genai');
      expect(typeof provider.model).toBe('function');
    });

    it('should create provider with Frankfurt region', () => {
      const provider = createOCI({ region: 'eu-frankfurt-1' });
      expect(provider.provider).toBe('oci-genai');
    });

    it('should create provider with custom profile', () => {
      const provider = createOCI({ region: 'eu-frankfurt-1', profile: 'FRANKFURT' });
      expect(provider.provider).toBe('oci-genai');
    });

    it('should create provider with compartment ID', () => {
      const provider = createOCI({ compartmentId: 'ocid1.compartment.oc1..test' });
      expect(provider.provider).toBe('oci-genai');
    });

    it('should create provider with instance principal auth', () => {
      const provider = createOCI({ auth: 'instance_principal' });
      expect(provider.provider).toBe('oci-genai');
    });
  });

  describe('Model Creation', () => {
    it('should create language model instance', () => {
      const provider = createOCI();
      const model = provider.model('cohere.command-r-plus');
      expect(model.modelId).toBe('cohere.command-r-plus');
      expect(model.provider).toBe('oci-genai');
    });

    it('should create Grok model', () => {
      const provider = createOCI();
      const model = provider.model('xai.grok-4-maverick');
      expect(model.modelId).toContain('grok');
    });

    it('should create Llama model', () => {
      const provider = createOCI();
      const model = provider.model('meta.llama-3.3-70b-instruct');
      expect(model.modelId).toContain('llama');
    });

    it('should create Cohere model', () => {
      const provider = createOCI();
      const model = provider.model('cohere.command-r-plus');
      expect(model.modelId).toContain('cohere');
    });

    it('should create Gemini model', () => {
      const provider = createOCI();
      const model = provider.model('google.gemini-2.5-flash');
      expect(model.modelId).toContain('gemini');
    });

    it('should throw error for invalid model ID', () => {
      const provider = createOCI();
      expect(() => provider.model('invalid.model')).toThrow('Invalid model ID');
    });
  });

  describe('Configuration Cascade', () => {
    it('should prioritize config over environment', () => {
      process.env.OCI_REGION = 'us-ashburn-1';
      const provider = createOCI({ region: 'eu-frankfurt-1' });
      const model = provider.model('cohere.command-r-plus');
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

  describe('oci() convenience function', () => {
    it('should create model directly', () => {
      const model = oci('cohere.command-r-plus');
      expect(model.modelId).toBe('cohere.command-r-plus');
      expect(model.provider).toBe('oci-genai');
    });

    it('should accept config', () => {
      const model = oci('xai.grok-4-maverick', { region: 'eu-frankfurt-1' });
      expect(model.modelId).toBe('xai.grok-4-maverick');
    });
  });
});
