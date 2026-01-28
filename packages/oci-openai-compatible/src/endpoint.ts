import type { OCIOpenAIConfig, OCIRegion } from './types';
import { REGION_ENDPOINTS, OCI_OPENAI_API_VERSION } from './types';

/**
 * Default region for OCI OpenAI-compatible API
 */
const DEFAULT_REGION: OCIRegion = 'us-ashburn-1';

/**
 * Get the base URL for OCI OpenAI-compatible API
 * Constructs endpoint from region or uses custom endpoint if provided
 */
export function getBaseURL(config: OCIOpenAIConfig): string {
  // Use custom endpoint if provided
  if (config.endpoint) {
    return `${config.endpoint}/${OCI_OPENAI_API_VERSION}/actions/v1`;
  }

  // Use region to construct endpoint
  const region = config.region || DEFAULT_REGION;
  const baseEndpoint = REGION_ENDPOINTS[region];

  return `${baseEndpoint}/${OCI_OPENAI_API_VERSION}/actions/v1`;
}
