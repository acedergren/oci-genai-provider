/**
 * Model selection flow
 *
 * Handles:
 * - Filtering models by region availability
 * - Grouping models by family
 * - Coding optimization settings
 * - Pre-selecting recommended models
 */

import chalk from 'chalk';

import {
  getModelsByRegion,
  getAllModels,
  getCodingRecommendedModels,
  type OCIGenAIRegion,
} from '@acedergren/oci-genai-provider';

import type { CLIOptions, Logger } from '../types.js';
import { confirm, multiselect, type SelectChoice } from '../utils/prompts.js';

/**
 * Family display names for grouping
 */
const FAMILY_NAMES: Record<string, string> = {
  grok: '── Grok (xAI) ──',
  llama: '── Llama (Meta) ──',
  cohere: '── Command (Cohere) ──',
  gemini: '── Gemini (Google) ──',
  openai: '── GPT-OSS (OpenAI) ──',
};

/**
 * Ask about coding optimization settings
 */
export async function askCodingOptimization(_options: CLIOptions, log: Logger): Promise<boolean> {
  if (_options.yes) {
    // Default to enabled in non-interactive mode
    return true;
  }

  log.log(chalk.bold('\n🔧 Model Optimization\n'));
  log.log('Coding-optimized settings tune models for better code generation:');
  log.log(chalk.gray('  • Lower temperature (0.2) - More consistent, deterministic code'));
  log.log(chalk.gray('  • Higher max tokens (8192) - Support longer code outputs'));
  log.log(chalk.gray('  • Frequency penalty (0.1) - Reduce repetitive patterns\n'));

  return confirm({
    message: 'Enable coding-optimized settings for all models?',
    initial: true,
  });
}

/**
 * Select models to enable (filtered by region, with coding recommendations)
 */
export async function selectModels(
  region: string,
  _options: CLIOptions,
  log: Logger
): Promise<string[]> {
  // Get models available in this region (exclude dedicated-only by default)
  const regionModels = getModelsByRegion(region as OCIGenAIRegion, false);
  const recommendedModels = getCodingRecommendedModels(region as OCIGenAIRegion);
  const allModels = getAllModels();

  if (regionModels.length === 0) {
    log.log(chalk.yellow(`\n⚠️  No on-demand models found for region ${region}`));
    log.log(chalk.yellow('   This region may only support dedicated AI clusters.\n'));

    // Fall back to showing all models
    const useFallback = await confirm({
      message: 'Show all models anyway? (may not work in this region)',
      initial: false,
    });

    if (!useFallback) {
      return [];
    }
  }

  const modelsToShow = regionModels.length > 0 ? regionModels : allModels;

  // Get recommended model IDs for pre-selection
  const recommendedIds = new Set(recommendedModels.map((m) => m.id));

  // Group models by family
  const modelsByFamily = new Map<string, typeof modelsToShow>();
  for (const model of modelsToShow) {
    const family = model.family;
    if (!modelsByFamily.has(family)) {
      modelsByFamily.set(family, []);
    }
    modelsByFamily.get(family)!.push(model);
  }

  // Build choices with family headers
  const modelChoices: SelectChoice<string>[] = [];

  for (const [family, models] of modelsByFamily) {
    const familyTitle = FAMILY_NAMES[family] || `── ${family} ──`;
    modelChoices.push({ title: familyTitle, value: '', disabled: true });

    for (const model of models) {
      const contextStr =
        model.contextWindow >= 1000000
          ? `${Math.floor(model.contextWindow / 1000000)}M`
          : `${Math.floor(model.contextWindow / 1000)}K`;
      const visionStr = model.capabilities.vision ? '👁 ' : '';
      const toolsStr = model.capabilities.tools ? '' : '⚠️ no tools';
      const recommendedStr = recommendedIds.has(model.id) ? '⭐ ' : '';

      // Build description from coding note
      const codingNote = (model as { codingNote?: string }).codingNote;

      modelChoices.push({
        title: `${recommendedStr}${model.id} (${visionStr}${contextStr})${toolsStr ? ' ' + toolsStr : ''}`,
        value: model.id,
        selected: recommendedIds.has(model.id),
        description: codingNote,
      });
    }
  }

  // Add quick options
  modelChoices.push({ title: '── Quick Options ──', value: '', disabled: true });
  modelChoices.push({
    title: '✓ Select ALL models with tool support',
    value: 'all-tools',
    selected: false,
  });
  modelChoices.push({ title: '✓ Select ALL models', value: 'all', selected: false });

  const recommendedCount = recommendedModels.length;
  log.log(chalk.gray(`\nShowing ${modelsToShow.length} models available in ${region}`));
  log.log(chalk.cyan(`⭐ = Recommended for coding (${recommendedCount} pre-selected)\n`));

  const selectedModels = await multiselect({
    message: 'Select models to enable (space to select, enter to confirm):',
    choices: modelChoices,
    min: 1,
    hint: '- Space to select, Enter to confirm',
  });

  if (selectedModels.length === 0) {
    return [];
  }

  // Handle "all" selection
  if (selectedModels.includes('all')) {
    return modelsToShow.map((m) => m.id);
  }

  // Handle "all with tools" selection
  if (selectedModels.includes('all-tools')) {
    return modelsToShow.filter((m) => m.capabilities.tools).map((m) => m.id);
  }

  return selectedModels.filter((m) => m !== '');
}
