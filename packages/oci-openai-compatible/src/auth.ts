import type { OCIOpenAIConfig } from './types';

/**
 * Get compartment ID from config or environment
 * @throws {Error} If compartment ID is not available
 */
export function getCompartmentId(config: OCIOpenAIConfig): string {
  const compartmentId = config.compartmentId || process.env.OCI_COMPARTMENT_ID;

  if (!compartmentId) {
    throw new Error(
      'OCI compartment ID must be provided via config or OCI_COMPARTMENT_ID environment variable'
    );
  }

  return compartmentId;
}

/**
 * Create authentication headers for OCI OpenAI-compatible API
 */
export function createOCIAuthHeaders(
  config: OCIOpenAIConfig
): Record<string, string> {
  const headers: Record<string, string> = {};

  // Add Bearer token if API key provided
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  // Add compartment ID header
  const compartmentId = getCompartmentId(config);
  headers['x-oci-compartment-id'] = compartmentId;

  return headers;
}
