# OpenCode Configuration Guide

## Configuration File Locations

OpenCode uses a **precedence hierarchy** for configuration files:

1. **Remote config** (organizational defaults) - Lowest precedence
2. **Global config** (`~/.config/opencode/opencode.json`) - User-wide preferences
3. **Custom config** (via `OPENCODE_CONFIG` env var)
4. **Project config** (`<project>/opencode.json`) - **Highest precedence** ✅
5. `.opencode/` directories - Agents, commands, plugins
6. **Inline config** (via `OPENCODE_CONFIG_CONTENT` env var)

### ✅ Recommended Setup

**For local development: Use project-local `opencode.json`** (highest precedence)

### ❌ Common Mistakes

- **Wrong filename**: `config.json` instead of `opencode.json`
- **Wrong extension**: `opencode.jsonc` instead of `opencode.json`
- **Assuming global overrides project**: Project config has highest precedence!

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "oci-genai": {
      "npm": "@acedergren/opencode-oci-genai",
      "name": "OCI GenAI",
      "options": {
        "compartmentId": "ocid1.compartment.oc1..aaa...",
        "configProfile": "ASHBURN"
      },
      "models": {
        "xai.grok-3-fast": {
          "name": "Grok 3 Fast",
          "attachment": true,
          "limit": {
            "context": 131072,
            "output": 8192
          }
        }
      }
    }
  }
}
```

## Installation Steps

### 1. Install Provider Package

From OpenCode's config directory:

```bash
cd ~/.config/opencode
npm install @acedergren/opencode-oci-genai
```

Or for local development with tarball:

```bash
cd ~/.config/opencode
npm install /path/to/opencode-oci-genai/packages/opencode-oci-genai/acedergren-opencode-oci-genai-0.1.0.tgz
```

### 2. Add Provider to opencode.json

**Option A: Project-local configuration (Recommended for development)**

Edit `<project>/opencode.json` and add the provider configuration:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "oci-genai": {
      "npm": "@acedergren/opencode-oci-genai",
      "name": "OCI GenAI",
      "options": {
        "compartmentId": "ocid1.compartment.oc1...",
        "configProfile": "ASHBURN"
      },
      "models": {
        "xai.grok-3-fast": {
          "name": "Grok 3 Fast",
          "attachment": true,
          "limit": { "context": 131072, "output": 8192 }
        }
      }
    }
  }
}
```

**Option B: Global configuration (For user-wide preferences)**

Edit `~/.config/opencode/opencode.json` with the same provider configuration above.

**Note:** Project config overrides global config if both are present.

**Required fields:**
- `npm`: Package name (must match installed package)
- `options.compartmentId`: Your OCI compartment OCID
- `options.configProfile`: OCI config profile name (from `~/.oci/config`)

### 3. Restart OpenCode

After updating config.json, restart OpenCode:

```bash
opencode --model oci-genai/xai.grok-3-fast
```

## Available Models

Configure models in the `models` section. Tested models:

- **xai.grok-3-fast** - Fast Grok model (recommended)
- **xai.grok-code-fast-1** - Code-optimized Grok
- **xai.grok-3** - Standard Grok 3
- **google.gemini-2.5-flash** - Fast Gemini model
- **google.gemini-2.5-pro** - High-quality Gemini
- **meta.llama-3.3-70b-instruct** - Llama 3.3 (deprecated - use xai.grok-3-fast instead)

## Provider Options

### Required

```json
{
  "compartmentId": "ocid1.compartment.oc1...",
  "configProfile": "ASHBURN"
}
```

### Optional

```json
{
  "compartmentId": "ocid1.compartment.oc1...",
  "configProfile": "ASHBURN",
  "ragMode": "db",  // Enable database RAG
  "ragEndpoint": "https://...",  // RAG API endpoint
  "region": "us-ashburn-1"  // Override region
}
```

## Verification

Test your configuration:

```bash
# From OpenCode config directory
cd ~/.config/opencode

# Test provider import
node --input-type=module -e "
import pkg from '@acedergren/opencode-oci-genai';
const provider = pkg({
  configProfile: 'ASHBURN',
  compartmentId: 'ocid1.compartment.oc1...'
});
console.log('✅ Provider loads successfully');
"
```

## Troubleshooting

### ProviderInitError

**Symptoms:** `ProviderInitError: ProviderInitError` when starting OpenCode

**Causes:**
1. Provider not installed in `~/.config/opencode/node_modules/`
2. Wrong npm package name in config.json
3. Missing or incorrect compartment ID
4. OCI config file authentication issues

**Solutions:**
```bash
# 1. Verify provider is installed
ls ~/.config/opencode/node_modules/@acedergren/opencode-oci-genai

# 2. Reinstall if missing
cd ~/.config/opencode
npm install @acedergren/opencode-oci-genai

# 3. Verify OCI authentication
oci iam user get --user-id $(oci iam user list --query 'data[0].id' --raw-output)

# 4. Check config.json syntax
node -e "JSON.parse(require('fs').readFileSync(process.env.HOME + '/.config/opencode/config.json'))"
```

### Model Not Found (HTTP 404)

**Symptoms:** API returns "Entity with key <model-id> not found"

**Solution:** Use correct model ID. Replace deprecated models:
- ❌ `meta.llama-3.3-70b-instruct` → ✅ `xai.grok-3-fast`

### Network/DNS Errors

**Symptoms:** "fetch failed", "DNS resolution" errors

**Solution:** Disable OpenCode sandbox:
```bash
opencode
/sandbox disable
```

## Configuration File Hierarchy

```
# Global (user-wide preferences)
~/.config/opencode/
├── opencode.json        ← Global provider/MCP configs (lower precedence)
├── package.json         ← Installed packages
└── node_modules/
    └── @acedergren/
        └── opencode-oci-genai/  ← Provider package

# Project (highest precedence - RECOMMENDED)
<project>/
├── opencode.json        ← Project provider/MCP configs (OVERRIDES global)
└── .opencode/
    ├── plugins/         ← Project-specific plugins
    ├── agents/          ← Custom agents
    └── commands/        ← Custom commands
```

**Configuration precedence:** Project `opencode.json` > Global `~/.config/opencode/opencode.json` > Remote

## Related Documentation

- [IAM Policy Requirements](./IAM_POLICY_REQUIREMENTS.md) - Required OCI permissions
- [Provider README](./packages/opencode-oci-genai/README.md) - API usage guide
- [Test Results](./TEST_RESULTS_SUMMARY.md) - Live API verification

---

**Last Updated:** January 26, 2026
**Provider Version:** 0.1.0
