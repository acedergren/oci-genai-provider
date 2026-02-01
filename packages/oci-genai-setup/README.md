# OCI GenAI Setup

Interactive setup wizard for configuring OCI GenAI provider with support for AI SDK, OpenCode, and Claude Code.

## Features

- **Multi-Format Output**: Generate configs for OpenCode, Claude Code MCP, or environment variables
- **Auto-Discovery**: Automatically discovers profiles from `~/.oci/config`
- **Credential Validation**: Tests your OCI credentials before proceeding
- **Compartment Discovery**: Lists available compartments by name (not just OCIDs)
- **Manual Setup**: Full fallback for users without OCI CLI installed
- **Model Selection**: Choose which models to enable from 19+ options
- **Bun-Powered**: Fast file I/O using Bun's native APIs

## Quick Start

```bash
npx @acedergren/oci-genai-setup
```

The wizard will guide you through:

1. Selecting output format (OpenCode, Claude Code, env vars, JSON)
2. Selecting/creating an OCI profile
3. Validating your credentials
4. Selecting a compartment
5. Choosing models to enable
6. Generating configuration

## Installation

For repeated use, you can install globally:

```bash
npm install -g @acedergren/oci-genai-setup
oci-genai-setup
```

## Usage

### Interactive Mode (Default)

```bash
npx @acedergren/oci-genai-setup
```

### Output Formats

```bash
# OpenCode (default)
npx @acedergren/oci-genai-setup --output opencode

# Claude Code MCP
npx @acedergren/oci-genai-setup --output claude-code

# Environment variables (.env)
npx @acedergren/oci-genai-setup --output env

# JSON (for scripting)
npx @acedergren/oci-genai-setup --output json --quiet
```

### Non-Interactive Mode

```bash
npx @acedergren/oci-genai-setup \
  --profile FRANKFURT \
  --compartment ocid1.compartment.oc1..aaaa... \
  --output env \
  --yes
```

### Options

| Option                     | Description                                     |
| -------------------------- | ----------------------------------------------- |
| `-p, --profile <name>`     | OCI profile name from `~/.oci/config`           |
| `-c, --compartment <ocid>` | Compartment OCID for API calls                  |
| `-o, --output <format>`    | Output format: opencode, claude-code, env, json |
| `--output-path <path>`     | Custom output path (for env format)             |
| `-y, --yes`                | Skip confirmations                              |
| `-q, --quiet`              | Minimal output                                  |

## Output Formats

### OpenCode (`--output opencode`)

Generates `~/.config/opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "oci-genai": {
      "npm": "@acedergren/opencode-oci-genai",
      "name": "OCI GenAI",
      "options": {
        "compartmentId": "ocid1.compartment.oc1...",
        "configProfile": "FRANKFURT"
      },
      "models": { ... }
    }
  }
}
```

### Claude Code MCP (`--output claude-code`)

Generates Claude Code desktop config with MCP server:

```json
{
  "mcpServers": {
    "oci-genai": {
      "command": "npx",
      "args": ["-y", "@acedergren/oci-genai-mcp"],
      "env": {
        "OCI_CONFIG_PROFILE": "FRANKFURT",
        "OCI_COMPARTMENT_ID": "ocid1.compartment.oc1...",
        "OCI_REGION": "eu-frankfurt-1"
      }
    }
  }
}
```

### Environment Variables (`--output env`)

Generates `.env` file:

```bash
OCI_CONFIG_PROFILE=FRANKFURT
OCI_COMPARTMENT_ID=ocid1.compartment.oc1...
OCI_REGION=eu-frankfurt-1
OCI_GENAI_MODELS=grok-3,grok-3-vision,llama-4
```

### JSON (`--output json`)

Outputs structured JSON to stdout for scripting:

```json
{
  "oci": { "profile": "FRANKFURT", "compartmentId": "...", "region": "..." },
  "models": [...],
  "settings": { "codingOptimized": true },
  "env": { "OCI_CONFIG_PROFILE": "FRANKFURT", ... }
}
```

## Setup Flows

### With Existing OCI Config

If you already have `~/.oci/config` set up:

1. Select from discovered profiles
2. Credentials are automatically validated
3. Compartments are auto-discovered
4. Select models and generate config

### Without OCI Config (Manual Setup)

If you don't have OCI CLI installed:

1. Choose "Enter credentials manually"
2. Provide User OCID, Tenancy OCID, Fingerprint, Key file, Region
3. The wizard creates `~/.oci/config` for you
4. Enter compartment OCID manually
5. Select models and generate config

## Prerequisites

### Required

- Bun 1.0+ or Node.js 18+
- OCI account with GenAI access

### For Auto-Discovery (Recommended)

- OCI CLI installed and configured (`oci setup config`)

### For Manual Setup

- API key created in OCI Console
- Private key file downloaded
- User OCID, Tenancy OCID, and Fingerprint noted

## Troubleshooting

### "Could not auto-discover compartments"

This means the credentials couldn't connect to OCI API. Common causes:

1. Invalid API key or fingerprint
2. Key file not found or wrong permissions
3. Network connectivity issues

You can still enter a compartment OCID manually.

### Permission Denied Errors

Make sure your private key file has correct permissions:

```bash
chmod 600 ~/.oci/oci_api_key.pem
```

## License

MIT
