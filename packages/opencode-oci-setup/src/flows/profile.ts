/**
 * Profile selection and configuration flow
 *
 * Handles:
 * - Existing OCI config detection and profile selection
 * - Credential validation
 * - Manual configuration for users without OCI CLI
 */

import chalk from 'chalk';
import ora from 'ora';
import open from 'open';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import {
  parseOCIConfig,
  hasOCIConfig,
  validateCredentials,
  OCI_REGIONS,
  writeOCIConfig,
  isValidOCID,
  type OCIProfile,
  type ManualSetupInfo,
} from '@acedergren/oci-genai-provider/config';

import type { CLIOptions, Logger, ExistingSetupResult, SetupMode } from '../types.js';
import { select, text, confirm } from '../utils/prompts.js';

/**
 * Check for existing config and ask user how to proceed
 */
export async function checkExistingSetup(
  options: CLIOptions,
  log: Logger
): Promise<ExistingSetupResult> {
  const configPath = path.join(os.homedir(), '.config/opencode/opencode.json');

  if (!fs.existsSync(configPath)) {
    return { mode: 'fresh' };
  }

  // Parse existing config
  let existingConfig: Record<string, unknown> | undefined;
  try {
    existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as Record<string, unknown>;
  } catch {
    // Invalid JSON, treat as fresh
    return { mode: 'fresh' };
  }

  // Check if OCI provider is already configured
  const hasOCIProvider = !!(existingConfig as { provider?: { 'oci-genai'?: unknown } })?.provider?.[
    'oci-genai'
  ];

  if (!hasOCIProvider) {
    // Config exists but no OCI provider, we can add to it
    log.log(chalk.yellow('📋 Existing opencode.json found (without OCI GenAI)\n'));
    return { mode: 'fresh', existingConfig };
  }

  // OCI provider exists - ask user what to do
  log.log(chalk.yellow('📋 Existing OCI GenAI configuration found!\n'));

  if (options.yes) {
    // Non-interactive mode: default to fresh
    return { mode: 'fresh', existingConfig };
  }

  const setupMode = await select<SetupMode>({
    message: 'How would you like to proceed?',
    choices: [
      {
        title: 'Start fresh',
        value: 'fresh',
        description: 'Replace existing OCI GenAI config (other providers preserved)',
      },
      {
        title: 'Modify current setup',
        value: 'modify',
        description: 'Add/remove models, change settings',
      },
      {
        title: 'Cancel',
        value: 'cancel',
        description: 'Keep existing configuration',
      },
    ],
  });

  return { mode: setupMode ?? 'cancel', existingConfig };
}

/**
 * Get an OCI profile - either from existing config or via manual setup
 */
export async function getProfile(
  options: CLIOptions,
  log: Logger
): Promise<OCIProfile | undefined> {
  if (hasOCIConfig()) {
    return handleExistingConfig(options, log);
  }
  return handleMissingConfig(options, log);
}

/**
 * Handle existing OCI config - parse and select profile
 */
async function handleExistingConfig(
  options: CLIOptions,
  log: Logger
): Promise<OCIProfile | undefined> {
  const configResult = parseOCIConfig();

  if (!configResult.found || configResult.profiles.length === 0) {
    log.log(chalk.yellow('⚠️  OCI config file is empty or invalid\n'));
    return handleMissingConfig(options, log);
  }

  log.log(chalk.green(`✓ Found OCI config with ${configResult.profiles.length} profile(s)\n`));

  // Select profile
  let selectedProfileName = options.profile;

  if (!selectedProfileName) {
    selectedProfileName = await select({
      message: 'Select OCI profile:',
      choices: configResult.profiles.map((p) => ({
        title: `${p.name} (${p.region})`,
        value: p.name,
        description: p.keyFileValid ? '✓ Key file found' : '✗ Key file missing',
      })),
    });
  }

  if (!selectedProfileName) {
    return undefined;
  }

  const profile = configResult.profiles.find((p) => p.name === selectedProfileName);

  if (!profile) {
    log.error(chalk.red(`Profile "${selectedProfileName}" not found.`));
    return undefined;
  }

  log.log(`\nUsing profile: ${chalk.cyan(profile.name)} (${profile.region})`);

  // Validate credentials
  const validateSpinner = ora('Validating OCI credentials...').start();
  const validation = await validateCredentials(selectedProfileName);

  if (validation.valid) {
    validateSpinner.succeed(`Credentials valid (${validation.userName})`);
  } else {
    validateSpinner.fail(`Validation failed: ${validation.error}`);

    if (!options.yes) {
      const continueAnyway = await confirm({
        message: 'Continue anyway?',
        initial: false,
      });

      if (!continueAnyway) {
        return undefined;
      }
    }
  }

  return profile;
}

/**
 * Handle missing OCI config - offer setup options
 */
