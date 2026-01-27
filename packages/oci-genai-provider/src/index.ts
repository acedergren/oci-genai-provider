import type { LanguageModelV3 } from '@ai-sdk/provider';
import type { OCIConfig, OCIProvider } from './types';
import { OCILanguageModel } from './models/oci-language-model';

/**
 * Create OCI GenAI provider instance
 */
export function createOCI(config: OCIConfig = {}): OCIProvider {
  return {
    provider: 'oci-genai',
    model: (modelId: string): LanguageModelV3 => {
      return new OCILanguageModel(modelId, config);
    },
  };
}

/**
 * Convenience function to create a language model directly
 */
export function oci(modelId: string, config?: OCIConfig): LanguageModelV3 {
  const provider = createOCI(config);
  return provider.model(modelId);
}

// Re-export types
export type { OCIConfig, OCIProvider, ModelMetadata, RequestOptions } from './types';

// Re-export utilities
export {
  getModelMetadata,
  getAllModels,
  getModelsByFamily,
  isValidModelId,
} from './models/registry';

// Re-export error types
export {
  OCIGenAIError,
  NetworkError,
  RateLimitError,
  AuthenticationError,
  ModelNotFoundError,
  isRetryableError,
  handleOCIError,
} from './errors';
export type {
  OCIGenAIErrorOptions,
  NetworkErrorOptions,
  RateLimitErrorOptions,
  AuthenticationErrorOptions,
} from './errors';

// Re-export utility functions
export {
  withRetry,
  withTimeout,
  TimeoutError,
  isRetryableError as isRetryableNetworkError,
} from './utils';
export type { RetryOptions } from './utils';
