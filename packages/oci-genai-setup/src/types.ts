/**
 * Shared types for the OCI GenAI Setup CLI
 */

import type { OCIProfile } from '@acedergren/oci-genai-provider/config';

/**
 * Output format for generated configuration
 */
export type OutputFormat = 'opencode' | 'claude-code' | 'env' | 'json';

/**
 * CLI command-line options
 */
export interface CLIOptions {
  profile?: string;
  compartment?: string;
  output?: OutputFormat;
  outputPath?: string;
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
  outputFormat: OutputFormat;
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
  outputFormat: OutputFormat;
}

/**
 * Generated configuration result
 */
export interface GeneratedConfig {
  /** OCI profile name used */
  profile: string;
  /** Compartment OCID */
  compartmentId: string;
  /** Region from profile */
  region: string;
  /** Selected model IDs */
  models: string[];
  /** Whether coding optimization is enabled */
  codingOptimized: boolean;
}

/**
 * Coding-optimized model settings
 */
export const CODING_SETTINGS = {
  temperature: 0.2, // More deterministic, consistent code
  maxTokens: 8192, // Support longer code outputs
  frequencyPenalty: 0.1, // Reduce repetitive patterns
} as const;

/**
 * Output format descriptions for selection UI
 */
export const OUTPUT_FORMAT_INFO: Record<OutputFormat, { name: string; description: string }> = {
  opencode: {
    name: 'OpenCode',
    description: 'Generate ~/.config/opencode/opencode.json',
  },
  'claude-code': {
    name: 'Claude Code MCP',
    description: 'Generate MCP server config for Claude Code',
  },
  env: {
    name: 'Environment Variables',
    description: 'Generate .env file or shell exports',
  },
  json: {
    name: 'JSON',
    description: 'Output raw config as JSON (for scripting)',
  },
};
