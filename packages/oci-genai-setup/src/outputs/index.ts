/**
 * Output format generators
 *
 * Generates configuration in different formats:
 * - OpenCode (opencode.json)
 * - OpenAI Compatible (.env and example script)
 * - Environment variables (.env or shell exports)
 * - JSON (raw config for scripting)
 */

export { generateOpencodeConfig, writeOpencodeConfig } from './opencode.js';
export { generateOpenAICompatConfig, writeOpenAICompatConfig } from './openai-compat.js';
export { generateEnvConfig, writeEnvConfig } from './env.js';
export { generateJsonConfig } from './json.js';
export { writeConfig, showSuccessMessage, type WriteConfigOptions } from './writer.js';
