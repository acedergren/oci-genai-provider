/**
 * Regression tests for OCI GenAI Provider core functionality
 * These tests verify critical behaviors that must not break between releases
 *
 * Test naming: REG-XXX for traceability
 *
 * AI SDK Reference (/ai-sdk):
 * - LanguageModelV3 must have specificationVersion: 'v3'
 * - Provider must implement doGenerate and doStream
 *
 * OCI Reference (/OCI Generative AI Services):
 * - Model families: cohere.*, google.*, xai.*, meta.*
 * - API formats: COHERE (for cohere.*), GENERIC (for others)
 */
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NoSuchModelError } from '@ai-sdk/provider';
import { createOCI, OCIGenAIProvider } from '../index';
import {
  isValidModelId,
  getModelMetadata,
  getAllModels,
  getModelsByFamily,
} from '../language-models/registry';

// Mock OCI SDK - structure matches oci-generativeaiinference
jest.mock('oci-generativeaiinference', () => {
  return {
    GenerativeAiInferenceClient: jest.fn().mockImplementation(() => ({
      region: null,
      endpoint: undefined,
      chat: jest.fn().mockImplementation(() =>
        Promise.resolve({
          chatResult: {
            modelId: 'test-model',
            chatResponse: {
              choices: [
                {
                  message: { content: [{ type: 'TEXT', text: 'Hello!' }] },
                  finishReason: 'COMPLETE',
                },
              ],
              usage: { promptTokens: 10, completionTokens: 5 },
            },
          },
        })
      ),
    })),
    models: {
      CohereChatRequest: { apiFormat: 'COHERE' },
      GenericChatRequest: { apiFormat: 'GENERIC' },
      TextContent: { type: 'TEXT' },
    },
  };
});

// Mock OCI Common - authentication providers
jest.mock('oci-common', () => {
  return {
    ConfigFileAuthenticationDetailsProvider: jest.fn().mockImplementation(() => ({})),
    Region: {
      fromRegionId: (id: string): { regionId: string } => ({ regionId: id }),
    },
    InstancePrincipalsAuthenticationDetailsProviderBuilder: jest.fn().mockImplementation(() => ({
      build: jest.fn().mockImplementation(() => Promise.resolve({})),
    })),
    ResourcePrincipalAuthenticationDetailsProvider: {
      builder: jest.fn().mockImplementation(() => ({})),
    },
  };
});

describe('Regression: Provider Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.OCI_COMPARTMENT_ID;
    delete process.env.OCI_REGION;
    delete process.env.OCI_GENAI_ENDPOINT_ID;
    delete process.env.OCI_CONFIG_PROFILE;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('REG-001: Provider must accept compartmentId from environment', () => {
    process.env.OCI_COMPARTMENT_ID = 'ocid1.compartment.oc1..test';
    expect(createOCI()).toBeInstanceOf(OCIGenAIProvider);
  });

  it('REG-002: Provider must accept region configuration', () => {
    const provider = createOCI({ region: 'eu-frankfurt-1' });
    expect(provider).toBeInstanceOf(OCIGenAIProvider);
    expect(provider.specificationVersion).toBe('v3');
  });

  it('REG-003: Provider must accept explicit config options', () => {
    const provider = createOCI({
      region: 'eu-frankfurt-1',
      compartmentId: 'ocid1.compartment.oc1..explicit',
      profile: 'CUSTOM',
    });
    expect(provider).toBeInstanceOf(OCIGenAIProvider);
  });

  it('REG-004: Provider must create valid language model', () => {
    const model = createOCI({ region: 'us-chicago-1' }).languageModel('cohere.command-r-plus');
    expect(model.specificationVersion).toBe('v3');
    expect(model.modelId).toBe('cohere.command-r-plus');
  });

  it.each([
    ['REG-005', 'cohere.command-r-plus', 'cohere.', 'Cohere'],
    ['REG-006', 'google.gemini-2.5-pro', 'google.', 'Google'],
    ['REG-007', 'xai.grok-4', 'xai.', 'xAI/Grok'],
    ['REG-008', 'meta.llama-3.3-70b-instruct', 'meta.', 'Meta/Llama'],
  ])('%s: Provider must support %s model family', (_id, modelId, prefix, _familyName) => {
    const model = createOCI({ region: 'us-chicago-1' }).languageModel(modelId);
    expect(model.modelId.startsWith(prefix)).toBe(true);
    expect(model.provider).toBe('oci-genai');
  });
});

describe('Regression: Model Creation (AI SDK V3)', () => {
  beforeEach(() => {
    process.env.OCI_COMPARTMENT_ID = 'ocid1.compartment.oc1..test';
  });

  it('REG-009: languageModel() must return LanguageModelV3 interface', () => {
    const model = createOCI({ region: 'us-chicago-1' }).languageModel('cohere.command-r-plus');
    expect(model.specificationVersion).toBe('v3');
    expect(typeof model.doGenerate).toBe('function');
    expect(typeof model.doStream).toBe('function');
  });

  it('REG-010: Provider name must be oci-genai', () => {
    const model = createOCI({ region: 'us-chicago-1' }).languageModel('cohere.command-r-plus');
    expect(model.provider).toBe('oci-genai');
  });

  it('REG-011: chat() must be alias for languageModel()', () => {
    const provider = createOCI({ region: 'us-chicago-1' });
    const modelViaLanguageModel = provider.languageModel('cohere.command-r-plus');
    const modelViaChat = provider.chat('cohere.command-r-plus');
    expect(modelViaLanguageModel.modelId).toBe(modelViaChat.modelId);
    expect(modelViaLanguageModel.provider).toBe(modelViaChat.provider);
  });
});

