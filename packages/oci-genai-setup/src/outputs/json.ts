/**
 * JSON configuration generator
 *
 * Outputs raw configuration as JSON for scripting and automation
 */

import { getAllModels } from '@acedergren/oci-genai-provider';

import type { GeneratedConfig } from '../types.js';
import { CODING_SETTINGS } from '../types.js';

/**
 * Full JSON output structure
 */
export interface JsonConfigOutput {
  /** OCI configuration */
  oci: {
    profile: string;
    compartmentId: string;
    region: string;
  };
  /** Model configuration */
  models: Array<{
    id: string;
    name: string;
    contextWindow: number;
    capabilities: {
      vision: boolean;
      tools: boolean;
      streaming: boolean;
    };
  }>;
  /** Settings applied */
  settings: {
    codingOptimized: boolean;
    temperature?: number;
    maxTokens?: number;
    frequencyPenalty?: number;
  };
  /** Environment variables for quick setup */
  env: Record<string, string>;
}

/**
 * Generate JSON configuration output
 */
export function generateJsonConfig(config: GeneratedConfig): JsonConfigOutput {
  const allModels = getAllModels();

  // Get full model details for selected models
  const modelDetails = config.models
    .map((id) => allModels.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => m !== undefined)
    .map((m) => ({
      id: m.id,
      name: m.name,
      contextWindow: m.contextWindow,
      capabilities: {
        vision: m.capabilities.vision,
        tools: m.capabilities.tools,
        streaming: m.capabilities.streaming,
      },
    }));

  // Build env vars
  const env: Record<string, string> = {
    OCI_CONFIG_PROFILE: config.profile,
    OCI_COMPARTMENT_ID: config.compartmentId,
    OCI_REGION: config.region,
    OCI_GENAI_MODELS: config.models.join(','),
  };

  if (config.codingOptimized) {
    env.OCI_GENAI_TEMPERATURE = String(CODING_SETTINGS.temperature);
    env.OCI_GENAI_MAX_TOKENS = String(CODING_SETTINGS.maxTokens);
    env.OCI_GENAI_FREQUENCY_PENALTY = String(CODING_SETTINGS.frequencyPenalty);
  }

  return {
    oci: {
      profile: config.profile,
      compartmentId: config.compartmentId,
      region: config.region,
    },
    models: modelDetails,
    settings: {
      codingOptimized: config.codingOptimized,
      ...(config.codingOptimized && {
        temperature: CODING_SETTINGS.temperature,
        maxTokens: CODING_SETTINGS.maxTokens,
        frequencyPenalty: CODING_SETTINGS.frequencyPenalty,
      }),
    },
    env,
  };
}
