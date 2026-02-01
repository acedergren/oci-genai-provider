'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var ociGenaiProvider = require('@acedergren/oci-genai-provider');
var config = require('@acedergren/oci-genai-provider/config');

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
  const provider = ociGenaiProvider.createOCI(config);
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

Object.defineProperty(exports, "OCIGenAIProvider", {
  enumerable: true,
  get: function () { return ociGenaiProvider.OCIGenAIProvider; }
});
Object.defineProperty(exports, "createOCI", {
  enumerable: true,
  get: function () { return ociGenaiProvider.createOCI; }
});
Object.defineProperty(exports, "getAllModels", {
  enumerable: true,
  get: function () { return ociGenaiProvider.getAllModels; }
});
Object.defineProperty(exports, "getModelMetadata", {
  enumerable: true,
  get: function () { return ociGenaiProvider.getModelMetadata; }
});
Object.defineProperty(exports, "getModelsByFamily", {
  enumerable: true,
  get: function () { return ociGenaiProvider.getModelsByFamily; }
});
Object.defineProperty(exports, "isValidModelId", {
  enumerable: true,
  get: function () { return ociGenaiProvider.isValidModelId; }
});
Object.defineProperty(exports, "oci", {
  enumerable: true,
  get: function () { return ociGenaiProvider.oci; }
});
Object.defineProperty(exports, "OCI_REGIONS", {
  enumerable: true,
  get: function () { return config.OCI_REGIONS; }
});
Object.defineProperty(exports, "discoverCompartments", {
  enumerable: true,
  get: function () { return config.discoverCompartments; }
});
Object.defineProperty(exports, "getProfile", {
  enumerable: true,
  get: function () { return config.getProfile; }
});
Object.defineProperty(exports, "getSetupInstructions", {
  enumerable: true,
  get: function () { return config.getSetupInstructions; }
});
Object.defineProperty(exports, "hasOCIConfig", {
  enumerable: true,
  get: function () { return config.hasOCIConfig; }
});
Object.defineProperty(exports, "isValidOCID", {
  enumerable: true,
  get: function () { return config.isValidOCID; }
});
Object.defineProperty(exports, "parseOCIConfig", {
  enumerable: true,
  get: function () { return config.parseOCIConfig; }
});
Object.defineProperty(exports, "validateCredentials", {
  enumerable: true,
  get: function () { return config.validateCredentials; }
});
exports.default = createOpenCodeOCIProvider;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map