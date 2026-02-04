# OCI Authentication Guide

Complete guide to configuring Oracle Cloud Infrastructure authentication for the OCI GenAI provider.

## Overview

The OCI GenAI provider supports multiple authentication methods, with a cascading configuration strategy that prioritizes environment variables, then constructor options, and finally defaults.

**Authentication Methods:**

1. **API Key Authentication** (recommended for development)
2. **Instance Principal** (for OCI Compute instances)
3. **Resource Principal** (for OCI Functions)
4. **Config File** (standard ~/.oci/config)

---

## Quick Start

### 1. Create OCI API Key

If you don't have an OCI API key yet:

```bash
# Create .oci directory
mkdir -p ~/.oci

# Generate API key pair
openssl genrsa -out ~/.oci/oci_api_key.pem 2048

# Generate public key
openssl rsa -pubout -in ~/.oci/oci_api_key.pem -out ~/.oci/oci_api_key_public.pem

# Set secure permissions
chmod 600 ~/.oci/oci_api_key.pem
chmod 644 ~/.oci/oci_api_key_public.pem
```

### 2. Upload Public Key to OCI

1. Log in to [OCI Console](https://cloud.oracle.com)
2. Navigate to: **Profile Icon** → **User Settings** → **API Keys**
3. Click **Add API Key**
4. Paste the contents of `~/.oci/oci_api_key_public.pem`
5. Click **Add**
6. Note the **fingerprint** displayed (you'll need this)

### 3. Create Config File

Create or edit `~/.oci/config`:

```ini
[DEFAULT]
user=ocid1.user.oc1..<unique_id>
fingerprint=<your_fingerprint>
key_file=~/.oci/oci_api_key.pem
tenancy=ocid1.tenancy.oc1..<unique_id>
region=us-ashburn-1
```

**Find your OCIDs:**

- **User OCID**: OCI Console → Profile Icon → User Settings
- **Tenancy OCID**: OCI Console → Profile Icon → Tenancy: [name]
- **Fingerprint**: Displayed when you uploaded the public key

### 4. Verify Configuration

```bash
# Test OCI CLI authentication
oci iam region list

# Expected output: List of available regions
```

---

## Configuration File Format

### Standard Profile

The OCI configuration file (`~/.oci/config`) uses INI format:

```ini
[DEFAULT]
user=ocid1.user.oc1..<unique_id>
fingerprint=94:99:26:62:b4:e1:05:dd:39:fb:94:00:63:e6:2c:dc
key_file=~/.oci/oci_api_key.pem
tenancy=ocid1.tenancy.oc1..<unique_id>
region=us-ashburn-1
```

**Required Fields:**

- `user` - Your user OCID
- `fingerprint` - Your API key fingerprint
- `key_file` - Path to your private key file
- `tenancy` - Your tenancy OCID
- `region` - Default region for API calls

### Multiple Profiles

You can define multiple profiles for different environments or regions:

```ini
[DEFAULT]
user=ocid1.user.oc1..<dev_user_id>
fingerprint=<dev_fingerprint>
key_file=~/.oci/oci_api_key_dev.pem
tenancy=ocid1.tenancy.oc1..<dev_tenancy_id>
region=us-ashburn-1

[PRODUCTION]
user=ocid1.user.oc1..<prod_user_id>
fingerprint=<prod_fingerprint>
key_file=~/.oci/oci_api_key_prod.pem
tenancy=ocid1.tenancy.oc1..<prod_tenancy_id>
region=us-phoenix-1

[FRANKFURT]
user=ocid1.user.oc1..<unique_id>
fingerprint=<fingerprint>
key_file=~/.oci/oci_api_key.pem
tenancy=ocid1.tenancy.oc1..<unique_id>
region=eu-frankfurt-1

[STOCKHOLM]
user=ocid1.user.oc1..<unique_id>
fingerprint=<fingerprint>
key_file=~/.oci/oci_api_key.pem
tenancy=ocid1.tenancy.oc1..<unique_id>
region=eu-stockholm-1
```

**Using Profiles:**

```typescript
import { createOCI } from '@acedergren/oci-genai-provider';

// Use specific profile
const oci = createOCI({
  profile: 'PRODUCTION',
});

// Or via environment variable
process.env.OCI_CONFIG_PROFILE = 'FRANKFURT';
const oci = createOCI(); // Uses FRANKFURT profile
```

### Custom Configuration Values

Add custom key-value pairs to your profile:

```ini
[DEFAULT]
user=ocid1.user.oc1..<unique_id>
fingerprint=<fingerprint>
key_file=~/.oci/oci_api_key.pem
tenancy=ocid1.tenancy.oc1..<unique_id>
region=us-ashburn-1

# Custom values
compartment_id=ocid1.compartment.oc1..<unique_id>
dedicated_endpoint_id=ocid1.dedicatedaiendpoint.oc1..<unique_id>
log_level=DEBUG
```

**Reading Custom Values (OCI SDK):**

```typescript
import * as common from 'oci-common';

const config = common.ConfigFileReader.parseDefault();
const profile = config.accumulator.configurationsByProfile.get('DEFAULT');

const compartmentId = profile.get('compartment_id');
const endpointId = profile.get('dedicated_endpoint_id');
const logLevel = profile.get('log_level');
```

---

## Authentication Methods

### Method 1: API Key Authentication (Default)

**Best for:** Development, local testing, CI/CD pipelines

**TypeScript (OCI SDK):**

```typescript
import * as common from 'oci-common';
import * as genai from 'oci-generativeaiinference';

// Using default config (~/.oci/config, profile: DEFAULT)
const provider = new common.ConfigFileAuthenticationDetailsProvider();

// Using specific profile
const provider = new common.ConfigFileAuthenticationDetailsProvider('~/.oci/config', 'PRODUCTION');

// Create client
const client = new genai.GenerativeAiInferenceClient({
  authenticationDetailsProvider: provider,
});
client.region = common.Region.US_ASHBURN_1;
```

**Provider Usage:**

```typescript
import { createOCI } from '@acedergren/oci-genai-provider';

// Default: ~/.oci/config, profile DEFAULT
const oci = createOCI();

// Specific profile
const oci = createOCI({
  profile: 'PRODUCTION',
});

// Custom config file
const oci = createOCI({
  configFile: '/path/to/config',
  profile: 'CUSTOM',
});
```

**OCI CLI:**

```bash
# Uses DEFAULT profile
oci generative-ai-inference chat ...

# Use specific profile
oci generative-ai-inference chat --profile PRODUCTION ...

# Use custom config file
oci generative-ai-inference chat --config-file /path/to/config ...
```

---

### Method 2: Instance Principal Authentication

**Best for:** Applications running on OCI Compute instances

**Prerequisites:**

1. Create a dynamic group including your compute instance
2. Create an IAM policy granting the dynamic group access to Generative AI

**Dynamic Group Example:**

```
# Match instances in a specific compartment
ANY {instance.compartment.id = 'ocid1.compartment.oc1..<unique_id>'}

# Match specific instance
ANY {instance.id = 'ocid1.instance.oc1..<unique_id>'}
```

**IAM Policy Example:**

```
# Grant dynamic group access to Generative AI
Allow dynamic-group GenAI-Compute-DG to use generative-ai-family in compartment GenAI-Compartment
```

See [IAM Policies Guide](../iam-policies/) for complete policy requirements.

**TypeScript (OCI SDK):**

```typescript
import * as common from 'oci-common';
import * as genai from 'oci-generativeaiinference';

// Create instance principal provider
const provider = common.ResourcePrincipalAuthenticationDetailsProvider.builder();

// Create client
const client = new genai.GenerativeAiInferenceClient({
  authenticationDetailsProvider: provider,
});
```

**Provider Usage:**

```typescript
import { createOCI } from '@acedergren/oci-genai-provider';

const oci = createOCI({
  auth: 'instance_principal',
  region: 'us-ashburn-1', // Specify region explicitly
});
```

**OCI CLI:**

```bash
oci generative-ai-inference chat \
  --auth instance_principal \
  --region us-ashburn-1 \
  ...
```

---

### Method 3: Resource Principal Authentication

**Best for:** OCI Functions, OCI Data Flow, other resource principal contexts

**Prerequisites:**

1. Resource principal is automatically available in supported services
2. Create IAM policies granting resource access

**IAM Policy Example:**

```
# For OCI Functions
Allow any-user to use generative-ai-family in compartment GenAI-Compartment where ALL {
  request.principal.type='resource',
  request.principal.compartment.id='ocid1.compartment.oc1..<function_compartment_id>'
}
```

**TypeScript (OCI SDK):**

```typescript
import * as common from 'oci-common';
import * as genai from 'oci-generativeaiinference';

// Create resource principal provider
const provider = common.ResourcePrincipalAuthenticationDetailsProvider.builder();

// Create client
const client = new genai.GenerativeAiInferenceClient({
  authenticationDetailsProvider: provider,
});
```

**Provider Usage:**

```typescript
import { createOCI } from '@acedergren/oci-genai-provider';

const oci = createOCI({
  auth: 'resource_principal',
});
```

**OCI CLI:**

```bash
oci generative-ai-inference chat \
  --auth resource_principal \
  ...
```

**OCI Functions Example:**

```typescript
import fdk from '@fnproject/fdk';
import { createOCI } from '@acedergren/oci-genai-provider';
import { generateText } from 'ai';

fdk.handle(async (input: any) => {
  // Automatically uses resource principal
  const oci = createOCI({
    auth: 'resource_principal',
  });

  const { text } = await generateText({
    model: oci('cohere.command-r-plus'),
    prompt: input.prompt,
  });

  return { response: text };
});
```

---

## Configuration Cascade

The provider uses the following priority order for configuration:

### 1. Environment Variables (Highest Priority)

```bash
# Configuration file path
export OCI_CONFIG_FILE="/custom/path/to/config"

# Profile name
export OCI_CONFIG_PROFILE="PRODUCTION"

# Region
export OCI_REGION="us-ashburn-1"

# Authentication method
export OCI_CLI_AUTH="instance_principal"

# Compartment ID (custom)
export OCI_COMPARTMENT_ID="ocid1.compartment.oc1..<unique_id>"
```

### 2. Constructor Options

```typescript
const oci = createOCI({
  configFile: '/path/to/config', // Override config file
  profile: 'PRODUCTION', // Override profile
  region: 'us-ashburn-1', // Override region
  auth: 'instance_principal', // Override auth method
});
```

### 3. Defaults

```typescript
// Default values if nothing specified:
{
  configFile: '~/.oci/config',
  profile: 'DEFAULT',
  region: (from config file),
  auth: 'api_key'
}
```

**Resolution Example:**

```typescript
// Environment: OCI_CONFIG_PROFILE=PRODUCTION
// Constructor: profile: 'FRANKFURT'
// Result: Uses FRANKFURT (constructor overrides environment)

const oci = createOCI({
  profile: 'FRANKFURT', // This takes precedence
});
```

---

## Regional Configuration

### Available Regions

OCI Generative AI is available in select regions. Always specify the correct region for your use case.

**Common Regions:**

```typescript
import * as common from 'oci-common';

// US Regions
common.Region.US_ASHBURN_1; // us-ashburn-1 (US East, Ashburn)
common.Region.US_PHOENIX_1; // us-phoenix-1 (US West, Phoenix)
common.Region.US_CHICAGO_1; // us-chicago-1 (US Midwest, Chicago)

// Europe Regions
common.Region.EU_FRANKFURT_1; // eu-frankfurt-1 (Germany, Frankfurt)
common.Region.EU_STOCKHOLM_1; // eu-stockholm-1 (Sweden, Stockholm)
common.Region.UK_LONDON_1; // uk-london-1 (UK, London)

// Asia Pacific Regions
common.Region.AP_TOKYO_1; // ap-tokyo-1 (Japan, Tokyo)
common.Region.AP_MUMBAI_1; // ap-mumbai-1 (India, Mumbai)
```

**Setting Region:**

```typescript
// In config file
[DEFAULT]
region=us-ashburn-1

// Via environment variable
export OCI_REGION="us-ashburn-1"

// Via constructor
const oci = createOCI({
  region: 'us-ashburn-1'
});

// Via SDK client
client.region = common.Region.US_ASHBURN_1;
```

See [OCI GenAI Models Reference](../../reference/oci-genai-models/) for model availability by region.

---

## Security Best Practices

### File Permissions

```bash
# Config file (read-only for owner)
chmod 600 ~/.oci/config

# Private key (read-only for owner)
chmod 600 ~/.oci/oci_api_key.pem

# Public key (read for owner and group)
chmod 644 ~/.oci/oci_api_key_public.pem

# Directory (owner access only)
chmod 700 ~/.oci
```

### Key Management

**✅ DO:**

- Store keys in `~/.oci/` directory
- Use separate keys for development and production
- Rotate API keys regularly (every 90 days)
- Use OCI Vault for production secrets
- Enable MFA on your OCI account
- Use resource principals in cloud deployments

**❌ DON'T:**

- Commit `.pem` files to version control
- Share API keys between team members
- Use production keys in development
- Store keys in application code
- Use same key across multiple tenancies
- Disable security monitoring

### Credential Rotation

```bash
# 1. Generate new key pair
openssl genrsa -out ~/.oci/oci_api_key_new.pem 2048
openssl rsa -pubout -in ~/.oci/oci_api_key_new.pem -out ~/.oci/oci_api_key_new_public.pem

# 2. Upload new public key to OCI Console

# 3. Update config file with new fingerprint
# [DEFAULT]
# fingerprint=<new_fingerprint>
# key_file=~/.oci/oci_api_key_new.pem

# 4. Test new key
oci iam region list

# 5. Delete old key from OCI Console

# 6. Remove old key files
rm ~/.oci/oci_api_key.pem
rm ~/.oci/oci_api_key_public.pem
```

---

## Troubleshooting

### "ConfigFileNotFound" Error

**Problem:** OCI SDK cannot find the configuration file.

**Solutions:**

```bash
# Check if file exists
ls -la ~/.oci/config

# Create if missing
mkdir -p ~/.oci
touch ~/.oci/config

# Set correct path
export OCI_CONFIG_FILE="$HOME/.oci/config"
```

### "NotAuthenticated" Error

**Problem:** Authentication failed (401 Unauthorized).

**Check:**

1. **Fingerprint matches**: Compare fingerprint in config with OCI Console
2. **Key file exists**: `ls -la ~/.oci/oci_api_key.pem`
3. **Correct user OCID**: Verify user OCID in config
4. **Key not expired**: Check if API key is still active in Console

**Verify:**

```bash
# Test authentication
oci iam user get --user-id ocid1.user.oc1..<your_id>

# Expected: Your user details
# Error: Authentication problem
```

### "NotAuthorizedOrNotFound" Error

**Problem:** User lacks required IAM policies (403 Forbidden).

**Solution:** See [IAM Policies Guide](../iam-policies/) for required policies.

**Verify:**

```bash
# Check your permissions
oci iam policy list --compartment-id <tenancy_ocid>

# Check dynamic groups (if using instance principal)
oci iam dynamic-group list --compartment-id <tenancy_ocid>
```

### "Region Not Subscribed" Error

**Problem:** Your tenancy is not subscribed to the specified region.

**Check subscribed regions:**

```bash
oci iam region-subscription list
```

**Subscribe to region:** OCI Console → Manage Regions → Subscribe

### Invalid Fingerprint

**Problem:** Fingerprint mismatch.

**Get correct fingerprint:**

1. OCI Console → Profile Icon → User Settings → API Keys
2. Find your key and copy the fingerprint
3. Update `~/.oci/config` with correct fingerprint

**Generate fingerprint from key:**

```bash
openssl rsa -pubout -outform DER -in ~/.oci/oci_api_key.pem | openssl md5 -c
```

---

## Environment-Specific Configuration

### Development

```typescript
// .env.development
OCI_CONFIG_PROFILE=DEFAULT
OCI_REGION=us-ashburn-1
OCI_COMPARTMENT_ID=ocid1.compartment.oc1..<dev_compartment>

// Usage
import { createOCI } from '@acedergren/oci-genai-provider';

const oci = createOCI({
  profile: process.env.OCI_CONFIG_PROFILE,
  region: process.env.OCI_REGION
});
```

### Production (Compute Instance)

```typescript
// .env.production
OCI_CLI_AUTH=instance_principal
OCI_REGION=us-phoenix-1
OCI_COMPARTMENT_ID=ocid1.compartment.oc1..<prod_compartment>

// Usage
import { createOCI } from '@acedergren/oci-genai-provider';

const oci = createOCI({
  auth: 'instance_principal',
  region: process.env.OCI_REGION
});
```

### CI/CD (GitHub Actions)

```yaml
# .github/workflows/test.yml
name: Test with OCI GenAI

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup OCI Config
        run: |
          mkdir -p ~/.oci
          echo "${{ secrets.OCI_CONFIG }}" > ~/.oci/config
          echo "${{ secrets.OCI_API_KEY }}" > ~/.oci/oci_api_key.pem
          chmod 600 ~/.oci/oci_api_key.pem

      - name: Run Tests
        run: npm test
        env:
          OCI_CONFIG_PROFILE: DEFAULT
          OCI_REGION: us-ashburn-1
```

**GitHub Secrets:**

- `OCI_CONFIG` - Contents of `~/.oci/config`
- `OCI_API_KEY` - Contents of `~/.oci/oci_api_key.pem`

---

## Next Steps

- **[IAM Policies Guide](../iam-policies/)** - Required policies and permissions
- **[First Chat Tutorial](../../tutorials/01-basic-chat.md)** - Test your configuration
- **[OCI SDK Reference](../../api-reference/oci-sdk/)** - SDK authentication details
- **[Deployment Guide](../deployment/)** - Production deployment patterns

---

**Sources:**

- [OCI SDK Documentation](https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/typescriptsdk.htm)
- [OCI CLI Configuration](https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliconfigure.htm)
- [OCI API Key Authentication](https://docs.oracle.com/en-us/iaas/Content/API/Concepts/apisigningkey.htm)
- Project CLAUDE.md Configuration Reference
- Context7 OCI SDK Query Results (2026-01-26)

**Last Updated**: 2026-01-26
