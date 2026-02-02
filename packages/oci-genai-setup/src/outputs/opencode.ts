/**
 * OpenCode configuration generator
 *
 * Generates opencode.json for ~/.config/opencode/
 */

import * as path from 'node:path';
import { getAllModels } from '@acedergren/oci-genai-provider';

import type { GeneratedConfig, Logger } from '../types.js';
import { CODING_SETTINGS } from '../types.js';
import { fileExists, readJsonFile, writeJsonFile, getHomePath } from '../utils/file.js';

/**
 * OpenCode provider configuration structure
 */
interface OpencodeProviderConfig {
  npm: string;
  name: string;
  options: {
    compartmentId: string;
    configProfile: string;
  };
  models: Record<string, unknown>;
}

/**
 * Generate OpenCode configuration object
 */
export function generateOpencodeConfig(
  config: GeneratedConfig,
  existingConfig?: Record<string, unknown>
): Record<string, unknown> {
  const allModels = getAllModels();

  // Build model configuration
  const modelConfig: Record<string, unknown> = {};
  for (const modelId of config.models) {
    const meta = allModels.find((m) => m.id === modelId);
    if (meta) {
      modelConfig[modelId] = {
        name: meta.name,
        ...(meta.capabilities.vision && { attachment: true }),
        limit: {
          context: meta.contextWindow,
          output: config.codingOptimized ? CODING_SETTINGS.maxTokens : 8192,
        },
        ...(config.codingOptimized && {
          settings: {
            temperature: CODING_SETTINGS.temperature,
            frequencyPenalty: CODING_SETTINGS.frequencyPenalty,
          },
        }),
      };
    }
  }

  // Build the OCI GenAI provider config
  const ociProviderConfig: OpencodeProviderConfig = {
    npm: '@acedergren/oci-genai-provider',
    name: 'OCI GenAI',
    options: {
      compartmentId: config.compartmentId,
      configProfile: config.profile,
    },
    models: modelConfig,
  };

  // Build the full OpenCode config, preserving other providers if they exist
  const existingProviders =
    (existingConfig as { provider?: Record<string, unknown> })?.provider || {};

  return {
    $schema: 'https://opencode.ai/config.json',
    // Preserve other top-level settings from existing config
    ...(existingConfig && {
      ...Object.fromEntries(
        Object.entries(existingConfig).filter(([key]) => key !== '$schema' && key !== 'provider')
      ),
    }),
    provider: {
      // Preserve other providers (e.g., anthropic, openai)
      ...Object.fromEntries(
        Object.entries(existingProviders).filter(([key]) => key !== 'oci-genai')
      ),
      // Add/replace OCI GenAI provider
      'oci-genai': ociProviderConfig,
    },
  };
}

/**
 * Write OpenCode configuration to ~/.config/opencode/opencode.json
 */
export async function writeOpencodeConfig(
  config: GeneratedConfig,
  log: Logger
): Promise<{ success: boolean; path: string }> {
  const configPath = path.join(getHomePath(), '.config/opencode/opencode.json');

  try {
    // Load existing config if present
    let existingConfig: Record<string, unknown> | undefined;
    if (await fileExists(configPath)) {
      try {
        existingConfig = await readJsonFile<Record<string, unknown>>(configPath);
      } catch {
        // Invalid JSON, start fresh
      }
    }

    const opencodeConfig = generateOpencodeConfig(config, existingConfig);
    await writeJsonFile(configPath, opencodeConfig);

    return { success: true, path: configPath };
  } catch (error) {
    log.error(
      `Failed to write OpenCode config: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return { success: false, path: configPath };
  }
}
