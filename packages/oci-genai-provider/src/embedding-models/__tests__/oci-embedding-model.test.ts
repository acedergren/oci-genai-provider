import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { OCIEmbeddingModel } from '../OCIEmbeddingModel';
import type { EmbeddingModelV3CallOptions } from '@ai-sdk/provider';

// Mock OCI SDK
jest.mock('oci-generativeaiinference');
jest.mock('../../auth');

describe('OCIEmbeddingModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have correct specification version and provider', () => {
    const model = new OCIEmbeddingModel('cohere.embed-multilingual-v3.0', {
      compartmentId: 'ocid1.compartment.test',
    });

    expect(model.specificationVersion).toBe('v3');
    expect(model.provider).toBe('oci-genai');
    expect(model.modelId).toBe('cohere.embed-multilingual-v3.0');
  });

  it('should set maxEmbeddingsPerCall to 96', () => {
    const model = new OCIEmbeddingModel('cohere.embed-multilingual-v3.0', {});

    expect(model.maxEmbeddingsPerCall).toBe(96);
  });

  it('should throw error for invalid model ID', () => {
    expect(() => {
      new OCIEmbeddingModel('invalid-model', {});
    }).toThrow('Invalid embedding model ID');
  });

  it('should validate embeddings count does not exceed max', async () => {
    const model = new OCIEmbeddingModel('cohere.embed-multilingual-v3.0', {
      compartmentId: 'test',
    });

    const texts = Array(97).fill('test'); // 97 > 96 max

    const options: EmbeddingModelV3CallOptions = {
      values: texts,
    };

    await expect(model.doEmbed(options)).rejects.toThrow(
      'Batch size (97) exceeds maximum allowed (96)'
    );
  });
});
