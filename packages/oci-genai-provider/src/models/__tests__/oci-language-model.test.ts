import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { OCILanguageModel } from '../oci-language-model';
import type { AuthenticationDetailsProvider } from 'oci-common';
import type { OCIConfig } from '../../types';

// Mock functions that will be accessible in mocks
const mockAuthProviderGetKeyId = jest.fn(() =>
  Promise.resolve('ocid1.tenancy.oc1..test/ocid1.user.oc1..test/fingerprint')
);
const mockAuthProviderGetPrivateKey = jest.fn(
  () => '-----BEGIN PRIVATE KEY-----\nMOCK\n-----END PRIVATE KEY-----'
);
const mockAuthProviderGetPassphrase = jest.fn(() => null);

const mockCreateAuthProvider =
  jest.fn<(config: OCIConfig) => Promise<AuthenticationDetailsProvider>>();
const mockGetRegion = jest.fn<(config: OCIConfig) => string>();
const mockChat = jest.fn<() => Promise<unknown>>();
const mockGenerativeAiInferenceClientConstructor = jest.fn();
const mockFromRegionId = jest.fn<(regionId: string) => unknown>();

const mockGetCompartmentId = jest.fn<(config: OCIConfig) => string>();

// Mock auth module
jest.mock('../../auth/index.js', () => ({
  createAuthProvider: (config: OCIConfig) => mockCreateAuthProvider(config),
  getRegion: (config: OCIConfig) => mockGetRegion(config),
  getCompartmentId: (config: OCIConfig) => mockGetCompartmentId(config),
}));

// Mock OCI SDK
jest.mock('oci-generativeaiinference', () => ({
  GenerativeAiInferenceClient: jest.fn().mockImplementation((config: unknown) => {
    mockGenerativeAiInferenceClientConstructor(config);
    return {
      chat: mockChat,
      region: undefined,
    };
  }),
}));

// Mock oci-common Region
jest.mock('oci-common', () => ({
  Region: {
    fromRegionId: (regionId: string) => mockFromRegionId(regionId),
  },
}));

