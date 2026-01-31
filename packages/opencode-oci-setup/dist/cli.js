#!/usr/bin/env node

// src/cli.ts
import { program } from "commander";
import chalk5 from "chalk";

// src/utils/logger.ts
function createLogger(quiet) {
  return {
    log: quiet ? () => {
    } : console.log,
    error: console.error,
    warn: quiet ? () => {
    } : console.warn
  };
}

// src/flows/profile.ts
import chalk from "chalk";
import ora from "ora";
import open from "open";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  parseOCIConfig,
  hasOCIConfig,
  validateCredentials,
  OCI_REGIONS,
  writeOCIConfig,
  isValidOCID
} from "@acedergren/oci-genai-provider/config";

// src/utils/prompts.ts
import prompts from "prompts";
async function select(options) {
  const result = await prompts({
    type: "select",
    name: "value",
    message: options.message,
    choices: options.choices.map((c) => ({
      title: c.title,
      value: c.value,
      description: c.description,
      disabled: c.disabled
    }))
  });
  return result.value;
}
async function text(options) {
  const result = await prompts({
    type: "text",
    name: "value",
    message: options.message,
    initial: options.initial,
    validate: options.validate
  });
  return result.value;
}
async function confirm(options) {
  const result = await prompts({
    type: "confirm",
    name: "value",
    message: options.message,
    initial: options.initial ?? false
  });
  return result.value ?? false;
}
async function multiselect(options) {
  const result = await prompts({
    type: "multiselect",
    name: "values",
    message: options.message,
    choices: options.choices.filter((c) => !c.disabled).map((c) => ({
      title: c.title,
      value: c.value,
      description: c.description,
      selected: c.selected
    })),
    min: options.min,
    hint: options.hint
  });
  return result.values ?? [];
}

