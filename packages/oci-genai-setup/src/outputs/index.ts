/**
 * Output format generators
 *
 * Generates configuration in different formats:
 * - OpenCode (opencode.json)
 * - Claude Code MCP (MCP server config)
 * - Environment variables (.env or shell exports)
 * - JSON (raw config for scripting)
 */

export { generateOpencodeConfig, writeOpencodeConfig } from './opencode.js';
export { generateClaudeCodeConfig, writeClaudeCodeConfig } from './claude-code.js';
export { generateEnvConfig, writeEnvConfig } from './env.js';
export { generateJsonConfig } from './json.js';
export { writeConfig, showSuccessMessage, type WriteConfigOptions } from './writer.js';
