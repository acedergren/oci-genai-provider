import OpenAI from 'openai';
import type { OCIOpenAIConfig } from './types';
import { getBaseURL } from './endpoint';
import { createOCIAuthHeaders } from './auth';

/**
 * Create OpenAI client configured for OCI Generative AI Service
 *
 * @example
 * ```typescript
 * const client = createOCIOpenAI({
 *   region: 'us-ashburn-1',
 *   apiKey: process.env.OCI_API_KEY,
 *   compartmentId: process.env.OCI_COMPARTMENT_ID,
 * });
 *
 * const response = await client.chat.completions.create({
 *   model: 'meta.llama-3.3-70b-instruct',
 *   messages: [{ role: 'user', content: 'Hello!' }],
 * });
 * ```
 */
export function createOCIOpenAI(config: OCIOpenAIConfig = {}): OpenAI {
  // Construct base URL from region or custom endpoint
  const baseURL = getBaseURL(config);

  // Create authentication headers
  const defaultHeaders = createOCIAuthHeaders(config);

  // Create OpenAI client with OCI configuration
  return new OpenAI({
    baseURL,
    apiKey: config.apiKey || 'not-needed-for-instance-principal',
    defaultHeaders,
  });
}
