# OpenCode OCI GenAI Provider

Integrate Oracle Cloud Infrastructure Generative AI with [OpenCode](https://opencode.ai).

> **Published Version:** `@acedergren/opencode-oci-genai@0.1.0` on [GitHub Packages](https://github.com/acedergren/oci-genai-provider/packages)

## Features

- **19+ Language Models**: Access Grok, Llama, Cohere, and Gemini models through OCI
- **Auto-Discovery**: Uses `~/.oci/config` for credentials - no config duplication
- **Streaming Support**: Real-time token streaming for responsive chat
- **Vision Models**: Support for image attachments with Llama Vision and Gemini

## Quick Start

### 1. OpenCode Auto-Installation (Recommended)

OpenCode will automatically download and install this package when you add it to your configuration.

Alternatively, you can manually install it:

```bash
cd ~/.config/opencode
npm install @acedergren/opencode-oci-genai
```

**Note:** This package is published to the GitHub Packages registry. If you get a 404 error, ensure you have npm configured to access GitHub Packages:

```bash
npm config set @acedergren:registry https://npm.pkg.github.com
```

### 2. Configure OCI Credentials

Ensure you have OCI credentials configured:

```bash
# Check if OCI config exists
cat ~/.oci/config

# If not, set up OCI CLI
oci setup config
```

### 3. Set Environment Variables

```bash
# Add to ~/.bashrc or ~/.zshrc
export OCI_COMPARTMENT_ID=ocid1.compartment.oc1..aaaaaaa...
export OCI_CONFIG_PROFILE=DEFAULT  # or your profile name
```

### 4. Create Configuration

Create `~/.config/opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "oci-genai": {
      "npm": "@acedergren/opencode-oci-genai",
      "name": "OCI GenAI",
      "options": {
        "compartmentId": "{env:OCI_COMPARTMENT_ID}",
        "configProfile": "{env:OCI_CONFIG_PROFILE}"
      },
      "models": {
        "xai.grok-4": {
          "name": "Grok 4",
          "limit": { "context": 131072, "output": 8192 }
        },
        "meta.llama-3.3-70b-instruct": {
          "name": "Llama 3.3 70B",
          "limit": { "context": 131072, "output": 8192 }
        }
      }
    }
  }
}
```

### 5. Start OpenCode

```bash
opencode
# Select "OCI GenAI" provider
# Choose a model and start chatting!
```

## Configuration Options

| Option          | Required | Description                                            |
| --------------- | -------- | ------------------------------------------------------ |
| `compartmentId` | Yes      | OCI Compartment OCID for API calls                     |
| `configProfile` | No       | Profile name from `~/.oci/config` (default: `DEFAULT`) |
| `region`        | No       | Override region from profile (usually not needed)      |

## Available Models

### Grok (xAI)

- `xai.grok-4` - Base Grok 4
- `xai.grok-4-fast-reasoning` - Faster reasoning
- `xai.grok-4-fast-non-reasoning` - Faster non-reasoning
- `xai.grok-3` - Previous generation

### Llama (Meta)

- `meta.llama-3.3-70b-instruct` - Latest Llama, 131K context
- `meta.llama-3.2-vision-90b-instruct` - Vision support, 131K context
- `meta.llama-3.1-405b-instruct` - Largest Llama, 131K context

### Command (Cohere)

- `cohere.command-plus-latest` - Command+ latest
- `cohere.command-latest` - Command latest
- `cohere.command-a-vision` - Vision support

### Gemini (Google)

- `google.gemini-2.5-pro` - Best quality, 1M context, vision
- `google.gemini-2.5-flash` - Fast, 1M context, vision

## Automated Setup

For a guided setup experience, use the setup CLI:

```bash
npx @acedergren/opencode-oci-setup
```

This will:

1. Discover profiles from `~/.oci/config`
2. Validate your credentials
3. List available compartments
4. Generate `opencode.json` automatically

## Troubleshooting

### "Missing compartmentId" Error

Set the environment variable:

```bash
export OCI_COMPARTMENT_ID=ocid1.compartment.oc1..aaaaaaa...
```

Or add it directly to `opencode.json`:

```json
"options": {
  "compartmentId": "ocid1.compartment.oc1..aaaaaaa..."
}
```

### Authentication Failures

Verify OCI credentials work:

```bash
oci iam user get --user-id me
```

Check that your profile has the correct region:

```bash
cat ~/.oci/config
```

### Model Not Available

Not all models are available in all regions. Check the [OCI GenAI Regions](https://docs.oracle.com/iaas/generative-ai/overview.htm) documentation.

Common regions with GenAI support:

- `eu-frankfurt-1` - Germany
- `us-ashburn-1` - US East
- `us-chicago-1` - US Midwest

### Profile Not Found

If your profile isn't being recognized:

1. Check `~/.oci/config` exists and has the correct profile
2. Verify `OCI_CONFIG_PROFILE` env var matches exactly
3. Check for typos in the profile name (case-sensitive)

## Advanced Configuration

### Project-Local Configuration

Create `opencode.json` in your project root for project-specific settings:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "oci-genai": {
      "npm": "@acedergren/opencode-oci-genai",
      "name": "OCI GenAI",
      "options": {
        "compartmentId": "{env:OCI_COMPARTMENT_ID}",
        "configProfile": "FRANKFURT",
        "region": "eu-frankfurt-1"
      },
      "models": {
        "meta.llama-3.3-70b-instruct": {
          "name": "Llama 3.3 70B",
          "limit": { "context": 131072, "output": 8192 }
        }
      }
    }
  }
}
```

### Multiple Profiles

Use different profiles for different regions:

```bash
# Frankfurt profile
export OCI_CONFIG_PROFILE=FRANKFURT

# Or Ashburn profile
export OCI_CONFIG_PROFILE=ASHBURN
```

## API Reference

The package exports utilities for programmatic use:

```typescript
import {
  createOCI,
  oci,
  getAllModels,
  getModelMetadata,
  parseOCIConfig,
  validateCredentials,
  discoverCompartments,
} from '@acedergren/opencode-oci-genai';

// Create custom provider
const provider = createOCI({
  compartmentId: 'ocid1.compartment...',
  profile: 'FRANKFURT',
});

// Use default provider
const model = oci.languageModel('xai.grok-4');

// List all available models
const models = getAllModels();

// Parse OCI config
const config = parseOCIConfig();
console.log(config.profiles);

// Validate credentials
const result = await validateCredentials('FRANKFURT');
console.log(result.userName);

// Discover compartments
const compartments = await discoverCompartments('FRANKFURT');
console.log(compartments);
```

## License

MIT
