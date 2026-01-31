/**
 * Supported OCI regions with OpenAI-compatible endpoints
 * @see https://docs.oracle.com/en-us/iaas/Content/generative-ai/oci-openai.htm
 */
export type OCIRegion =
  | 'us-ashburn-1'
  | 'us-chicago-1'
  | 'us-phoenix-1'
  | 'eu-frankfurt-1'
  | 'ap-hyderabad-1'
  | 'ap-osaka-1';

/**
 * Authentication method for OCI API access
 */
export type OCIAuthMethod = 'api_key' | 'instance_principal' | 'resource_principal';

/**
 * Configuration for OCI OpenAI-compatible client
 */
export interface OCIOpenAIConfig {
  /**
   * OCI region hosting the Generative AI service
   * Must be one of the regions supporting OpenAI-compatible endpoints
   */
  region?: OCIRegion;

  /**
   * OCI API key for authentication
   * Required unless using instance_principal or resource_principal auth
   */
  apiKey?: string;

  /**
   * OCI compartment OCID where models are accessible
   * If not provided, uses default compartment from OCI config
   */
  compartmentId?: string;

  /**
   * Custom endpoint URL (for testing or dedicated clusters)
   * If not provided, constructs from region
   */
  endpoint?: string;

  /**
   * Authentication method to use
   * @default 'api_key'
   * @note Currently only 'api_key' is supported via this package.
   * For instance_principal or resource_principal auth, use @acedergren/oci-genai-provider instead.
   */
  auth?: OCIAuthMethod;
}

/**
 * Supported OCI models accessible via OpenAI-compatible API
 * @see https://docs.oracle.com/en-us/iaas/Content/generative-ai/oci-openai.htm#oci-openai
 */
export type OCIModelId =
  | 'meta.llama-3.3-70b-instruct'
  | 'meta.llama-3.2-90b-vision-instruct'
  | 'meta.llama-3.1-405b-instruct'
  | 'meta.llama-3.1-70b-instruct'
  | 'xai.grok-3'
  | 'xai.grok-3-mini'
  | 'openai.gpt-oss';

/**
 * Regional endpoint mapping for OCI Generative AI OpenAI-compatible API
 */
export const REGION_ENDPOINTS: Record<OCIRegion, string> = {
  'us-ashburn-1': 'https://inference.generativeai.us-ashburn-1.oci.oraclecloud.com',
  'us-chicago-1': 'https://inference.generativeai.us-chicago-1.oci.oraclecloud.com',
  'us-phoenix-1': 'https://inference.generativeai.us-phoenix-1.oci.oraclecloud.com',
  'eu-frankfurt-1': 'https://inference.generativeai.eu-frankfurt-1.oci.oraclecloud.com',
  'ap-hyderabad-1': 'https://inference.generativeai.ap-hyderabad-1.oci.oraclecloud.com',
  'ap-osaka-1': 'https://inference.generativeai.ap-osaka-1.oci.oraclecloud.com',
};

/**
 * API version for OCI OpenAI-compatible endpoints
 */
export const OCI_OPENAI_API_VERSION = '20231130';

/**
 * Check if a string is a valid OCI region
 */
export function isValidRegion(region: string | undefined): region is OCIRegion {
  if (!region) return false;
  return region in REGION_ENDPOINTS;
}
