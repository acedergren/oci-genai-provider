/**
 * OpenCode Integration for OCI Generative AI Provider
 *
 * This package provides OpenCode-specific wrappers and utilities
 * for the core OCI GenAI provider.
 *
 * Note: Core provider exports will be re-exported once it's built.
 * Run `pnpm build` in the root to build all packages.
 */

// Placeholder exports - will be replaced with core provider re-exports after build
export interface OpenCodeOCIConfig {
  /** Display name for this provider in OpenCode UI */
  displayName?: string;
  /** Description shown in OpenCode provider list */
  description?: string;
  /** Enable/disable this provider */
  enabled?: boolean;
  /** Priority for this provider (higher = higher priority) */
  priority?: number;
}

// OpenCode-specific exports will be added here as the integration is developed
