/**
 * Shared types for the OpenCode OCI Setup CLI
 */

import type { OCIProfile } from '@acedergren/oci-genai-provider/config';

/**
 * CLI command-line options
 */
export interface CLIOptions {
  profile?: string;
  compartment?: string;
  yes?: boolean;
  quiet?: boolean;
}

/**
 * Setup mode - fresh install or modify existing
 */
export type SetupMode = 'fresh' | 'modify' | 'cancel';

/**
 * Result of checking existing setup
 */
export interface ExistingSetupResult {
  mode: SetupMode;
  existingConfig?: Record<string, unknown>;
}

/**
 * Logger interface that respects quiet mode
 */
export interface Logger {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
}

/**
 * Setup context passed through the flow
 */
export interface SetupContext {
  options: CLIOptions;
  log: Logger;
  profile?: OCIProfile;
  compartmentId?: string;
  selectedModels?: string[];
  enableCodingOptimization?: boolean;
  existingConfig?: Record<string, unknown>;
}

/**
 * Coding-optimized model settings
 */
export const CODING_SETTINGS = {
  temperature: 0.2, // More deterministic, consistent code
  maxTokens: 8192, // Support longer code outputs
  frequencyPenalty: 0.1, // Reduce repetitive patterns
} as const;
