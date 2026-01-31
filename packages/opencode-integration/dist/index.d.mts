import { ProviderV3 } from '@ai-sdk/provider';
export { ModelMetadata, OCIConfig, OCIGenAIProvider, createOCI, getAllModels, getModelMetadata, getModelsByFamily, isValidModelId, oci } from '@acedergren/oci-genai-provider';
export { OCICompartment, OCIConfigResult, OCIProfile, OCI_REGIONS, ValidationResult, discoverCompartments, getProfile, getSetupInstructions, hasOCIConfig, isValidOCID, parseOCIConfig, validateCredentials } from '@acedergren/oci-genai-provider/config';

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

/**
 * OpenCode configuration options
 *
 * These are passed from opencode.json "options" field.
 * OpenCode substitutes {env:VAR_NAME} with environment variables.
 */
interface OpenCodeOCIOptions {
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
declare function createOpenCodeOCIProvider(options: OpenCodeOCIOptions): ProviderV3;

export { type OpenCodeOCIOptions, createOpenCodeOCIProvider as default };
