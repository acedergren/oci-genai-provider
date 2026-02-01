/**
 * Configuration writer - handles all output formats
 */

import chalk from 'chalk';
import ora from 'ora';

import type { GeneratedConfig, Logger, OutputFormat } from '../types.js';
import { writeOpencodeConfig } from './opencode.js';
import { writeOpenAICompatConfig } from './openai-compat.js';
import { writeEnvConfig, generateShellExports } from './env.js';
import { generateJsonConfig } from './json.js';

/**
 * Options for writing configuration
 */
export interface WriteConfigOptions {
  format: OutputFormat;
  outputPath?: string;
  log: Logger;
}

/**
 * Write result
 */
export interface WriteResult {
  success: boolean;
  path?: string;
  output?: string;
}

/**
 * Write configuration in the specified format
 */
export async function writeConfig(
  config: GeneratedConfig,
  options: WriteConfigOptions
): Promise<WriteResult> {
  const { format, outputPath, log } = options;

  const spinner = ora(`Writing ${format} configuration...`).start();

  try {
    switch (format) {
      case 'opencode': {
        const result = await writeOpencodeConfig(config, log);
        if (result.success) {
          spinner.succeed(`OpenCode config saved to ${chalk.cyan(result.path)}`);
        } else {
          spinner.fail('Failed to write OpenCode config');
        }
        return { success: result.success, path: result.path };
      }

      case 'openai-compat': {
        const result = await writeOpenAICompatConfig(config, log);
        if (result.success) {
          spinner.succeed(`OpenAI-compatible config saved to ${chalk.cyan(result.path)}`);
          log.log(chalk.gray('  Also created: oci-openai-example.mjs'));
        } else {
          spinner.fail('Failed to write OpenAI-compatible config');
        }
        return { success: result.success, path: result.path };
      }

      case 'env': {
        const envPath = outputPath || '.env';
        const result = await writeEnvConfig(config, envPath, log);
        if (result.success) {
          spinner.succeed(`Environment config saved to ${chalk.cyan(result.path)}`);

          // Also show shell exports
          log.log(chalk.gray('\nOr add these to your shell profile:'));
          log.log(chalk.gray('───────────────────────────────────'));
          log.log(generateShellExports(config));
        } else {
          spinner.fail('Failed to write .env file');
        }
        return { success: result.success, path: result.path };
      }

      case 'json': {
        spinner.stop();
        const jsonOutput = generateJsonConfig(config);
        const output = JSON.stringify(jsonOutput, null, 2);
        // JSON output goes to stdout for piping/scripting
        process.stdout.write(output + '\n');
        return { success: true, output };
      }

      default: {
        // Exhaustive check - this should never happen
        const _exhaustive: never = format;
        spinner.fail(`Unknown output format: ${String(_exhaustive)}`);
        return { success: false };
      }
    }
  } catch (error) {
    spinner.fail(
      `Failed to write configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return { success: false };
  }
}

/**
 * Show success message based on output format
 */
export function showSuccessMessage(
  config: GeneratedConfig,
  format: OutputFormat,
  log: Logger
): void {
  log.log(chalk.bold.green('\n✓ Setup complete!\n'));

  if (config.codingOptimized) {
    log.log(chalk.cyan('🔧 Coding optimization: ENABLED'));
    log.log(chalk.gray('   • temperature: 0.2 (deterministic)'));
    log.log(chalk.gray('   • maxTokens: 8192 (long outputs)'));
    log.log(chalk.gray('   • frequencyPenalty: 0.1 (reduce repetition)\n'));
  }

  switch (format) {
    case 'opencode':
      log.log('Next steps:');
      log.log(`  1. Start OpenCode: ${chalk.cyan('opencode')}`);
      log.log(`  2. Select provider: ${chalk.cyan('/provider oci-genai')}`);
      log.log(`  3. Select model: ${chalk.cyan('/model <model-name>')}`);
      break;

    case 'openai-compat':
      log.log('Next steps:');
      log.log(`  1. Install: ${chalk.cyan('pnpm add @acedergren/oci-openai-compatible')}`);
      log.log(`  2. Source env: ${chalk.cyan('source .env.oci-openai')}`);
      log.log(`  3. Run example: ${chalk.cyan('node oci-openai-example.mjs')}`);
      break;

    case 'env':
      log.log('Next steps:');
      log.log(`  1. Source the .env file: ${chalk.cyan('source .env')}`);
      log.log(`  2. Or add exports to your shell profile`);
      log.log(`  3. Use with AI SDK:`);
      log.log(
        chalk.gray(`
     import { createOCI } from '@acedergren/oci-genai-provider';
     const oci = createOCI();
     const model = oci.languageModel('${config.models[0] || 'grok-3'}');
`)
      );
      break;

    case 'json':
      // JSON output is self-explanatory
      break;
  }

  log.log('\nEnabled models:');
  for (const modelId of config.models.slice(0, 5)) {
    log.log(`  ${chalk.green('✓')} ${modelId}`);
  }
  if (config.models.length > 5) {
    log.log(`  ${chalk.gray(`... and ${config.models.length - 5} more`)}`);
  }
  log.log('');

  log.log(chalk.gray('Tip: Run this wizard again anytime with: npx @acedergren/oci-genai-setup\n'));
}
