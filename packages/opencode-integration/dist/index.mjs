import { createOCI } from '@acedergren/oci-genai-provider';
export { OCIGenAIProvider, createOCI, getAllModels, getModelMetadata, getModelsByFamily, isValidModelId, oci } from '@acedergren/oci-genai-provider';
export { OCI_REGIONS, discoverCompartments, getProfile, getSetupInstructions, hasOCIConfig, isValidOCID, parseOCIConfig, validateCredentials } from '@acedergren/oci-genai-provider/config';

// src/index.ts
function createOpenCodeOCIProvider(options) {
  const config = {
    // Compartment ID is required for OCI GenAI API calls
    compartmentId: options.compartmentId || process.env.OCI_COMPARTMENT_ID,
    // Profile name - region and credentials come from ~/.oci/config
    profile: options.configProfile || process.env.OCI_CONFIG_PROFILE || "DEFAULT",
    // Region override (usually not needed, comes from profile)
    region: options.region || process.env.OCI_REGION,
    // Path to OCI config file
    configPath: process.env.OCI_CONFIG_FILE,
    // Always use config_file auth for OpenCode (OAuth planned for future)
    auth: "config_file"
  };
  if (!config.compartmentId) {
    throw new Error(
      `OCI compartmentId is required.

Set it in opencode.json:
  "options": { "compartmentId": "ocid1.compartment.oc1..." }

Or via environment variable:
  export OCI_COMPARTMENT_ID=ocid1.compartment.oc1...`
    );
  }
  const provider = createOCI(config);
  console.log("DEBUG: Provider created:", typeof provider, !!provider.models);
  if (provider.models) {
    console.log("DEBUG: Registered OCI models:", Object.keys(provider.models).join(", "));
  }
  const providerWithModels = {
    ...provider,
    models: provider.models
  };
  return providerWithModels;
}

export { createOpenCodeOCIProvider as default };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map