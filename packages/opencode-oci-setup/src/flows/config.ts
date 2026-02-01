/**
 * Configuration generation flow
 *
 * Handles:
 * - Installing the OpenCode OCI package
 * - Generating opencode.json
 * - Preserving existing providers
 * - Success message display
 */

import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';

import { getAllModels } from '@acedergren/oci-genai-provider';

import type { Logger } from '../types.js';
import { CODING_SETTINGS } from '../types.js';

/**
 * Install the OpenCode OCI package
 */
export function installPackage(log: Logger): void {
  const opencodeDir = path.join(os.homedir(), '.config/opencode');
  const installSpinner = ora('Installing @acedergren/oci-genai-provider...').start();

  try {
    // Ensure OpenCode config directory exists
    if (!fs.existsSync(opencodeDir)) {
      fs.mkdirSync(opencodeDir, { recursive: true });
    }

    // Ensure package.json exists
    const packageJsonPath = path.join(opencodeDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      fs.writeFileSync(packageJsonPath, JSON.stringify({ dependencies: {} }, null, 2));
    }

    // Install using npm (execFileSync for security - no shell injection)
    execFileSync('npm', ['install', '@acedergren/oci-genai-provider'], {
      cwd: opencodeDir,
      stdio: 'pipe',
    });

    installSpinner.succeed('Package installed');
  } catch (error) {
    installSpinner.fail('Installation failed');

    // Try to provide helpful error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('npm')) {
      log.error(chalk.red('\nMake sure npm is installed and in your PATH.'));
    } else {
      log.error(chalk.red(`\nError: ${errorMessage}`));
    }

    log.log(chalk.yellow('\nYou can install manually:'));
    log.log(chalk.cyan(`  cd ~/.config/opencode && npm install @acedergren/oci-genai-provider\n`));
  }
}

/**
 * Generate opencode.json configuration
 */
export function generateConfig(
  profileName: string,
  compartmentId: string,
  selectedModels: string[],
  enableCodingOptimization: boolean,
  existingConfig: Record<string, unknown> | undefined,
  log: Logger
): void {
  const configSpinner = ora('Generating opencode.json...').start();

  const allModels = getAllModels();

  // Build model configuration
  const modelConfig: Record<string, unknown> = {};
  for (const modelId of selectedModels) {
    const meta = allModels.find((m) => m.id === modelId);
    if (meta) {
      modelConfig[modelId] = {
        name: meta.name,
        ...(meta.capabilities.vision && { attachment: true }),
        limit: {
          context: meta.contextWindow,
          output: enableCodingOptimization ? CODING_SETTINGS.maxTokens : 8192,
        },
        // Add coding-optimized settings if enabled
        ...(enableCodingOptimization && {
          settings: {
            temperature: CODING_SETTINGS.temperature,
            frequencyPenalty: CODING_SETTINGS.frequencyPenalty,
          },
        }),
      };
    }
  }

  // Build the OCI GenAI provider config
  const ociProviderConfig = {
    npm: '@acedergren/oci-genai-provider',
    name: 'OCI GenAI',
    options: {
      compartmentId,
      configProfile: profileName,
    },
    models: modelConfig,
  };

  // Build the full OpenCode config, preserving other providers if they exist
  const existingProviders =
    (existingConfig as { provider?: Record<string, unknown> })?.provider || {};
  const openCodeConfig = {
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

  // Write to ~/.config/opencode/opencode.json
  const opencodeDir = path.join(os.homedir(), '.config/opencode');
  const configPath = path.join(opencodeDir, 'opencode.json');

  try {
    // Ensure directory exists
    if (!fs.existsSync(opencodeDir)) {
      fs.mkdirSync(opencodeDir, { recursive: true });
    }

    fs.writeFileSync(configPath, JSON.stringify(openCodeConfig, null, 2));
    configSpinner.succeed(`Configuration saved to ${configPath}`);
  } catch (error) {
    configSpinner.fail('Failed to write configuration');
    log.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
  }
}

/**
 * Show success message with next steps
 */
export function showSuccessMessage(
  selectedModels: string[],
  enableCodingOptimization: boolean,
  log: Logger
): void {
  log.log(chalk.bold.green('\n✓ Setup complete!\n'));

  // Show coding optimization status
  if (enableCodingOptimization) {
    log.log(chalk.cyan('🔧 Coding optimization: ENABLED'));
    log.log(chalk.gray('   • temperature: 0.2 (deterministic)'));
    log.log(chalk.gray('   • maxTokens: 8192 (long outputs)'));
    log.log(chalk.gray('   • frequencyPenalty: 0.1 (reduce repetition)\n'));
  } else {
    log.log(chalk.gray('🔧 Coding optimization: disabled (using defaults)\n'));
  }

  log.log('Next steps:');
  log.log(`  1. Start OpenCode: ${chalk.cyan('opencode')}`);
  log.log(`  2. Select provider: ${chalk.cyan('/provider oci-genai')}`);
  log.log(`  3. Select model: ${chalk.cyan('/model <model-name>')}`);
  log.log('  4. Start chatting!\n');

  log.log('Enabled models:');
  for (const modelId of selectedModels.slice(0, 5)) {
    log.log(`  ${chalk.green('✓')} ${modelId}`);
  }
  if (selectedModels.length > 5) {
    log.log(`  ${chalk.gray(`... and ${selectedModels.length - 5} more`)}`);
  }
  log.log('');

  log.log(
    chalk.gray('Tip: Run this wizard again anytime with: npx @acedergren/opencode-oci-setup\n')
  );
}
