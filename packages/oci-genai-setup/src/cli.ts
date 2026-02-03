#!/usr/bin/env bun
/**
 * OCI GenAI Setup CLI
 *
 * Interactive setup wizard for configuring OCI GenAI provider.
 * Supports multiple output formats:
 * - OpenCode (opencode.json)
 * - Claude Code MCP
 * - Environment variables
 * - JSON (for scripting)
 */

import { program } from 'commander';
import chalk from 'chalk';

import type { CLIOptions, GeneratedConfig } from './types.js';
import { createLogger } from './utils/logger.js';
import { checkExistingSetup, getProfile, selectOutputFormat } from './flows/profile.js';
import { getCompartmentId } from './flows/compartment.js';
import { selectModels, askCodingOptimization } from './flows/models.js';
import { writeConfig, showSuccessMessage } from './outputs/index.js';

const VERSION = '0.2.0';

// Main CLI entry point
program
  .name('oci-genai-setup')
  .description('Setup wizard for OCI GenAI provider (AI SDK, OpenCode, Claude Code)')
  .version(VERSION)
  .option('-p, --profile <name>', 'OCI profile name')
  .option('-c, --compartment <ocid>', 'Compartment OCID')
  .option('-o, --output <format>', 'Output format: opencode, claude-code, env, json')
  .option('--output-path <path>', 'Custom output path (for env format)')
  .option('-y, --yes', 'Skip confirmations')
  .option('-q, --quiet', 'Minimal output')
  .action(main);

program.parse();

/**
 * Main setup flow
 */
async function main(options: CLIOptions): Promise<void> {
  const log = createLogger(options.quiet ?? false);

  log.log(chalk.bold.blue('\n🚀 OCI GenAI Setup\n'));
  log.log(chalk.gray('Configure OCI Generative AI for your AI SDK application\n'));

  // Step 1: Select output format
  const outputFormat = await selectOutputFormat(options, log);

  // Step 2: Check for existing setup (format-dependent)
  const { mode } = await checkExistingSetup(options, outputFormat, log);

  if (mode === 'cancel') {
    log.log(chalk.gray('\nSetup cancelled. Your existing configuration is unchanged.\n'));
    process.exit(0);
  }

  if (mode === 'modify') {
    log.log(chalk.cyan('\n📝 Modifying existing configuration...\n'));
    // TODO(#42): Implement selective modify flow - currently performs full reconfiguration
    log.log(
      chalk.yellow('Note: Modify flow is not yet implemented. Proceeding with full setup.\n')
    );
    log.log(chalk.gray('Your existing configuration will be updated with new values.\n'));
  }

  // Step 3: Get OCI profile
  const profile = await getProfile(options, log);

  if (!profile) {
    log.error(chalk.red('Setup cancelled.'));
    process.exit(1);
  }

  // Step 4: Get compartment ID
  const compartmentId = await getCompartmentId(profile.name, options, log);

  if (!compartmentId) {
    log.error(chalk.red('No compartment selected. Exiting.'));
    process.exit(1);
  }

  // Step 5: Select models
  const selectedModels = await selectModels(profile.region, options, log);

  if (selectedModels.length === 0) {
    log.error(chalk.red('No models selected. Exiting.'));
    process.exit(1);
  }

  // Step 6: Coding optimization (skip for JSON output)
  const enableCodingOptimization =
    outputFormat === 'json' ? false : await askCodingOptimization(options, log);

  // Build the generated config
  const config: GeneratedConfig = {
    profile: profile.name,
    compartmentId,
    region: profile.region,
    models: selectedModels,
    codingOptimized: enableCodingOptimization,
  };

  // Step 7: Write configuration
  const result = await writeConfig(config, {
    format: outputFormat,
    outputPath: options.outputPath,
    log,
  });

  if (!result.success) {
    process.exit(1);
  }

  // Step 8: Success message (skip for JSON output)
  if (outputFormat !== 'json') {
    showSuccessMessage(config, outputFormat, log);
  }
}
