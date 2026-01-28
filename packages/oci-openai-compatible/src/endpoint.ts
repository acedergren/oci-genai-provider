import type { OCIOpenAIConfig, OCIRegion } from './types';
import { REGION_ENDPOINTS, OCI_OPENAI_API_VERSION } from './types';

const DEFAULT_REGION: OCIRegion = 'us-ashburn-1';

/**
 * Validate that endpoint URL is secure and well-formed
 * @throws Error if endpoint is invalid or insecure
 */
function validateEndpoint(endpoint: string): void {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error(`Invalid endpoint URL: ${endpoint}`);
  }

  // Allow http only for localhost (development)
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol !== 'https:' && !isLocalhost) {
    throw new Error(`Endpoint must use HTTPS: ${endpoint}`);
  }
}

/**
 * Get the base URL for OCI OpenAI-compatible API
 * Constructs endpoint from region or uses custom endpoint if provided
 */
export function getBaseURL(config: OCIOpenAIConfig): string {
  // Use custom endpoint if provided
  if (config.endpoint) {
    validateEndpoint(config.endpoint);
    return `${config.endpoint}/${OCI_OPENAI_API_VERSION}/actions/v1`;
  }

  // Use region to construct endpoint
  const region = config.region || DEFAULT_REGION;
  const baseEndpoint = REGION_ENDPOINTS[region];

  return `${baseEndpoint}/${OCI_OPENAI_API_VERSION}/actions/v1`;
}
