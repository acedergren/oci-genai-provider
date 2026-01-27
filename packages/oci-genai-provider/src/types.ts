import type { LanguageModelV3 } from '@ai-sdk/provider';

/**
 * Request options for configuring retry and timeout behavior.
 */
export interface RequestOptions {
  /**
   * Request timeout in milliseconds.
   * @default 30000 (30 seconds)
   */
  timeoutMs?: number;

  /**
   * Retry configuration for transient failures.
   */
  retry?: {
    /**
     * Enable automatic retry on transient failures.
     * @default true
     */
    enabled?: boolean;

    /**
     * Maximum number of retry attempts.
     * @default 3
     */
    maxRetries?: number;

    /**
     * Base delay in milliseconds for exponential backoff.
     * @default 100
     */
    baseDelayMs?: number;

    /**
     * Maximum delay in milliseconds between retries.
     * @default 10000
     */
    maxDelayMs?: number;
  };
}

/**
 * Authentication method for OCI
 */
export type OCIAuthMethod =
  | 'config_file' // API key from ~/.oci/config
  | 'instance_principal' // OCI Compute instance
  | 'resource_principal'; // OCI Functions

/**
 * Configuration options for OCI GenAI provider
 */
export interface OCIConfig {
  /**
   * OCI region (e.g., 'eu-frankfurt-1')
   * @default 'eu-frankfurt-1'
   */
  region?: string;

  /**
   * OCI config profile name
   * @default 'DEFAULT'
   */
  profile?: string;

  /**
   * Authentication method
   * @default 'config_file'
   */
  auth?: OCIAuthMethod;

  /**
   * Path to OCI config file
   * @default '~/.oci/config'
   */
  configPath?: string;

  /**
   * Compartment OCID for API calls
   * If not provided, will be read from config or environment
   */
  compartmentId?: string;

  /**
   * Custom endpoint URL (for testing/dedicated clusters)
   */
  endpoint?: string;

  /**
   * Default request options for retry and timeout behavior.
   * These can be overridden per-request.
   */
  requestOptions?: RequestOptions;
}

/**
 * OCI Provider interface returned by createOCI()
 */
export interface OCIProvider {
  /**
   * Provider identifier
   */
  readonly provider: 'oci-genai';

  /**
   * Create a language model instance
   * @param modelId - OCI model identifier (e.g., 'cohere.command-r-plus')
   * @returns Language model instance
   */
  model: (modelId: string) => LanguageModelV3;
}

/**
 * Model metadata for dynamic selection
 */
export interface ModelMetadata {
  id: string;
  name: string;
  family: 'grok' | 'llama' | 'cohere' | 'gemini' | 'openai';
  capabilities: {
    streaming: boolean;
    tools: boolean;
    vision: boolean;
  };
  contextWindow: number;
  speed: 'very-fast' | 'fast' | 'medium' | 'slow';
}
