import {
  ProviderV3,
  LanguageModelV3,
  EmbeddingModelV3,
  ImageModelV3,
  TranscriptionModelV3,
  SpeechModelV3,
  RerankingModelV3,
  NoSuchModelError,
} from '@ai-sdk/provider';
import { OCILanguageModel } from './language-models/oci-language-model';
import type {
  OCIConfig,
  OCILanguageModelSettings,
  OCIEmbeddingSettings,
  OCISpeechSettings,
  OCITranscriptionSettings,
  OCIRerankingSettings,
} from './types';

/**
 * OCI GenAI Provider implementing ProviderV3 interface.
 *
 * Supports:
 * - Language Models (16+ models including Cohere, Llama, Grok, Gemini)
 * - Embeddings (coming in Plan 2)
 * - Speech/TTS (coming in Plan 3)
 * - Transcription/STT (coming in Plan 4)
 * - Reranking (coming in Plan 5)
 */
export class OCIGenAIProvider implements ProviderV3 {
  readonly specificationVersion = 'v3' as const;

  constructor(private readonly config: OCIConfig = {}) {}

  /**
   * Create a language model instance for chat/completion.
   *
   * @param modelId - OCI model identifier (e.g., 'cohere.command-r-plus')
   * @param settings - Optional model-specific settings that override provider config
   * @returns Language model instance
   *
   * @example
   * ```typescript
   * const provider = new OCIGenAIProvider({ region: 'eu-frankfurt-1' });
   * const model = provider.languageModel('cohere.command-r-plus');
   * ```
   */
  languageModel(modelId: string, settings?: OCILanguageModelSettings): LanguageModelV3 {
    const mergedConfig: OCIConfig = { ...this.config, ...settings };
    return new OCILanguageModel(modelId, mergedConfig);
  }

  /**
   * Create an embedding model instance.
   *
   * @throws {NoSuchModelError} Not yet implemented - coming in Plan 2
   */
  embeddingModel(modelId: string, _settings?: OCIEmbeddingSettings): EmbeddingModelV3 {
    throw new NoSuchModelError({
      modelId,
      modelType: 'embeddingModel',
      message: 'Embedding models not yet implemented. Coming in Plan 2.',
    });
  }

  /**
   * Image generation is not supported by OCI GenAI.
   *
   * @throws {NoSuchModelError} Always throws - OCI does not provide image generation
   */
  imageModel(modelId: string): ImageModelV3 {
    throw new NoSuchModelError({
      modelId,
      modelType: 'imageModel',
      message: 'OCI does not provide image generation models.',
    });
  }

  /**
   * Create a transcription model instance (STT).
   *
   * @throws {NoSuchModelError} Not yet implemented - coming in Plan 4
   */
  transcriptionModel(modelId: string, _settings?: OCITranscriptionSettings): TranscriptionModelV3 {
    throw new NoSuchModelError({
      modelId,
      modelType: 'transcriptionModel',
      message: 'Transcription models not yet implemented. Coming in Plan 4.',
    });
  }

  /**
   * Create a speech model instance (TTS).
   *
   * @throws {NoSuchModelError} Not yet implemented - coming in Plan 3
   */
  speechModel(modelId: string, _settings?: OCISpeechSettings): SpeechModelV3 {
    throw new NoSuchModelError({
      modelId,
      modelType: 'speechModel',
      message: 'Speech models not yet implemented. Coming in Plan 3.',
    });
  }

  /**
   * Create a reranking model instance.
   *
   * @throws {NoSuchModelError} Not yet implemented - coming in Plan 5
   */
  rerankingModel(modelId: string, _settings?: OCIRerankingSettings): RerankingModelV3 {
    throw new NoSuchModelError({
      modelId,
      modelType: 'rerankingModel',
      message: 'Reranking models not yet implemented. Coming in Plan 5.',
    });
  }
}
