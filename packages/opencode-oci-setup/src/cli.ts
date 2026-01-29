/**
 * OpenCode OCI GenAI Setup CLI
 *
 * Interactive setup wizard for configuring OCI GenAI provider in OpenCode.
 * Supports both auto-discovery from ~/.oci/config and manual configuration.
 */

import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import open from 'open';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';

import {
  parseOCIConfig,
  hasOCIConfig,
  validateCredentials,
  discoverCompartments,
  OCI_REGIONS,
  writeOCIConfig,
  isValidOCID,
  type OCIProfile,
  type ManualSetupInfo,
} from '@acedergren/oci-genai-provider/config';

import { getAllModels } from '@acedergren/oci-genai-provider';

const VERSION = '0.1.0';

// CLI options interface
interface CLIOptions {
  profile?: string;
  compartment?: string;
  yes?: boolean;
  quiet?: boolean;
}

// Logger that respects quiet mode
function createLogger(quiet: boolean) {
  return {
    log: quiet ? () => {} : console.log,
    error: console.error,
    warn: quiet ? () => {} : console.warn,
  };
}

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
async function main(options: CLIOptions) {
  const log = createLogger(options.quiet ?? false);

  log.log(chalk.bold.blue('\n🔧 OpenCode OCI GenAI Setup\n'));

  let profile: OCIProfile | undefined;
  let compartmentId: string | undefined = options.compartment;

  // Step 1: Check for OCI config or set up credentials
  if (hasOCIConfig()) {
    profile = await handleExistingConfig(options, log);
  } else {
    profile = await handleMissingConfig(options, log);
  }

  if (!profile) {
    log.error(chalk.red('Setup cancelled.'));
    process.exit(1);
  }

  // Step 2: Get compartment ID (auto-discover or manual)
  if (!compartmentId) {
    compartmentId = await getCompartmentId(profile.name, options, log);
  }

  if (!compartmentId) {
    log.error(chalk.red('No compartment selected. Exiting.'));
    process.exit(1);
  }

  // Step 3: Select models
  const selectedModels = await selectModels(options, log);

  if (selectedModels.length === 0) {
    log.error(chalk.red('No models selected. Exiting.'));
    process.exit(1);
  }

  // Step 4: Install package
  await installPackage(log);

  // Step 5: Generate opencode.json
  await generateConfig(profile.name, compartmentId, selectedModels, log);

  // Step 6: Show success message
  showSuccessMessage(selectedModels, log);
}

/**
 * Handle existing OCI config - parse and select profile
 */
