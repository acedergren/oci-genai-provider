/**
 * OCI Generative AI Provider for Vercel AI SDK
 *
 * Complete ProviderV3 implementation supporting:
 * - Language Models (16+ models including Cohere, Llama, Grok, Gemini)
 * - Embeddings (coming in v0.2.0)
 * - Speech/Transcription (coming in v0.3.0)
 * - Reranking (coming in v0.4.0)
 *
 * @example
 * ```typescript
 * import { oci, createOCI } from '@acedergren/oci-genai-provider';
 *
 * // Use default provider instance
 * const model = oci.languageModel('cohere.command-r-plus');
 *
 * // Or create custom provider
 * const provider = createOCI({ region: 'eu-frankfurt-1' });
 * const customModel = provider.languageModel('meta.llama-3.3-70b-instruct');
 * ```
 */

import type { LanguageModelV3 } from '@ai-sdk/provider';
import { OCIGenAIProvider } from './provider';
import type { OCIConfig } from './types';

// ============================================================================
// Provider Exports
// ============================================================================

export { OCIGenAIProvider } from './provider';

/**
 * Create a new OCI provider instance with custom configuration.
 *
 * @param config - Optional provider configuration
 * @returns OCI provider instance implementing ProviderV3
 *
 * @example
 * ```typescript
 * const provider = createOCI({
 *   region: 'eu-frankfurt-1',
 *   compartmentId: 'ocid1.compartment...',
 * });
 *
 * const model = provider.languageModel('cohere.command-r-plus');
 * ```
 */
export function createOCI(config: OCIConfig = {}): OCIGenAIProvider {
  return new OCIGenAIProvider(config);
}

/**
 * Default OCI provider instance.
 * Uses environment variables or OCI config file for configuration.
 *
 * @example
 * ```typescript
 * import { oci } from '@acedergren/oci-genai-provider';
 *
 * const model = oci.languageModel('cohere.command-r-plus');
 * const embedding = oci.embeddingModel('cohere.embed-multilingual-v3.0'); // Coming soon
 * ```
 */
export const oci = createOCI();

// ============================================================================
// Backward Compatibility - Legacy Interface
// ============================================================================

/**
 * Legacy provider interface for backward compatibility.
 * @deprecated Use OCIGenAIProvider class instead
 */
export interface OCIProvider {
  readonly provider: 'oci-genai';
  model: (modelId: string) => LanguageModelV3;
}

/**
 * Create legacy-style provider for backward compatibility.
 * @deprecated Use createOCI() which returns OCIGenAIProvider
 */
export function createOCILegacy(config: OCIConfig = {}): OCIProvider {
  const provider = new OCIGenAIProvider(config);
  return {
    provider: 'oci-genai',
    model: (modelId: string) => provider.languageModel(modelId),
  };
}

// ============================================================================
// Type Exports
// ============================================================================

export type {
  OCIConfig,
  OCIAuthMethod,
  OCIBaseConfig,
  OCILanguageModelSettings,
  OCIEmbeddingSettings,
  OCISpeechSettings,
  OCITranscriptionSettings,
  OCIRerankingSettings,
  ModelMetadata,
  RequestOptions,
} from './types';

// ============================================================================
// Language Model Exports
// ============================================================================

export { OCILanguageModel } from './language-models/oci-language-model';
export {
  isValidModelId,
  getModelMetadata,
  getAllModels,
  getModelsByFamily,
} from './language-models/registry';

// ============================================================================
// Embedding Model Exports
// ============================================================================

export { OCIEmbeddingModel } from './embedding-models/OCIEmbeddingModel';
export {
  getEmbeddingModelMetadata,
  isValidEmbeddingModelId,
  getAllEmbeddingModels,
} from './embedding-models/registry';
export type { EmbeddingModelMetadata } from './embedding-models/registry';

// ============================================================================
// Error Exports
// ============================================================================

export {
  OCIGenAIError,
  NetworkError,
  RateLimitError,
  AuthenticationError,
  ModelNotFoundError,
  isRetryableError,
  handleOCIError,
} from './shared/errors';

export type {
  OCIGenAIErrorOptions,
  NetworkErrorOptions,
  RateLimitErrorOptions,
  AuthenticationErrorOptions,
} from './shared/errors';

// ============================================================================
// Utility Exports
// ============================================================================

export {
  withRetry,
  withTimeout,
  TimeoutError,
  isRetryableError as isRetryableNetworkError,
} from './shared/utils';

export type { RetryOptions } from './shared/utils';
