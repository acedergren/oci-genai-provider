/**
 * Claude Code MCP configuration generator
 *
 * Generates MCP server configuration for Claude Code
 */

import * as path from 'node:path';

import type { GeneratedConfig, Logger } from '../types.js';
import { fileExists, readJsonFile, writeJsonFile, getHomePath } from '../utils/file.js';

/**
 * Claude Code MCP server configuration
 */
interface ClaudeCodeMcpConfig {
  mcpServers?: Record<
    string,
    {
      command: string;
      args?: string[];
      env?: Record<string, string>;
    }
  >;
}

/**
 * Generate Claude Code MCP server configuration
 */
export function generateClaudeCodeConfig(config: GeneratedConfig): ClaudeCodeMcpConfig {
  return {
    mcpServers: {
      'oci-genai': {
        command: 'npx',
        args: ['-y', '@acedergren/oci-genai-mcp'],
        env: {
          OCI_CONFIG_PROFILE: config.profile,
          OCI_COMPARTMENT_ID: config.compartmentId,
          OCI_REGION: config.region,
        },
      },
    },
  };
}

/**
 * Get Claude Code settings path based on OS
 */
function getClaudeCodeSettingsPath(): string {
  const home = getHomePath();
  const platform = process.platform;

  if (platform === 'darwin') {
    return path.join(home, 'Library/Application Support/Claude/claude_desktop_config.json');
  } else if (platform === 'win32') {
    return path.join(home, 'AppData/Roaming/Claude/claude_desktop_config.json');
  }
  // Linux and others
  return path.join(home, '.config/claude/claude_desktop_config.json');
}

/**
 * Write Claude Code MCP configuration
 */
export async function writeClaudeCodeConfig(
  config: GeneratedConfig,
  log: Logger
): Promise<{ success: boolean; path: string }> {
  const configPath = getClaudeCodeSettingsPath();

  try {
    // Load existing config if present
    let existingConfig: ClaudeCodeMcpConfig = {};
    if (await fileExists(configPath)) {
      try {
        existingConfig = await readJsonFile<ClaudeCodeMcpConfig>(configPath);
      } catch {
        // Invalid JSON, start fresh
      }
    }

    const mcpConfig = generateClaudeCodeConfig(config);

    // Merge with existing config (preserve other MCP servers)
    const mergedConfig: ClaudeCodeMcpConfig = {
      ...existingConfig,
      mcpServers: {
        ...existingConfig.mcpServers,
        ...mcpConfig.mcpServers,
      },
    };

    await writeJsonFile(configPath, mergedConfig);

    return { success: true, path: configPath };
  } catch (error) {
    log.error(
      `Failed to write Claude Code config: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return { success: false, path: configPath };
  }
}
