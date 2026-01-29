# OpenCode OCI GenAI Setup

Interactive setup wizard for configuring OCI GenAI provider in OpenCode.

## Features

- **Auto-Discovery**: Automatically discovers profiles from `~/.oci/config`
- **Credential Validation**: Tests your OCI credentials before proceeding
- **Compartment Discovery**: Lists available compartments by name (not just OCIDs)
- **Manual Setup**: Full fallback for users without OCI CLI installed
- **Model Selection**: Choose which models to enable from 19+ options

## Quick Start

```bash
npx @acedergren/opencode-oci-setup
```

That's it! The wizard will guide you through:

1. Selecting/creating an OCI profile
2. Validating your credentials
3. Selecting a compartment
4. Choosing models to enable
5. Generating `opencode.json`

## Installation

For repeated use, you can install globally:

```bash
npm install -g @acedergren/opencode-oci-setup
opencode-oci-setup
```

## Usage

### Interactive Mode (Default)

```bash
npx @acedergren/opencode-oci-setup
```

### Non-Interactive Mode

```bash
npx @acedergren/opencode-oci-setup \
  --profile FRANKFURT \
  --compartment ocid1.compartment.oc1..aaaa... \
  --yes
```

### Options

| Option | Description |
|--------|-------------|
| `-p, --profile <name>` | OCI profile name from `~/.oci/config` |
| `-c, --compartment <ocid>` | Compartment OCID for API calls |
| `-y, --yes` | Skip confirmations |
| `-q, --quiet` | Minimal output |

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
2. Provide:
   - User OCID
   - Tenancy OCID
   - API Key Fingerprint
   - Private key file path
   - Region
3. The wizard creates `~/.oci/config` for you
4. Enter compartment OCID manually
5. Select models and generate config

## Prerequisites

### Required

- Node.js 18+
- OCI account with GenAI access

### For Auto-Discovery (Recommended)

- OCI CLI installed and configured (`oci setup config`)

### For Manual Setup

- API key created in OCI Console
- Private key file downloaded
- User OCID, Tenancy OCID, and Fingerprint noted

## Finding Your OCIDs

### User OCID
OCI Console → Identity → Users → [Your User] → OCID

### Tenancy OCID
OCI Console → Administration → Tenancy Details → OCID

### Compartment OCID
OCI Console → Identity → Compartments → [Compartment] → OCID

### API Key Fingerprint
OCI Console → Identity → Users → [Your User] → API Keys → Fingerprint

## Output

The wizard generates `~/.config/opencode/opencode.json`:

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
      "models": {
        "xai.grok-4-maverick": {
          "name": "Grok 4 Maverick",
          "limit": { "context": 131072, "output": 8192 }
        }
      }
    }
  }
}
```

## Troubleshooting

### "Could not auto-discover compartments"

This means the credentials couldn't connect to OCI API. Common causes:

1. Invalid API key or fingerprint
2. Key file not found or wrong permissions
3. Network connectivity issues

You can still enter a compartment OCID manually.

### "npm not found"

Ensure npm is installed and in your PATH:

```bash
which npm
npm --version
```

### Permission Denied Errors

Make sure your private key file has correct permissions:

```bash
chmod 600 ~/.oci/oci_api_key.pem
```

## License

MIT
