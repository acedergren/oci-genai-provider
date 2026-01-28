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

// ============================================================================
// ProviderV3 Model-Specific Settings
// ============================================================================

/**
 * Base configuration shared across all OCI model types.
 * Alias for OCIConfig for ProviderV3 compatibility.
 */
export type OCIBaseConfig = OCIConfig;

/**
 * Settings specific to language models (chat, completion)
 */
export interface OCILanguageModelSettings extends OCIConfig {
  // Language models use the base config with requestOptions
  // No additional settings needed currently
}

/**
 * Settings for embedding models
 */
export interface OCIEmbeddingSettings extends OCIConfig {
  /** Embedding dimensions (384 for light, 1024 for standard) */
  dimensions?: 384 | 1024;
  /** How to truncate input text if it exceeds model limits */
  truncate?: 'START' | 'END' | 'NONE';
  /** Input type optimization */
  inputType?: 'QUERY' | 'DOCUMENT';
}

/**
 * Settings for speech models (TTS)
 */
export interface OCISpeechSettings extends OCIConfig {
  /** Voice ID */
  voice?: string;
  /** Speech speed multiplier (0.5 to 2.0) */
  speed?: number;
  /** Audio output format */
  format?: 'mp3' | 'wav' | 'pcm';
}

/**
 * Settings for transcription models (STT)
 */
export interface OCITranscriptionSettings extends OCIConfig {
  /** Language code (e.g., 'en', 'es', 'de') */
  language?: string;
  /** Transcription model to use */
  model?: 'standard' | 'whisper';
  /** Custom vocabulary words */
  vocabulary?: string[];
}

/**
 * Settings for reranking models
 */
export interface OCIRerankingSettings extends OCIConfig {
  /** Return only top N results */
  topN?: number;
  /** Include document text in response */
  returnDocuments?: boolean;
}