// src/flows/profile.ts
async function checkExistingSetup(options, log) {
  const configPath = path.join(os.homedir(), ".config/opencode/opencode.json");
  if (!fs.existsSync(configPath)) {
    return { mode: "fresh" };
  }
  let existingConfig;
  try {
    existingConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch {
    return { mode: "fresh" };
  }
  const hasOCIProvider = !!existingConfig?.provider?.["oci-genai"];
  if (!hasOCIProvider) {
    log.log(chalk.yellow("\u{1F4CB} Existing opencode.json found (without OCI GenAI)\n"));
    return { mode: "fresh", existingConfig };
  }
  log.log(chalk.yellow("\u{1F4CB} Existing OCI GenAI configuration found!\n"));
  if (options.yes) {
    return { mode: "fresh", existingConfig };
  }
  const setupMode = await select({
    message: "How would you like to proceed?",
    choices: [
      {
        title: "Start fresh",
        value: "fresh",
        description: "Replace existing OCI GenAI config (other providers preserved)"
      },
      {
        title: "Modify current setup",
        value: "modify",
        description: "Add/remove models, change settings"
      },
      {
        title: "Cancel",
        value: "cancel",
        description: "Keep existing configuration"
      }
    ]
  });
  return { mode: setupMode ?? "cancel", existingConfig };
}
async function getProfile(options, log) {
  if (hasOCIConfig()) {
    return handleExistingConfig(options, log);
  }
  return handleMissingConfig(options, log);
}
async function handleExistingConfig(options, log) {
  const configResult = parseOCIConfig();
  if (!configResult.found || configResult.profiles.length === 0) {
    log.log(chalk.yellow("\u26A0\uFE0F  OCI config file is empty or invalid\n"));
    return handleMissingConfig(options, log);
  }
  log.log(chalk.green(`\u2713 Found OCI config with ${configResult.profiles.length} profile(s)
`));
  let selectedProfileName = options.profile;
  if (!selectedProfileName) {
    selectedProfileName = await select({
      message: "Select OCI profile:",
      choices: configResult.profiles.map((p) => ({
        title: `${p.name} (${p.region})`,
        value: p.name,
        description: p.keyFileValid ? "\u2713 Key file found" : "\u2717 Key file missing"
      }))
    });
  }
  if (!selectedProfileName) {
    return void 0;
  }
  const profile = configResult.profiles.find((p) => p.name === selectedProfileName);
  if (!profile) {
    log.error(chalk.red(`Profile "${selectedProfileName}" not found.`));
    return void 0;
  }
  log.log(`
Using profile: ${chalk.cyan(profile.name)} (${profile.region})`);
  const validateSpinner = ora("Validating OCI credentials...").start();
  const validation = await validateCredentials(selectedProfileName);
  if (validation.valid) {
    validateSpinner.succeed(`Credentials valid (${validation.userName})`);
  } else {
    validateSpinner.fail(`Validation failed: ${validation.error}`);
    if (!options.yes) {
      const continueAnyway = await confirm({
        message: "Continue anyway?",
        initial: false
      });
      if (!continueAnyway) {
        return void 0;
      }
    }
  }
  return profile;
}
async function handleMissingConfig(_options, log) {
  log.log(chalk.yellow("\u26A0\uFE0F  OCI configuration not found at ~/.oci/config\n"));
  const setupMethod = await select({
    message: "How would you like to configure OCI credentials?",
    choices: [
      {
        title: "Enter credentials manually",
        value: "manual",
        description: "I have my OCI API key details ready"
      },
      {
        title: "Install OCI CLI first (recommended for beginners)",
        value: "oci-cli",
        description: "Opens setup guide in browser"
      },
      {
        title: "Exit",
        value: "exit"
      }
    ]
  });
  if (setupMethod === "oci-cli") {
    log.log("\n\u{1F4D6} Opening OCI CLI setup guide...\n");
    const url = "https://docs.oracle.com/iaas/Content/API/SDKDocs/cliinstall.htm";
    try {
      await open(url);
    } catch {
      log.log(`Please visit: ${chalk.cyan(url)}`);
    }
    log.log("After completing OCI CLI setup, re-run: npx @acedergren/opencode-oci-setup\n");
    return void 0;
  }
  if (setupMethod === "exit") {
    return void 0;
  }
  return manualConfigurationFlow(log);
}
async function manualConfigurationFlow(log) {
  log.log(chalk.bold("\n\u{1F4DD} Manual OCI Configuration\n"));
  log.log("You will need the following information from the OCI Console:\n");
  log.log("  \u2022 User OCID (Identity > Users > Your User)");
  log.log("  \u2022 Tenancy OCID (Administration > Tenancy Details)");
  log.log("  \u2022 API Key Fingerprint (Identity > Users > API Keys)");
  log.log("  \u2022 Private key file path\n");
  const userOcid = await text({
    message: "Enter your User OCID:",
    validate: (value) => {
      if (!value) return "User OCID is required";
      if (!isValidOCID(value, "user"))
        return "Invalid User OCID format (should start with ocid1.user.)";
      return true;
    }
  });
  if (!userOcid) return void 0;
  const tenancyOcid = await text({
    message: "Enter your Tenancy OCID:",
    validate: (value) => {
      if (!value) return "Tenancy OCID is required";
      if (!isValidOCID(value, "tenancy"))
        return "Invalid Tenancy OCID format (should start with ocid1.tenancy.)";
      return true;
    }
  });
  if (!tenancyOcid) return void 0;
  const fingerprint = await text({
    message: "Enter your API Key Fingerprint (aa:bb:cc:...):",
    validate: (value) => {
      if (!value) return "Fingerprint is required";
      if (!/^[a-f0-9]{2}(:[a-f0-9]{2}){15}$/i.test(value)) {
        return "Invalid fingerprint format (should be aa:bb:cc:...)";
      }
      return true;
    }
  });
  if (!fingerprint) return void 0;
  const defaultKeyPath = path.join(os.homedir(), ".oci/oci_api_key.pem");
  const keyFilePath = await text({
    message: "Enter path to your private key file:",
    initial: defaultKeyPath,
    validate: (value) => {
      if (!value) return "Key file path is required";
      const expandedPath = value.startsWith("~") ? path.join(os.homedir(), value.slice(1)) : value;
      if (!fs.existsSync(expandedPath)) {
        return `File not found: ${expandedPath}`;
      }
      return true;
    }
  });
  if (!keyFilePath) return void 0;
  const region = await select({
    message: "Select your OCI region:",
    choices: OCI_REGIONS.map((r) => ({
      title: `${r.name} (${r.id})`,
      value: r.id
    }))
  });
  if (!region) return void 0;
  const profileName = await text({
    message: "Enter a name for this profile:",
    initial: "DEFAULT",
    validate: (value) => value ? true : "Profile name is required"
  });
  if (!profileName) return void 0;
  const writeSpinner = ora("Writing OCI config file...").start();
  try {
    const setupInfo = {
      user: userOcid,
      tenancy: tenancyOcid,
      fingerprint,
      keyFilePath,
      region,
      profileName
    };
    writeOCIConfig(setupInfo, false);
    writeSpinner.succeed(`OCI config saved to ~/.oci/config`);
    const expandedKeyPath = keyFilePath.startsWith("~") ? path.join(os.homedir(), keyFilePath.slice(1)) : keyFilePath;
    return {
      name: profileName,
      region,
      user: userOcid,
      tenancy: tenancyOcid,
      fingerprint,
      keyFile: expandedKeyPath,
      keyFileValid: fs.existsSync(expandedKeyPath)
    };
  } catch (error) {
    writeSpinner.fail("Failed to write OCI config");
    log.error(chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`));
    return void 0;
  }
}

// src/flows/compartment.ts
import chalk2 from "chalk";
import ora2 from "ora";
import { discoverCompartments, isValidOCID as isValidOCID2 } from "@acedergren/oci-genai-provider/config";
async function getCompartmentId(profileName, options, log) {
  if (options.compartment) {
    return options.compartment;
  }
  const compartmentSpinner = ora2("Discovering compartments...").start();
  try {
    const compartments = await discoverCompartments(profileName);
    compartmentSpinner.succeed(`Found ${compartments.length} compartment(s)`);
    const compartment = await select({
      message: "Select compartment for GenAI API calls:",
      choices: [
        ...compartments.map((c) => ({
          title: c.name,
          value: c.id,
          description: c.description || c.id.substring(0, 40) + "..."
        })),
        {
          title: "\u{1F4DD} Enter OCID manually",
          value: "manual"
        }
      ]
    });
    if (compartment === "manual") {
      return getManualCompartmentId(log);
    }
    return compartment;
  } catch {
    compartmentSpinner.fail("Could not auto-discover compartments");
    log.log(chalk2.yellow(`
This usually means the credentials couldn't connect to OCI API.`));
    log.log(chalk2.yellow(`You can still enter a compartment OCID manually.
`));
    return getManualCompartmentId(log);
  }
}
async function getManualCompartmentId(log) {
  log.log("\n\u{1F4A1} Find your Compartment OCID in OCI Console:");
  log.log("   Identity > Compartments > [Your Compartment] > OCID\n");
  const compartmentId = await text({
    message: "Enter Compartment OCID:",
    validate: (value) => {
      if (!value) return "Compartment OCID is required";
      if (!isValidOCID2(value, "compartment") && !isValidOCID2(value, "tenancy")) {
        return "Invalid OCID format (should start with ocid1.compartment. or ocid1.tenancy.)";
      }
      return true;
    }
  });
  return compartmentId;
}

// src/flows/models.ts
import chalk3 from "chalk";
import {
  getModelsByRegion,
  getAllModels,
  getCodingRecommendedModels
} from "@acedergren/oci-genai-provider";
var FAMILY_NAMES = {
  grok: "\u2500\u2500 Grok (xAI) \u2500\u2500",
  llama: "\u2500\u2500 Llama (Meta) \u2500\u2500",
  cohere: "\u2500\u2500 Command (Cohere) \u2500\u2500",
  gemini: "\u2500\u2500 Gemini (Google) \u2500\u2500",
  openai: "\u2500\u2500 GPT-OSS (OpenAI) \u2500\u2500"
};
async function askCodingOptimization(_options, log) {
  if (_options.yes) {
    return true;
  }
  log.log(chalk3.bold("\n\u{1F527} Model Optimization\n"));
  log.log("Coding-optimized settings tune models for better code generation:");
  log.log(chalk3.gray("  \u2022 Lower temperature (0.2) - More consistent, deterministic code"));
  log.log(chalk3.gray("  \u2022 Higher max tokens (8192) - Support longer code outputs"));
  log.log(chalk3.gray("  \u2022 Frequency penalty (0.1) - Reduce repetitive patterns\n"));
  return confirm({
    message: "Enable coding-optimized settings for all models?",
    initial: true
  });
}
async function selectModels(region, _options, log) {
  const regionModels = getModelsByRegion(region, false);
  const recommendedModels = getCodingRecommendedModels(region);
  const allModels = getAllModels();
  if (regionModels.length === 0) {
    log.log(chalk3.yellow(`
\u26A0\uFE0F  No on-demand models found for region ${region}`));
    log.log(chalk3.yellow("   This region may only support dedicated AI clusters.\n"));
    const useFallback = await confirm({
      message: "Show all models anyway? (may not work in this region)",
      initial: false
    });
    if (!useFallback) {
      return [];
    }
  }
  const modelsToShow = regionModels.length > 0 ? regionModels : allModels;
  const recommendedIds = new Set(recommendedModels.map((m) => m.id));
  const modelsByFamily = /* @__PURE__ */ new Map();
  for (const model of modelsToShow) {
    const family = model.family;
    if (!modelsByFamily.has(family)) {
      modelsByFamily.set(family, []);
    }
    modelsByFamily.get(family).push(model);
  }
  const modelChoices = [];
  for (const [family, models] of modelsByFamily) {
    const familyTitle = FAMILY_NAMES[family] || `\u2500\u2500 ${family} \u2500\u2500`;
    modelChoices.push({ title: familyTitle, value: "", disabled: true });
    for (const model of models) {
      const contextStr = model.contextWindow >= 1e6 ? `${Math.floor(model.contextWindow / 1e6)}M` : `${Math.floor(model.contextWindow / 1e3)}K`;
      const visionStr = model.capabilities.vision ? "\u{1F441} " : "";
      const toolsStr = model.capabilities.tools ? "" : "\u26A0\uFE0F no tools";
      const recommendedStr = recommendedIds.has(model.id) ? "\u2B50 " : "";
      const codingNote = model.codingNote;
      modelChoices.push({
        title: `${recommendedStr}${model.id} (${visionStr}${contextStr})${toolsStr ? " " + toolsStr : ""}`,
        value: model.id,
        selected: recommendedIds.has(model.id),
        description: codingNote
      });
    }
  }
  modelChoices.push({ title: "\u2500\u2500 Quick Options \u2500\u2500", value: "", disabled: true });
  modelChoices.push({
    title: "\u2713 Select ALL models with tool support",
    value: "all-tools",
    selected: false
  });
  modelChoices.push({ title: "\u2713 Select ALL models", value: "all", selected: false });
  const recommendedCount = recommendedModels.length;
  log.log(chalk3.gray(`
Showing ${modelsToShow.length} models available in ${region}`));
  log.log(chalk3.cyan(`\u2B50 = Recommended for coding (${recommendedCount} pre-selected)
`));
  const selectedModels = await multiselect({
    message: "Select models to enable (space to select, enter to confirm):",
    choices: modelChoices,
    min: 1,
    hint: "- Space to select, Enter to confirm"
  });
  if (selectedModels.length === 0) {
    return [];
  }
  if (selectedModels.includes("all")) {
    return modelsToShow.map((m) => m.id);
  }
  if (selectedModels.includes("all-tools")) {
    return modelsToShow.filter((m) => m.capabilities.tools).map((m) => m.id);
  }
  return selectedModels.filter((m) => m !== "");
}

// src/flows/config.ts
import chalk4 from "chalk";
import ora3 from "ora";
import * as fs2 from "fs";
import * as os2 from "os";
import * as path2 from "path";
import { execFileSync } from "child_process";
import { getAllModels as getAllModels2 } from "@acedergren/oci-genai-provider";

// src/types.ts
var CODING_SETTINGS = {
  temperature: 0.2,
  // More deterministic, consistent code
  maxTokens: 8192,
  // Support longer code outputs
  frequencyPenalty: 0.1
  // Reduce repetitive patterns
};

// src/flows/config.ts
function installPackage(log) {
  const opencodeDir = path2.join(os2.homedir(), ".config/opencode");
  const installSpinner = ora3("Installing @acedergren/opencode-oci-genai...").start();
  try {
    if (!fs2.existsSync(opencodeDir)) {
      fs2.mkdirSync(opencodeDir, { recursive: true });
    }
    const packageJsonPath = path2.join(opencodeDir, "package.json");
    if (!fs2.existsSync(packageJsonPath)) {
      fs2.writeFileSync(packageJsonPath, JSON.stringify({ dependencies: {} }, null, 2));
    }
    execFileSync("npm", ["install", "@acedergren/opencode-oci-genai"], {
      cwd: opencodeDir,
      stdio: "pipe"
    });
    installSpinner.succeed("Package installed");
  } catch (error) {
    installSpinner.fail("Installation failed");
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    if (errorMessage.includes("npm")) {
      log.error(chalk4.red("\nMake sure npm is installed and in your PATH."));
    } else {
      log.error(chalk4.red(`
Error: ${errorMessage}`));
    }
    log.log(chalk4.yellow("\nYou can install manually:"));
    log.log(chalk4.cyan(`  cd ~/.config/opencode && npm install @acedergren/opencode-oci-genai
`));
  }
}
function generateConfig(profileName, compartmentId, selectedModels, enableCodingOptimization, existingConfig, log) {
  const configSpinner = ora3("Generating opencode.json...").start();
  const allModels = getAllModels2();
  const modelConfig = {};
  for (const modelId of selectedModels) {
    const meta = allModels.find((m) => m.id === modelId);
    if (meta) {
      modelConfig[modelId] = {
        name: meta.name,
        ...meta.capabilities.vision && { attachment: true },
        limit: {
          context: meta.contextWindow,
          output: enableCodingOptimization ? CODING_SETTINGS.maxTokens : 8192
        },
        // Add coding-optimized settings if enabled
        ...enableCodingOptimization && {
          settings: {
            temperature: CODING_SETTINGS.temperature,
            frequencyPenalty: CODING_SETTINGS.frequencyPenalty
          }
        }
      };
    }
  }
  const ociProviderConfig = {
    npm: "@acedergren/opencode-oci-genai",
    name: "OCI GenAI",
    options: {
      compartmentId,
      configProfile: profileName
    },
    models: modelConfig
  };
  const existingProviders = existingConfig?.provider || {};
  const openCodeConfig = {
    $schema: "https://opencode.ai/config.json",
    // Preserve other top-level settings from existing config
    ...existingConfig && {
      ...Object.fromEntries(
        Object.entries(existingConfig).filter(([key]) => key !== "$schema" && key !== "provider")
      )
    },
    provider: {
      // Preserve other providers (e.g., anthropic, openai)
      ...Object.fromEntries(
        Object.entries(existingProviders).filter(([key]) => key !== "oci-genai")
      ),
      // Add/replace OCI GenAI provider
      "oci-genai": ociProviderConfig
    }
  };
  const opencodeDir = path2.join(os2.homedir(), ".config/opencode");
  const configPath = path2.join(opencodeDir, "opencode.json");
  try {
    if (!fs2.existsSync(opencodeDir)) {
      fs2.mkdirSync(opencodeDir, { recursive: true });
    }
    fs2.writeFileSync(configPath, JSON.stringify(openCodeConfig, null, 2));
    configSpinner.succeed(`Configuration saved to ${configPath}`);
  } catch (error) {
    configSpinner.fail("Failed to write configuration");
    log.error(chalk4.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`));
  }
}
function showSuccessMessage(selectedModels, enableCodingOptimization, log) {
  log.log(chalk4.bold.green("\n\u2713 Setup complete!\n"));
  if (enableCodingOptimization) {
    log.log(chalk4.cyan("\u{1F527} Coding optimization: ENABLED"));
    log.log(chalk4.gray("   \u2022 temperature: 0.2 (deterministic)"));
    log.log(chalk4.gray("   \u2022 maxTokens: 8192 (long outputs)"));
    log.log(chalk4.gray("   \u2022 frequencyPenalty: 0.1 (reduce repetition)\n"));
  } else {
    log.log(chalk4.gray("\u{1F527} Coding optimization: disabled (using defaults)\n"));
  }
  log.log("Next steps:");
  log.log(`  1. Start OpenCode: ${chalk4.cyan("opencode")}`);
  log.log(`  2. Select provider: ${chalk4.cyan("/provider oci-genai")}`);
  log.log(`  3. Select model: ${chalk4.cyan("/model <model-name>")}`);
  log.log("  4. Start chatting!\n");
  log.log("Enabled models:");
  for (const modelId of selectedModels.slice(0, 5)) {
    log.log(`  ${chalk4.green("\u2713")} ${modelId}`);
  }
  if (selectedModels.length > 5) {
    log.log(`  ${chalk4.gray(`... and ${selectedModels.length - 5} more`)}`);
  }
  log.log("");
  log.log(
    chalk4.gray("Tip: Run this wizard again anytime with: npx @acedergren/opencode-oci-setup\n")
  );
}

// src/cli.ts
var VERSION = "0.1.0";
program.name("opencode-oci-setup").description("Setup wizard for OCI GenAI provider in OpenCode").version(VERSION).option("-p, --profile <name>", "OCI profile name").option("-c, --compartment <ocid>", "Compartment OCID").option("-y, --yes", "Skip confirmations").option("-q, --quiet", "Minimal output").action(main);
program.parse();
async function main(options) {
  const log = createLogger(options.quiet ?? false);
  log.log(chalk5.bold.blue("\n\u{1F527} OpenCode OCI GenAI Setup\n"));
  const { mode, existingConfig } = await checkExistingSetup(options, log);
  if (mode === "cancel") {
    log.log(chalk5.gray("\nSetup cancelled. Your existing configuration is unchanged.\n"));
    process.exit(0);
  }
  if (mode === "modify") {
    log.log(chalk5.cyan("\n\u{1F4DD} Modifying existing configuration...\n"));
  }
  const profile = await getProfile(options, log);
  if (!profile) {
    log.error(chalk5.red("Setup cancelled."));
    process.exit(1);
  }
  const compartmentId = await getCompartmentId(profile.name, options, log);
  if (!compartmentId) {
    log.error(chalk5.red("No compartment selected. Exiting."));
    process.exit(1);
  }
  const selectedModels = await selectModels(profile.region, options, log);
  if (selectedModels.length === 0) {
    log.error(chalk5.red("No models selected. Exiting."));
    process.exit(1);
  }
  const enableCodingOptimization = await askCodingOptimization(options, log);
  installPackage(log);
  generateConfig(
    profile.name,
    compartmentId,
    selectedModels,
    enableCodingOptimization,
    existingConfig,
    log
  );
  showSuccessMessage(selectedModels, enableCodingOptimization, log);
}
//# sourceMappingURL=cli.js.map