describe('OCILanguageModel', () => {
  const mockConfig = {
    region: 'eu-frankfurt-1',
    compartmentId: 'ocid1.compartment.oc1..test',
  };

  const mockAuthProvider: AuthenticationDetailsProvider = {
    getKeyId: mockAuthProviderGetKeyId,
    getPrivateKey: mockAuthProviderGetPrivateKey,
    getPassphrase: mockAuthProviderGetPassphrase,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default mock implementations
    mockCreateAuthProvider.mockResolvedValue(mockAuthProvider);
    mockGetRegion.mockReturnValue('eu-frankfurt-1');
    mockGetCompartmentId.mockReturnValue('ocid1.compartment.oc1..test');
    mockFromRegionId.mockReturnValue({ regionId: 'eu-frankfurt-1' });
    mockChat.mockResolvedValue({
      chatResponse: {
        chatChoice: [
          {
            message: { content: [{ text: 'Generated response' }] },
            finishReason: 'STOP',
          },
        ],
        usage: { promptTokens: 15, completionTokens: 10, totalTokens: 25 },
      },
    });
  });

  describe('Authentication', () => {
    it('should initialize client with proper auth provider lazily', async () => {
      const config = {
        auth: 'config_file' as const,
        configPath: '~/.oci/config',
        compartmentId: 'ocid1.compartment.oc1..test',
      };

      const model = new OCILanguageModel('cohere.command-r-plus', config);

      // Verify model was created
      expect(model.modelId).toBe('cohere.command-r-plus');

      // Client should not be created yet - verify by checking mocks
      expect(mockCreateAuthProvider).not.toHaveBeenCalled();
      expect(mockGenerativeAiInferenceClientConstructor).not.toHaveBeenCalled();

      const options = {
        prompt: [{ role: 'user' as const, content: [{ type: 'text' as const, text: 'test' }] }],
      };

      // Make API call which should trigger lazy client initialization
      await model.doGenerate(options);

      // Verify client was initialized with proper auth provider
      expect(mockCreateAuthProvider).toHaveBeenCalledWith(config);
      expect(mockCreateAuthProvider).toHaveBeenCalledTimes(1);
      expect(mockGenerativeAiInferenceClientConstructor).toHaveBeenCalledWith({
        authenticationDetailsProvider: mockAuthProvider,
      });
      expect(mockGenerativeAiInferenceClientConstructor).toHaveBeenCalledTimes(1);
    });

    it('should reuse client across multiple calls', async () => {
      const config = {
        auth: 'config_file' as const,
        configPath: '~/.oci/config',
        compartmentId: 'ocid1.compartment.oc1..test',
      };

      const model = new OCILanguageModel('cohere.command-r-plus', config);
      const options = {
        prompt: [{ role: 'user' as const, content: [{ type: 'text' as const, text: 'test' }] }],
      };

      // Make first API call
      await model.doGenerate(options);

      // Make second API call
      await model.doGenerate(options);

      // Verify client was created only once (reused)
      expect(mockCreateAuthProvider).toHaveBeenCalledTimes(1);
      expect(mockGenerativeAiInferenceClientConstructor).toHaveBeenCalledTimes(1);

      // But chat should have been called twice
      expect(mockChat).toHaveBeenCalledTimes(2);
    });

    it('should throw helpful error if auth provider creation fails', async () => {
      const config = {
        auth: 'config_file' as const,
        configPath: '/nonexistent/config',
        compartmentId: 'ocid1.compartment.oc1..test',
      };

      // Mock auth provider to throw error for this test
      mockCreateAuthProvider.mockRejectedValue(new Error('Config file not found'));

      const model = new OCILanguageModel('meta.llama-3.1-70b-instruct', config);
      const options = {
        prompt: [{ role: 'user' as const, content: [{ type: 'text' as const, text: 'test' }] }],
      };

      // Should throw helpful error message
      await expect(model.doGenerate(options)).rejects.toThrow(
        'Failed to initialize OCI client: Config file not found'
      );

      // Verify second call also throws (client initialization failed)
      await expect(model.doGenerate(options)).rejects.toThrow('Check your OCI configuration');
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

  describe('Compartment ID validation', () => {
    it('should throw error when compartmentId is missing', async () => {
      const configWithoutCompartment = {
        region: 'eu-frankfurt-1',
      };

      // Mock getCompartmentId to throw error for missing compartmentId
      mockGetCompartmentId.mockImplementation(() => {
        throw new Error(
          'Compartment ID not found. Provide via config.compartmentId or OCI_COMPARTMENT_ID environment variable.'
        );
      });

      const model = new OCILanguageModel('cohere.command-r-plus', configWithoutCompartment);
      const options = {
        prompt: [{ role: 'user' as const, content: [{ type: 'text' as const, text: 'test' }] }],
      };

      await expect(model.doGenerate(options)).rejects.toThrow(
        'Compartment ID not found. Provide via config.compartmentId or OCI_COMPARTMENT_ID environment variable.'
      );
    });

    it('should use compartmentId from config when provided', async () => {
      const configWithCompartment = {
        region: 'eu-frankfurt-1',
        compartmentId: 'ocid1.compartment.oc1..specific',
      };

      mockGetCompartmentId.mockReturnValue('ocid1.compartment.oc1..specific');

      const model = new OCILanguageModel('cohere.command-r-plus', configWithCompartment);
      const options = {
        prompt: [{ role: 'user' as const, content: [{ type: 'text' as const, text: 'test' }] }],
      };

      await model.doGenerate(options);

      // Verify getCompartmentId was called with the config
      expect(mockGetCompartmentId).toHaveBeenCalledWith(configWithCompartment);

      // Verify chat was called with the validated compartmentId
      expect(mockChat).toHaveBeenCalledWith(
        expect.objectContaining({
          chatDetails: expect.objectContaining({
            compartmentId: 'ocid1.compartment.oc1..specific',
          }),
        })
      );
    });
  });
});
