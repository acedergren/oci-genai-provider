/**
 * OpenCode Integration for OCI Generative AI Provider
 *
 * This package provides an OpenCode-compatible factory function
 * that creates an OCI GenAI provider instance. OpenCode calls this
 * factory with configuration from opencode.json.
 *
 * Usage in opencode.json:
 * ```json
 * {
 *   "provider": {
 *     "oci-genai": {
 *       "npm": "@acedergren/opencode-oci-genai",
 *       "options": {
 *         "compartmentId": "{env:OCI_COMPARTMENT_ID}",
 *         "configProfile": "FRANKFURT"
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * @packageDocumentation
 */

import { createOCI, type OCIConfig } from '@acedergren/oci-genai-provider';
import type { ProviderV3 } from '@ai-sdk/provider';

/**
 * OpenCode configuration options
 *
 * These are passed from opencode.json "options" field.
 * OpenCode substitutes {env:VAR_NAME} with environment variables.
 */
export interface OpenCodeOCIOptions {
  /**
   * Compartment OCID for OCI GenAI API calls
   *
   * Required. Can use {env:OCI_COMPARTMENT_ID} in opencode.json.
   *
   * @example "ocid1.compartment.oc1..aaaaaaa..."
   */
  compartmentId: string;

  /**
   * Profile name from ~/.oci/config
   *
   * Default: 'DEFAULT' or OCI_CONFIG_PROFILE env var.
   * The profile determines region, credentials, and tenancy.
   *
   * @example "FRANKFURT"
   */
  configProfile?: string;

  /**
   * Override region from profile
   *
   * Usually not needed - region comes from ~/.oci/config profile.
   * Use only when you need a different region than the profile default.
   *
   * @example "eu-frankfurt-1"
   */
  region?: string;
}

/**
 * Default export: Factory function for OpenCode
 *
 * OpenCode calls this function with options from opencode.json
 * to create a ProviderV3 instance. This is the main entry point
 * for the integration.
 *
 * @param options - Configuration from opencode.json
 * @returns ProviderV3 instance for use with OpenCode
 *
 * @example
 * ```typescript
 * // OpenCode calls this internally with options from opencode.json
 * const provider = createOpenCodeOCIProvider({
 *   compartmentId: "ocid1.compartment.oc1...",
 *   configProfile: "FRANKFURT",
 * });
 * ```
 */
export default function createOpenCodeOCIProvider(
  options: OpenCodeOCIOptions
): ProviderV3 {
  // Build config, preferring explicit options over environment variables
  const config: OCIConfig = {
    // Compartment ID is required for OCI GenAI API calls
    compartmentId: options.compartmentId || process.env.OCI_COMPARTMENT_ID,

    // Profile name - region and credentials come from ~/.oci/config
    profile: options.configProfile || process.env.OCI_CONFIG_PROFILE || 'DEFAULT',

    // Region override (usually not needed, comes from profile)
    region: options.region || process.env.OCI_REGION,

    // Always use config_file auth for OpenCode (OAuth planned for future)
    auth: 'config_file',
  };

  // Validate required configuration
  if (!config.compartmentId) {
    throw new Error(
      `OCI compartmentId is required.

Set it in opencode.json:
  "options": { "compartmentId": "ocid1.compartment.oc1..." }

Or via environment variable:
  export OCI_COMPARTMENT_ID=ocid1.compartment.oc1...`
    );
  }

  return createOCI(config);
}

// ============================================================================
// Re-export Core Provider
// ============================================================================

export {
  createOCI,
  oci,
  OCIGenAIProvider,
  getAllModels,
  getModelMetadata,
  getModelsByFamily,
  isValidModelId,
  type OCIConfig,
  type ModelMetadata,
} from '@acedergren/oci-genai-provider';

// ============================================================================
// Re-export Config Utilities
// ============================================================================

export {
  parseOCIConfig,
  hasOCIConfig,
  getProfile,
  validateCredentials,
  discoverCompartments,
  OCI_REGIONS,
  getSetupInstructions,
  isValidOCID,
  type OCIProfile,
  type OCIConfigResult,
  type OCICompartment,
  type ValidationResult,
} from '@acedergren/oci-genai-provider/config';