describe('Regression: Error Handling', () => {
  let provider: OCIGenAIProvider;

  beforeEach(() => {
    process.env.OCI_COMPARTMENT_ID = 'ocid1.compartment.oc1..test';
    provider = createOCI({ region: 'us-chicago-1' });
  });

  it('REG-012: Invalid model ID should throw NoSuchModelError', () => {
    expect(() => provider.languageModel('invalid.model-id')).toThrow(NoSuchModelError);
  });

  it('REG-013: Empty model ID should throw', () => {
    expect(() => provider.languageModel('')).toThrow();
  });

  it('REG-014: imageModel() should throw (not supported)', () => {
    expect(() => provider.imageModel('any.image')).toThrow(NoSuchModelError);
  });
});

describe('Regression: Model Registry', () => {
  const KNOWN_MODELS = [
    'cohere.command-r-plus',
    'meta.llama-3.3-70b-instruct',
    'xai.grok-4',
    'google.gemini-2.5-pro',
  ];
  const UNKNOWN_MODELS = ['unknown.model', 'future.new-model', ''];
  const REQUIRED_PREFIXES = ['cohere.', 'google.', 'xai.', 'meta.'];

  it.each(KNOWN_MODELS)('REG-015: isValidModelId(%s) must return true', (modelId) => {
    expect(isValidModelId(modelId)).toBe(true);
  });

  it.each(UNKNOWN_MODELS)('REG-016: isValidModelId(%s) must return false', (modelId) => {
    expect(isValidModelId(modelId)).toBe(false);
  });

  it('REG-017: getModelMetadata must return info for known models', () => {
    const metadata = getModelMetadata('xai.grok-code-fast-1');
    expect(metadata).toBeDefined();
    expect(metadata?.id).toBe('xai.grok-code-fast-1');
    expect(metadata?.name).toBe('Grok Code Fast 1');
    expect(metadata?.family).toBe('grok');
  });

  it('REG-018: getModelMetadata must return undefined for unknown models', () => {
    expect(getModelMetadata('unknown.model')).toBeUndefined();
  });

  it('REG-019: getAllModels must return non-empty array', () => {
    const models = getAllModels();
    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThan(0);
  });

  it('REG-020: Known models must include all provider families', () => {
    const models = getAllModels();
    for (const prefix of REQUIRED_PREFIXES) {
      expect(models.some((m) => m.id.startsWith(prefix))).toBe(true);
    }
  });

  it.each<['cohere' | 'grok', string]>([
    ['cohere', 'cohere'],
    ['grok', 'grok'],
  ])('REG-021: getModelsByFamily(%s) must filter correctly', (family, expectedFamily) => {
    const models = getModelsByFamily(family);
    expect(models.length).toBeGreaterThan(0);
    expect(models.every((m) => m.family === expectedFamily)).toBe(true);
  });
});

describe('Regression: Provider Specification', () => {
  beforeEach(() => {
    process.env.OCI_COMPARTMENT_ID = 'ocid1.compartment.oc1..test';
  });

  it('REG-022: Default oci export must be valid provider', () => {
    const provider = createOCI();
    expect(provider.specificationVersion).toBe('v3');
    expect(typeof provider.languageModel).toBe('function');
    expect(typeof provider.chat).toBe('function');
    expect(typeof provider.embeddingModel).toBe('function');
  });

  it('REG-023: Provider must expose models catalog', () => {
    const provider = createOCI({ region: 'us-chicago-1' });
    expect(provider.models).toBeDefined();
    expect(typeof provider.models).toBe('object');
    expect(Object.keys(provider.models).length).toBeGreaterThan(0);
  });
});

describe('Regression: Serving Mode Configuration', () => {
  beforeEach(() => {
    process.env.OCI_COMPARTMENT_ID = 'ocid1.compartment.oc1..test';
    delete process.env.OCI_GENAI_ENDPOINT_ID;
  });

  it('REG-024: Provider must accept on-demand serving mode', () => {
    const provider = createOCI({
      region: 'us-chicago-1',
      servingMode: { type: 'ON_DEMAND', modelId: 'cohere.command-r-plus' },
    });
    expect(provider).toBeInstanceOf(OCIGenAIProvider);
    expect(provider.specificationVersion).toBe('v3');
  });

  it('REG-025: Provider must accept dedicated serving mode with endpointId', () => {
    const provider = createOCI({
      region: 'us-chicago-1',
      servingMode: { type: 'DEDICATED', endpointId: 'ocid1.generativeaiendpoint.oc1..test' },
    });
    expect(provider).toBeInstanceOf(OCIGenAIProvider);
    expect(provider.specificationVersion).toBe('v3');
  });

  it('REG-026: Provider must accept endpointId from environment', () => {
    process.env.OCI_GENAI_ENDPOINT_ID = 'ocid1.generativeaiendpoint.oc1..env';
    expect(createOCI({ region: 'us-chicago-1' })).toBeInstanceOf(OCIGenAIProvider);
  });
});
