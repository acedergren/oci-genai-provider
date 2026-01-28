/**
 * OCI OpenAI-Compatible Wrapper
 *
 * Provides OpenAI SDK compatibility layer for Oracle Cloud Infrastructure (OCI)
 * Generative AI Service, enabling teams familiar with OpenAI's API to seamlessly
 * migrate to OCI with minimal code changes.
 *
 * @example
 * ```typescript
 * import { createOCIOpenAI } from '@acedergren/oci-openai-compatible';
 *
 * const client = createOCIOpenAI({
 *   region: 'us-ashburn-1',
 *   apiKey: process.env.OCI_API_KEY,
 *   compartmentId: process.env.OCI_COMPARTMENT_ID,
 * });
 *
 * const response = await client.chat.completions.create({
 *   model: 'meta.llama-3.3-70b-instruct',
 *   messages: [{ role: 'user', content: 'Hello, world!' }],
 * });
 * ```
 *
 * @module @acedergren/oci-openai-compatible
 */

// Client factory
export { createOCIOpenAI } from './client';

// Type exports
export type {
  OCIOpenAIConfig,
  OCIRegion,
  OCIAuthMethod,
  OCIModelId,
} from './types';

// Constants
export { REGION_ENDPOINTS, OCI_OPENAI_API_VERSION } from './types';

// Utility exports
export { getBaseURL } from './endpoint';
export { createOCIAuthHeaders, getCompartmentId } from './auth';

// Re-export factory as named export for default instance
import { createOCIOpenAI } from './client';

/**
 * Default OCI OpenAI-compatible client instance
 * Uses environment variables for configuration:
 * - OCI_REGION (optional, defaults to us-ashburn-1)
 * - OCI_API_KEY (optional, for API key auth)
 * - OCI_COMPARTMENT_ID (required)
 *
 * @example
 * ```typescript
 * import { ociOpenAI } from '@acedergren/oci-openai-compatible';
 *
 * const response = await ociOpenAI.chat.completions.create({
 *   model: 'meta.llama-3.3-70b-instruct',
 *   messages: [{ role: 'user', content: 'Hello!' }],
 * });
 * ```
 */
export const ociOpenAI = createOCIOpenAI({
  region: (process.env.OCI_REGION as any) || 'us-ashburn-1',
  apiKey: process.env.OCI_API_KEY,
  compartmentId: process.env.OCI_COMPARTMENT_ID,
});

/**
 * Default instance using environment configuration
 */
export default ociOpenAI;
