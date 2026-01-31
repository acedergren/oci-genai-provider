'use strict';

var fs2 = require('fs');
var os2 = require('os');
var path2 = require('path');
var common = require('oci-common');
var identity = require('oci-identity');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var fs2__namespace = /*#__PURE__*/_interopNamespace(fs2);
var os2__namespace = /*#__PURE__*/_interopNamespace(os2);
var path2__namespace = /*#__PURE__*/_interopNamespace(path2);
var common__namespace = /*#__PURE__*/_interopNamespace(common);
var identity__namespace = /*#__PURE__*/_interopNamespace(identity);

// src/config/oci-config.ts
var DEFAULT_CONFIG_PATH = "~/.oci/config";
function expandPath(filePath) {
  if (!filePath) return filePath;
  if (filePath.startsWith("~")) {
    return path2__namespace.join(os2__namespace.homedir(), filePath.slice(1));
  }
  return filePath;
}
function getConfigPath() {
  return expandPath(process.env.OCI_CONFIG_FILE || DEFAULT_CONFIG_PATH);
}
function hasOCIConfig() {
  const configPath = getConfigPath();
  try {
    return fs2__namespace.existsSync(configPath) && fs2__namespace.statSync(configPath).size > 0;
  } catch {
    return false;
  }
}
function parseINI(content) {
  const result = {};
  let currentSection = "";
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith(";")) {
      continue;
    }
    const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      result[currentSection] = {};
      continue;
    }
    const kvMatch = trimmed.match(/^([^=]+)=(.*)$/);
    if (kvMatch && currentSection) {
      const key = kvMatch[1].trim();
      const value = kvMatch[2].trim();
      result[currentSection][key] = value;
    }
  }
  return result;
}
function parseOCIConfig(configPath) {
  const resolvedPath = configPath ? expandPath(configPath) : getConfigPath();
  if (!fs2__namespace.existsSync(resolvedPath)) {
    return {
      found: false,
      path: resolvedPath,
      profiles: [],
      error: `Config file not found at ${resolvedPath}`
    };
  }
  try {
    const content = fs2__namespace.readFileSync(resolvedPath, "utf-8");
    const parsed = parseINI(content);
    const profiles = Object.entries(parsed).map(([name, values]) => {
      const keyFile = expandPath(values.key_file || "");
      const keyFileValid = keyFile ? fs2__namespace.existsSync(keyFile) : false;
      return {
        name,
        region: values.region || "",
        user: values.user || "",
        tenancy: values.tenancy || "",
        fingerprint: values.fingerprint || "",
        keyFile,
        keyFileValid
      };
    });
    return {
      found: true,
      path: resolvedPath,
      profiles
    };
  } catch (error) {
    return {
      found: false,
      path: resolvedPath,
      profiles: [],
      error: `Failed to parse config: ${error instanceof Error ? error.message : "Unknown error"}`
    };
  }
}
function getProfile(profileName = "DEFAULT") {
  const result = parseOCIConfig();
  if (!result.found) return void 0;
  return result.profiles.find((p) => p.name === profileName);
}
async function validateCredentials(profileName = "DEFAULT", timeoutMs = 1e4) {
  try {
    const authProvider = new common__namespace.ConfigFileAuthenticationDetailsProvider(
      void 0,
      // Use default config path
      profileName
    );
    const identityClient = new identity__namespace.IdentityClient({
      authenticationDetailsProvider: authProvider
    });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const userId = await authProvider.getUser();
      const response = await identityClient.getUser({ userId });
      clearTimeout(timeoutId);
      return {
        valid: true,
        userName: response.user.name,
        userEmail: response.user.email
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("NotAuthenticated")) {
      return {
        valid: false,
        error: "Authentication failed. Check your API key and fingerprint."
      };
    }
    if (message.includes("timeout") || message.includes("abort")) {
      return {
        valid: false,
        error: "Connection timeout. Check network and OCI endpoint accessibility."
      };
    }
    if (message.includes("key_file") || message.includes("key file")) {
      return {
        valid: false,
        error: "Private key file not found or not readable."
      };
    }
    return {
      valid: false,
      error: `Validation failed: ${message}`
    };
  }
}
async function discoverCompartments(profileName = "DEFAULT", includeRoot = true) {
  const authProvider = new common__namespace.ConfigFileAuthenticationDetailsProvider(void 0, profileName);
  const identityClient = new identity__namespace.IdentityClient({
    authenticationDetailsProvider: authProvider
  });
  const tenancyId = await authProvider.getTenantId();
  const compartments = [];
  if (includeRoot) {
    const tenancy = await identityClient.getTenancy({ tenancyId });
    compartments.push({
      id: tenancyId,
      name: tenancy.tenancy.name || "root",
      description: "Root compartment (tenancy)",
      lifecycleState: "ACTIVE"
    });
  }
  const response = await identityClient.listCompartments({
    compartmentId: tenancyId,
    compartmentIdInSubtree: true,
    lifecycleState: "ACTIVE"
  });
  for (const compartment of response.items) {
    compartments.push({
      id: compartment.id,
      name: compartment.name,
      description: compartment.description,
      lifecycleState: compartment.lifecycleState
    });
  }
  return compartments;
}
var OCI_REGIONS = [
  { id: "eu-frankfurt-1", name: "Germany Central (Frankfurt)" },
  { id: "eu-stockholm-1", name: "Sweden Central (Stockholm)" },
  { id: "us-ashburn-1", name: "US East (Ashburn)" },
  { id: "us-chicago-1", name: "US Midwest (Chicago)" },
  { id: "us-phoenix-1", name: "US West (Phoenix)" },
  { id: "uk-london-1", name: "UK South (London)" },
  { id: "ap-tokyo-1", name: "Japan East (Tokyo)" },
  { id: "ap-osaka-1", name: "Japan Central (Osaka)" },
  { id: "ap-mumbai-1", name: "India West (Mumbai)" },
  { id: "ap-sydney-1", name: "Australia East (Sydney)" },
  { id: "ap-melbourne-1", name: "Australia Southeast (Melbourne)" },
  { id: "ca-toronto-1", name: "Canada Southeast (Toronto)" },
  { id: "ca-montreal-1", name: "Canada Northeast (Montreal)" },
  { id: "sa-saopaulo-1", name: "Brazil East (S\xE3o Paulo)" },
  { id: "me-dubai-1", name: "UAE East (Dubai)" },
  { id: "me-jeddah-1", name: "Saudi Arabia West (Jeddah)" }
];
function ensureOCIDirectory() {
  const ociDir = path2__namespace.join(os2__namespace.homedir(), ".oci");
  if (!fs2__namespace.existsSync(ociDir)) {
    fs2__namespace.mkdirSync(ociDir, { recursive: true, mode: 448 });
  }
  return ociDir;
}
function generateConfigContent(info) {
  return `[${info.profileName}]
user=${info.user}
fingerprint=${info.fingerprint}
key_file=${info.keyFilePath}
tenancy=${info.tenancy}
region=${info.region}
`;
}
function writeOCIConfig(info, append = false) {
  const ociDir = ensureOCIDirectory();
  const configPath = path2__namespace.join(ociDir, "config");
  const content = generateConfigContent(info);
  if (append && fs2__namespace.existsSync(configPath)) {
    fs2__namespace.appendFileSync(configPath, "\n" + content);
  } else {
    fs2__namespace.writeFileSync(configPath, content, { mode: 384 });
  }
}
function profileFromEnvironment() {
  const user = process.env.OCI_USER_OCID;
  const fingerprint = process.env.OCI_FINGERPRINT;
  const keyFile = process.env.OCI_KEY_FILE;
  const tenancy = process.env.OCI_TENANCY_OCID;
  const region = process.env.OCI_REGION;
  if (!user || !fingerprint || !keyFile || !tenancy || !region) {
    return void 0;
  }
  const expandedKeyFile = keyFile.startsWith("~") ? path2__namespace.join(os2__namespace.homedir(), keyFile.slice(1)) : keyFile;
  return {
    name: "ENV",
    user,
    fingerprint,
    keyFile: expandedKeyFile,
    keyFileValid: fs2__namespace.existsSync(expandedKeyFile),
    tenancy,
    region
  };
}
function getSetupInstructions() {
  return `
To use OCI GenAI, you need OCI credentials configured.

Option 1: Install OCI CLI (Recommended)
  1. Install: https://docs.oracle.com/iaas/Content/API/SDKDocs/cliinstall.htm
  2. Run: oci setup config
  3. Re-run this setup tool

Option 2: Manual Configuration
  1. Create an API key in OCI Console (Identity > Users > Your User > API Keys)
  2. Download the private key
  3. Note your User OCID, Tenancy OCID, and Fingerprint
  4. Create ~/.oci/config with these values

Option 3: Environment Variables
  Set these in your shell:
    export OCI_USER_OCID=ocid1.user.oc1..aaaa...
    export OCI_FINGERPRINT=aa:bb:cc:...
    export OCI_KEY_FILE=~/.oci/oci_api_key.pem
    export OCI_TENANCY_OCID=ocid1.tenancy.oc1..aaaa...
    export OCI_REGION=eu-frankfurt-1
    export OCI_COMPARTMENT_ID=ocid1.compartment.oc1..aaaa...
`;
}
function isValidOCID(ocid, type) {
  const basicPattern = /^ocid1\.[a-z]+\.[a-z0-9]+\..+$/;
  if (!basicPattern.test(ocid)) {
    return false;
  }
  if (type) {
    const parts = ocid.split(".");
    if (parts.length < 3) {
      return false;
    }
    const ocidType = parts[1];
    return ocidType === type;
  }
  return true;
}
function getRegionName(regionId) {
  const region = OCI_REGIONS.find((r) => r.id === regionId);
  return region?.name || regionId;
}

exports.OCI_REGIONS = OCI_REGIONS;
exports.discoverCompartments = discoverCompartments;
exports.ensureOCIDirectory = ensureOCIDirectory;
exports.expandPath = expandPath;
exports.generateConfigContent = generateConfigContent;
exports.getConfigPath = getConfigPath;
exports.getProfile = getProfile;
exports.getRegionName = getRegionName;
exports.getSetupInstructions = getSetupInstructions;
exports.hasOCIConfig = hasOCIConfig;
exports.isValidOCID = isValidOCID;
exports.parseOCIConfig = parseOCIConfig;
exports.profileFromEnvironment = profileFromEnvironment;
exports.validateCredentials = validateCredentials;
exports.writeOCIConfig = writeOCIConfig;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map