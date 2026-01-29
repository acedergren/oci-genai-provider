/**
 * OpenCode OCI GenAI Setup CLI
 *
 * Interactive setup wizard for configuring OCI GenAI provider in OpenCode.
 * Supports both auto-discovery from ~/.oci/config and manual configuration.
 */

import { program } from 'commander';
import chalk from 'chalk';

import type { CLIOptions } from './types.js';
import { createLogger } from './utils/logger.js';
import { checkExistingSetup, getProfile } from './flows/profile.js';
import { getCompartmentId } from './flows/compartment.js';
import { selectModels, askCodingOptimization } from './flows/models.js';
import { installPackage, generateConfig, showSuccessMessage } from './flows/config.js';

const VERSION = '0.1.0';

// Main CLI entry point
program
  .name('opencode-oci-setup')
  .description('Setup wizard for OCI GenAI provider in OpenCode')
  .version(VERSION)
  .option('-p, --profile <name>', 'OCI profile name')
  .option('-c, --compartment <ocid>', 'Compartment OCID')
  .option('-y, --yes', 'Skip confirmations')
  .option('-q, --quiet', 'Minimal output')
  .action(main);

program.parse();

/**
 * Main setup flow
 */
async function main(options: CLIOptions): Promise<void> {
  const log = createLogger(options.quiet ?? false);

  log.log(chalk.bold.blue('\n🔧 OpenCode OCI GenAI Setup\n'));

  // Step 0: Check for existing setup
  const { mode, existingConfig } = await checkExistingSetup(options, log);

  if (mode === 'cancel') {
    log.log(chalk.gray('\nSetup cancelled. Your existing configuration is unchanged.\n'));
    process.exit(0);
  }

  if (mode === 'modify') {
    log.log(chalk.cyan('\n📝 Modifying existing configuration...\n'));
    // TODO: Implement modify flow - for now falls through to fresh setup
  }

  // Step 1: Get OCI profile
  const profile = await getProfile(options, log);

  if (!profile) {
    log.error(chalk.red('Setup cancelled.'));
    process.exit(1);
  }

  // Step 2: Get compartment ID
  const compartmentId = await getCompartmentId(profile.name, options, log);

  if (!compartmentId) {
    log.error(chalk.red('No compartment selected. Exiting.'));
    process.exit(1);
  }

  // Step 3: Select models
  const selectedModels = await selectModels(profile.region, options, log);

  if (selectedModels.length === 0) {
    log.error(chalk.red('No models selected. Exiting.'));
    process.exit(1);
  }

  // Step 4: Coding optimization
  const enableCodingOptimization = await askCodingOptimization(options, log);

  // Step 5: Install package
  await installPackage(log);

  // Step 6: Generate config
  await generateConfig(
    profile.name,
    compartmentId,
    selectedModels,
    enableCodingOptimization,
    existingConfig,
    log
  );

  // Step 7: Success message
  showSuccessMessage(selectedModels, enableCodingOptimization, log);
}
