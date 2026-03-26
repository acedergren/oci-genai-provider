export interface EmbeddingModelMetadata {
  id: string;
  name: string;
  family: 'cohere';
  dimensions: 256 | 384 | 512 | 1024 | 1536;
  maxTextsPerBatch: number;
  maxTokensPerText?: number;
  maxTokensPerCall: number;
  supportsImageInput?: boolean;
  dedicatedOnly?: boolean;
  supportedDimensions?: ReadonlyArray<256 | 384 | 512 | 1024 | 1536>;
}

export const EMBEDDING_MODELS: EmbeddingModelMetadata[] = [
  {
    id: 'cohere.embed-v4.0',
    name: 'Cohere Embed 4',
    family: 'cohere',
    dimensions: 1536,
    maxTextsPerBatch: 96,
    maxTokensPerText: 512,
    maxTokensPerCall: 128000,
    supportsImageInput: true,
    supportedDimensions: [256, 512, 1024, 1536],
  },
  {
    id: 'cohere.embed-multilingual-v3.0',
    name: 'Cohere Embed Multilingual v3.0',
    family: 'cohere',
    dimensions: 1024,
    maxTextsPerBatch: 96,
    maxTokensPerText: 512,
    maxTokensPerCall: 128000,
  },
  {
    id: 'cohere.embed-english-v3.0',
    name: 'Cohere Embed English v3.0',
    family: 'cohere',
    dimensions: 1024,
    maxTextsPerBatch: 96,
    maxTokensPerText: 512,
    maxTokensPerCall: 128000,
  },
  {
    id: 'cohere.embed-english-light-v3.0',
    name: 'Cohere Embed English Light v3.0',
    family: 'cohere',
    dimensions: 384,
    maxTextsPerBatch: 96,
    maxTokensPerText: 512,
    maxTokensPerCall: 128000,
  },
  {
    id: 'cohere.embed-english-image-v3.0',
    name: 'Cohere Embed English Image 3',
    family: 'cohere',
    dimensions: 1024,
    maxTextsPerBatch: 1,
    maxTokensPerCall: 128000,
    supportsImageInput: true,
    dedicatedOnly: true,
  },
  {
    id: 'cohere.embed-multilingual-image-v3.0',
    name: 'Cohere Embed Multilingual Image 3',
    family: 'cohere',
    dimensions: 1024,
    maxTextsPerBatch: 1,
    maxTokensPerCall: 128000,
    supportsImageInput: true,
  },
  {
    id: 'cohere.embed-multilingual-light-image-v3.0',
    name: 'Cohere Embed Multilingual Light Image 3',
    family: 'cohere',
    dimensions: 384,
    maxTextsPerBatch: 1,
    maxTokensPerCall: 128000,
    supportsImageInput: true,
    dedicatedOnly: true,
  },
];

export function isValidEmbeddingModelId(modelId: string): boolean {
  return EMBEDDING_MODELS.some((m) => m.id === modelId);
}

export function getEmbeddingModelMetadata(modelId: string): EmbeddingModelMetadata | undefined {
  return EMBEDDING_MODELS.find((m) => m.id === modelId);
}

export function getAllEmbeddingModels(): EmbeddingModelMetadata[] {
  return EMBEDDING_MODELS;
}
