/**
 * Compartment discovery and selection flow
 *
 * Handles:
 * - Auto-discovery of compartments from OCI
 * - Manual compartment ID entry as fallback
 */

import chalk from 'chalk';
import ora from 'ora';

import { discoverCompartments, isValidOCID } from '@acedergren/oci-genai-provider/config';

import type { CLIOptions, Logger } from '../types.js';
import { select, text } from '../utils/prompts.js';

/**
 * Get compartment ID - try auto-discovery first, fall back to manual
 */
export async function getCompartmentId(
  profileName: string,
  options: CLIOptions,
  log: Logger
): Promise<string | undefined> {
  // Use CLI option if provided
  if (options.compartment) {
    return options.compartment;
  }

  // Try to auto-discover compartments
  const compartmentSpinner = ora('Discovering compartments...').start();

  try {
    const compartments = await discoverCompartments(profileName);
    compartmentSpinner.succeed(`Found ${compartments.length} compartment(s)`);

    const compartment = await select({
      message: 'Select compartment for GenAI API calls:',
      choices: [
        ...compartments.map((c) => ({
          title: c.name,
          value: c.id,
          description: c.description || c.id.substring(0, 40) + '...',
        })),
        {
          title: '📝 Enter OCID manually',
          value: 'manual',
        },
      ],
    });

    if (compartment === 'manual') {
      return getManualCompartmentId(log);
    }

    return compartment;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    compartmentSpinner.fail('Could not auto-discover compartments');
    log.log(chalk.red(`\nError: ${errorMsg}`));
    log.log(chalk.yellow(`\nThis could mean:`));
    log.log(chalk.yellow(`  • Invalid OCI credentials or profile`));
    log.log(chalk.yellow(`  • Missing IAM permissions for compartment list`));
    log.log(chalk.yellow(`  • Network connectivity issues`));
    log.log(chalk.yellow(`\nYou can still enter a compartment OCID manually.\n`));

    return getManualCompartmentId(log);
  }
}

/**
 * Get compartment ID manually
 */
async function getManualCompartmentId(log: Logger): Promise<string | undefined> {
  log.log('\n💡 Find your Compartment OCID in OCI Console:');
  log.log('   Identity > Compartments > [Your Compartment] > OCID\n');

  const compartmentId = await text({
    message: 'Enter Compartment OCID:',
    validate: (value) => {
      if (!value) return 'Compartment OCID is required';
      if (!isValidOCID(value, 'compartment') && !isValidOCID(value, 'tenancy')) {
        return 'Invalid OCID format (should start with ocid1.compartment. or ocid1.tenancy.)';
      }
      return true;
    },
  });

  return compartmentId;
}
