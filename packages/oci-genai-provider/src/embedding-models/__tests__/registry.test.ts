import { describe, it, expect } from '@jest/globals';
import {
  getEmbeddingModelMetadata,
  isValidEmbeddingModelId,
  getAllEmbeddingModels,
} from '../registry';

describe('Embedding Model Registry', () => {
  it('should validate Cohere embedding model IDs', () => {
    expect(isValidEmbeddingModelId('cohere.embed-v4.0')).toBe(true);
    expect(isValidEmbeddingModelId('cohere.embed-multilingual-v3.0')).toBe(true);
    expect(isValidEmbeddingModelId('cohere.embed-multilingual-image-v3.0')).toBe(true);
    expect(isValidEmbeddingModelId('cohere.embed-english-light-v3.0')).toBe(true);
    expect(isValidEmbeddingModelId('invalid-model')).toBe(false);
  });

  it('should return metadata for valid embedding models', () => {
    const metadata = getEmbeddingModelMetadata('cohere.embed-v4.0');

    expect(metadata).toBeDefined();
    expect(metadata?.id).toBe('cohere.embed-v4.0');
    expect(metadata?.dimensions).toBe(1536);
    expect(metadata?.family).toBe('cohere');
    expect(metadata?.supportsImageInput).toBe(true);
    expect(metadata?.supportedDimensions).toEqual([256, 512, 1024, 1536]);
  });

  it('should return undefined for invalid model IDs', () => {
    const metadata = getEmbeddingModelMetadata('invalid-model');
    expect(metadata).toBeUndefined();
  });

  it('should list all embedding models', () => {
    const models = getAllEmbeddingModels();

    expect(models.length).toBeGreaterThan(0);
    expect(models.every((m) => m.family === 'cohere')).toBe(true);
  });
});