async function handleExistingConfig(
  options: CLIOptions,
  log: ReturnType<typeof createLogger>
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
    const { profile } = await prompts({
      type: 'select',
      name: 'profile',
      message: 'Select OCI profile:',
      choices: configResult.profiles.map((p) => ({
        title: `${p.name} (${p.region})`,
        value: p.name,
        description: p.keyFileValid ? '✓ Key file found' : '✗ Key file missing',
      })),
    });
    selectedProfileName = profile;
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
      const { continueAnyway } = await prompts({
        type: 'confirm',
        name: 'continueAnyway',
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
  options: CLIOptions,
  log: ReturnType<typeof createLogger>
): Promise<OCIProfile | undefined> {
  log.log(chalk.yellow('⚠️  OCI configuration not found at ~/.oci/config\n'));

  const { setupMethod } = await prompts({
    type: 'select',
    name: 'setupMethod',
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
  return await manualConfigurationFlow(log);
}

/**
 * Manual configuration flow - collect all OCI credentials
 */
async function manualConfigurationFlow(
  log: ReturnType<typeof createLogger>
): Promise<OCIProfile | undefined> {
  log.log(chalk.bold('\n📝 Manual OCI Configuration\n'));
  log.log('You will need the following information from the OCI Console:\n');
  log.log('  • User OCID (Identity > Users > Your User)');
  log.log('  • Tenancy OCID (Administration > Tenancy Details)');
  log.log('  • API Key Fingerprint (Identity > Users > API Keys)');
  log.log('  • Private key file path\n');

  // Collect user OCID
  const { userOcid } = await prompts({
    type: 'text',
    name: 'userOcid',
    message: 'Enter your User OCID:',
    validate: (value) => {
      if (!value) return 'User OCID is required';
      if (!isValidOCID(value, 'user')) return 'Invalid User OCID format (should start with ocid1.user.)';
      return true;
    },
  });

  if (!userOcid) return undefined;

  // Collect tenancy OCID
  const { tenancyOcid } = await prompts({
    type: 'text',
    name: 'tenancyOcid',
    message: 'Enter your Tenancy OCID:',
    validate: (value) => {
      if (!value) return 'Tenancy OCID is required';
      if (!isValidOCID(value, 'tenancy')) return 'Invalid Tenancy OCID format (should start with ocid1.tenancy.)';
      return true;
    },
  });

  if (!tenancyOcid) return undefined;

  // Collect fingerprint
  const { fingerprint } = await prompts({
    type: 'text',
    name: 'fingerprint',
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
  const { keyFilePath } = await prompts({
    type: 'text',
    name: 'keyFilePath',
    message: 'Enter path to your private key file:',
    initial: defaultKeyPath,
    validate: (value) => {
      if (!value) return 'Key file path is required';
      const expandedPath = value.startsWith('~')
        ? path.join(os.homedir(), value.slice(1))
        : value;
      if (!fs.existsSync(expandedPath)) {
        return `File not found: ${expandedPath}`;
      }
      return true;
    },
  });

  if (!keyFilePath) return undefined;

  // Select region
  const { region } = await prompts({
    type: 'select',
    name: 'region',
    message: 'Select your OCI region:',
    choices: OCI_REGIONS.map((r) => ({
      title: `${r.name} (${r.id})`,
      value: r.id,
    })),
  });

  if (!region) return undefined;

  // Profile name
  const { profileName } = await prompts({
    type: 'text',
    name: 'profileName',
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

/**
 * Get compartment ID - try auto-discovery first, fall back to manual
 */
async function getCompartmentId(
  profileName: string,
  options: CLIOptions,
  log: ReturnType<typeof createLogger>
): Promise<string | undefined> {
  // Try to auto-discover compartments
  const compartmentSpinner = ora('Discovering compartments...').start();

  try {
    const compartments = await discoverCompartments(profileName);
    compartmentSpinner.succeed(`Found ${compartments.length} compartment(s)`);

    const { compartment } = await prompts({
      type: 'select',
      name: 'compartment',
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
      return await getManualCompartmentId(log);
    }

    return compartment;
  } catch (error) {
    compartmentSpinner.fail('Could not auto-discover compartments');
    log.log(chalk.yellow(`\nThis usually means the credentials couldn't connect to OCI API.`));
    log.log(chalk.yellow(`You can still enter a compartment OCID manually.\n`));

    return await getManualCompartmentId(log);
  }
}

/**
 * Get compartment ID manually
 */
async function getManualCompartmentId(
  log: ReturnType<typeof createLogger>
): Promise<string | undefined> {
  log.log('\n💡 Find your Compartment OCID in OCI Console:');
  log.log('   Identity > Compartments > [Your Compartment] > OCID\n');

  const { compartmentId } = await prompts({
    type: 'text',
    name: 'compartmentId',
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

/**
 * Select models to enable
 */
async function selectModels(
  options: CLIOptions,
  log: ReturnType<typeof createLogger>
): Promise<string[]> {
  const allModels = getAllModels();

  // Group models by family for better presentation
  const modelChoices = [
    { title: '── Grok (xAI) ──', value: '', disabled: true },
    { title: 'xai.grok-4-maverick (Fast, 131K)', value: 'xai.grok-4-maverick', selected: true },
    { title: 'xai.grok-4-scout (131K)', value: 'xai.grok-4-scout', selected: false },
    { title: 'xai.grok-3 (131K)', value: 'xai.grok-3', selected: false },
    { title: '── Llama (Meta) ──', value: '', disabled: true },
    { title: 'meta.llama-3.3-70b-instruct (131K)', value: 'meta.llama-3.3-70b-instruct', selected: true },
    { title: 'meta.llama-3.2-vision-90b-instruct (Vision, 131K)', value: 'meta.llama-3.2-vision-90b-instruct', selected: false },
    { title: 'meta.llama-3.1-405b-instruct (131K)', value: 'meta.llama-3.1-405b-instruct', selected: false },
    { title: '── Command (Cohere) ──', value: '', disabled: true },
    { title: 'cohere.command-plus-latest (131K)', value: 'cohere.command-plus-latest', selected: false },
    { title: 'cohere.command-latest (131K)', value: 'cohere.command-latest', selected: false },
    { title: 'cohere.command-a-vision (Vision, 131K)', value: 'cohere.command-a-vision', selected: false },
    { title: '── Gemini (Google) ──', value: '', disabled: true },
    { title: 'google.gemini-2.5-pro (Vision, 1M)', value: 'google.gemini-2.5-pro', selected: false },
    { title: 'google.gemini-2.5-flash (Vision, 1M)', value: 'google.gemini-2.5-flash', selected: false },
    { title: '── Quick Options ──', value: '', disabled: true },
    { title: '✓ Select ALL models', value: 'all', selected: false },
  ];

  const { selectedModels } = await prompts({
    type: 'multiselect',
    name: 'selectedModels',
    message: 'Select models to enable (space to select, enter to confirm):',
    choices: modelChoices.filter((c) => !c.disabled),
    min: 1,
    hint: '- Space to select, Enter to confirm',
  });

  if (!selectedModels || selectedModels.length === 0) {
    return [];
  }

  // Handle "all" selection
  if (selectedModels.includes('all')) {
    return allModels.map((m) => m.id);
  }

  return selectedModels.filter((m: string) => m !== '');
}

/**
 * Install the OpenCode OCI package
 */
async function installPackage(log: ReturnType<typeof createLogger>): Promise<void> {
  const opencodeDir = path.join(os.homedir(), '.config/opencode');
  const installSpinner = ora('Installing @acedergren/opencode-oci-genai...').start();

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
    execFileSync('npm', ['install', '@acedergren/opencode-oci-genai'], {
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
    log.log(chalk.cyan(`  cd ~/.config/opencode && npm install @acedergren/opencode-oci-genai\n`));
  }
}

/**
 * Generate opencode.json configuration
 */
async function generateConfig(
  profileName: string,
  compartmentId: string,
  selectedModels: string[],
  log: ReturnType<typeof createLogger>
): Promise<void> {
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
          output: 8192,
        },
      };
    }
  }

  // Build the full OpenCode config
  const openCodeConfig = {
    $schema: 'https://opencode.ai/config.json',
    provider: {
      'oci-genai': {
        npm: '@acedergren/opencode-oci-genai',
        name: 'OCI GenAI',
        options: {
          compartmentId,
          configProfile: profileName,
        },
        models: modelConfig,
      },
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

    // Check if config already exists
    if (fs.existsSync(configPath)) {
      configSpinner.stop();

      const { overwrite } = await prompts({
        type: 'confirm',
        name: 'overwrite',
        message: 'opencode.json already exists. Overwrite?',
        initial: true,
      });

      if (!overwrite) {
        log.log(chalk.yellow('\nConfiguration not saved. You can manually add the OCI provider config.\n'));
        return;
      }

      configSpinner.start('Generating opencode.json...');
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
function showSuccessMessage(
  selectedModels: string[],
  log: ReturnType<typeof createLogger>
): void {
  log.log(chalk.bold.green('\n✓ Setup complete!\n'));

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

  log.log(chalk.gray('Tip: Run this wizard again anytime with: npx @acedergren/opencode-oci-setup\n'));
}
