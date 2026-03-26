import * as common from 'oci-common';
import type { OCIConfig } from '../types';

const OCI_GENAI_API_KEY_ENV_VARS = ['OCI_GENAI_API_KEY', 'OCI_API_KEY', 'OPENAI_API_KEY'] as const;

export function isAPIKeyAuth(config: OCIConfig): boolean {
  return config.auth === 'api_key';
}

export function getAPIKey(config: OCIConfig): string {
  if (config.apiKey) {
    return config.apiKey;
  }

  for (const envVar of OCI_GENAI_API_KEY_ENV_VARS) {
    const value = process.env[envVar];
    if (value) {
      return value;
    }
  }

  throw new Error(
    'OCI Generative AI API key not found. Provide config.apiKey or set OCI_GENAI_API_KEY, OCI_API_KEY, or OPENAI_API_KEY.'
  );
}

export function getOpenAICompatibleEndpoint(config: OCIConfig): string {
  const region = getRegion(config);
  const baseEndpoint =
    config.endpoint ?? `https://inference.generativeai.${region}.oci.oraclecloud.com`;

  return baseEndpoint.endsWith('/20231130/actions/v1')
    ? baseEndpoint
    : `${baseEndpoint.replace(/\/$/, '')}/20231130/actions/v1`;
}

/**
 * Create OCI authentication provider based on configuration
 */
export async function createAuthProvider(
  config: OCIConfig
): Promise<common.AuthenticationDetailsProvider> {
  const authMethod = config.auth || 'config_file';

  switch (authMethod) {
    case 'config_file': {
      const configPath = config.configPath || undefined;
      const profile = config.profile || 'DEFAULT';

      return new common.ConfigFileAuthenticationDetailsProvider(configPath, profile);
    }

    case 'api_key': {
      throw new Error(
        'The OCI Generative AI service API key uses the OpenAI-compatible Bearer-token transport, not the native OCI SDK signer. Use a model path that supports auth="api_key".'
      );
    }

    case 'instance_principal': {
      const builder = new common.InstancePrincipalsAuthenticationDetailsProviderBuilder();
      return await builder.build();
    }

    case 'resource_principal': {
      return common.ResourcePrincipalAuthenticationDetailsProvider.builder();
    }

    default:
      throw new Error(
        `Unsupported authentication method: ${authMethod as string}. ` +
          `Supported methods: config_file, api_key, instance_principal, resource_principal`
      );
  }
}

/**
 * Get compartment ID from config, environment, or config file
 */
export function getCompartmentId(config: OCIConfig): string {
  // Priority: config > environment > error
  const compartmentId = config.compartmentId || process.env.OCI_COMPARTMENT_ID;

  if (!compartmentId) {
    throw new Error(
      'Compartment ID not found. Provide via config.compartmentId or OCI_COMPARTMENT_ID environment variable.'
    );
  }

  return compartmentId;
}

/**
 * Get region from config or environment
 */
export function getRegion(config: OCIConfig): string {
  return config.region || process.env.OCI_REGION || 'eu-frankfurt-1';
}