async function handleMissingConfig(
  _options: CLIOptions,
  log: Logger
): Promise<OCIProfile | undefined> {
  log.log(chalk.yellow('⚠️  OCI configuration not found at ~/.oci/config\n'));

  const setupMethod = await select({
    message: 'How would you like to configure OCI credentials?',
    choices: [
      {
        title: 'Enter credentials manually',
        value: 'manual',
        description: 'I have my OCI API key details ready',
      },
      {
        title: 'Install OCI CLI first (recommended for beginners)',
        value: 'oci-cli',
        description: 'Opens setup guide in browser',
      },
      {
        title: 'Exit',
        value: 'exit',
      },
    ],
  });

  if (setupMethod === 'oci-cli') {
    log.log('\n📖 Opening OCI CLI setup guide...\n');
    const url = 'https://docs.oracle.com/iaas/Content/API/SDKDocs/cliinstall.htm';
    try {
      await open(url);
    } catch {
      log.log(`Please visit: ${chalk.cyan(url)}`);
    }
    log.log('After completing OCI CLI setup, re-run: npx @acedergren/opencode-oci-setup\n');
    return undefined;
  }

  if (setupMethod === 'exit') {
    return undefined;
  }

  // Manual configuration flow
  return manualConfigurationFlow(log);
}

/**
 * Manual configuration flow - collect all OCI credentials
 */
async function manualConfigurationFlow(log: Logger): Promise<OCIProfile | undefined> {
  log.log(chalk.bold('\n📝 Manual OCI Configuration\n'));
  log.log('You will need the following information from the OCI Console:\n');
  log.log('  • User OCID (Identity > Users > Your User)');
  log.log('  • Tenancy OCID (Administration > Tenancy Details)');
  log.log('  • API Key Fingerprint (Identity > Users > API Keys)');
  log.log('  • Private key file path\n');

  // Collect user OCID
  const userOcid = await text({
    message: 'Enter your User OCID:',
    validate: (value) => {
      if (!value) return 'User OCID is required';
      if (!isValidOCID(value, 'user'))
        return 'Invalid User OCID format (should start with ocid1.user.)';
      return true;
    },
  });

  if (!userOcid) return undefined;

  // Collect tenancy OCID
  const tenancyOcid = await text({
    message: 'Enter your Tenancy OCID:',
    validate: (value) => {
      if (!value) return 'Tenancy OCID is required';
      if (!isValidOCID(value, 'tenancy'))
        return 'Invalid Tenancy OCID format (should start with ocid1.tenancy.)';
      return true;
    },
  });

  if (!tenancyOcid) return undefined;

  // Collect fingerprint
  const fingerprint = await text({
    message: 'Enter your API Key Fingerprint (aa:bb:cc:...):',
    validate: (value) => {
      if (!value) return 'Fingerprint is required';
      // Basic fingerprint validation (XX:XX:XX format)
      if (!/^[a-f0-9]{2}(:[a-f0-9]{2}){15}$/i.test(value)) {
        return 'Invalid fingerprint format (should be aa:bb:cc:...)';
      }
      return true;
    },
  });

  if (!fingerprint) return undefined;

  // Collect key file path
  const defaultKeyPath = path.join(os.homedir(), '.oci/oci_api_key.pem');
  const keyFilePath = await text({
    message: 'Enter path to your private key file:',
    initial: defaultKeyPath,
    validate: (value) => {
      if (!value) return 'Key file path is required';
      const expandedPath = value.startsWith('~') ? path.join(os.homedir(), value.slice(1)) : value;
      if (!fs.existsSync(expandedPath)) {
        return `File not found: ${expandedPath}`;
      }
      return true;
    },
  });

  if (!keyFilePath) return undefined;

  // Select region
  const region = await select({
    message: 'Select your OCI region:',
    choices: OCI_REGIONS.map((r) => ({
      title: `${r.name} (${r.id})`,
      value: r.id,
    })),
  });

  if (!region) return undefined;

  // Profile name
  const profileName = await text({
    message: 'Enter a name for this profile:',
    initial: 'DEFAULT',
    validate: (value) => (value ? true : 'Profile name is required'),
  });

  if (!profileName) return undefined;

  // Write the OCI config file
  const writeSpinner = ora('Writing OCI config file...').start();

  try {
    const setupInfo: ManualSetupInfo = {
      user: userOcid,
      tenancy: tenancyOcid,
      fingerprint,
      keyFilePath,
      region,
      profileName,
    };

    writeOCIConfig(setupInfo, false);
    writeSpinner.succeed(`OCI config saved to ~/.oci/config`);

    // Return the profile we just created
    const expandedKeyPath = keyFilePath.startsWith('~')
      ? path.join(os.homedir(), keyFilePath.slice(1))
      : keyFilePath;

    return {
      name: profileName,
      region,
      user: userOcid,
      tenancy: tenancyOcid,
      fingerprint,
      keyFile: expandedKeyPath,
      keyFileValid: fs.existsSync(expandedKeyPath),
    };
  } catch (error) {
    writeSpinner.fail('Failed to write OCI config');
    log.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    return undefined;
  }
}
