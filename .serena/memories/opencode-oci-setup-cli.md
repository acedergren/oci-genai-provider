# OpenCode OCI Setup CLI

## Overview
The `@acedergren/opencode-oci-setup` package provides an interactive setup wizard that **automates the complete installation** of the OCI GenAI provider for OpenCode users.

## Location
- Package: `packages/opencode-oci-setup/`
- Entry point: `src/cli.ts`
- Binary: `opencode-oci-setup`

## Key Features

### 1. Automated Package Installation
The CLI automatically installs the provider package to `~/.config/opencode/`:
- Creates `package.json` if needed
- Runs `npm install @acedergren/opencode-oci-genai`
- Handles errors gracefully with fallback instructions

**Code location**: `src/cli.ts:690-727` (installPackage function)

### 2. OCI Credentials Setup
- Auto-discovers profiles from `~/.oci/config`
- Validates credentials via OCI API
- Offers manual configuration flow for new users
- Supports multiple profiles

### 3. Compartment Discovery
- Auto-discovers compartments via OCI API
- Fallback to manual OCID entry
- OCID validation

### 4. Model Selection
- Filters models by region availability
- Highlights coding-recommended models (⭐)
- Groups by model family (Grok, Llama, Cohere, Gemini)
- Shows capabilities (vision 👁, tools, context window)

### 5. Config Generation
- Generates `~/.config/opencode/opencode.json`
- Preserves existing providers (doesn't overwrite other configs)
- Supports coding-optimized settings (temperature, maxTokens, frequencyPenalty)

## Usage

### For End Users (Published Package)
```bash
npx @acedergren/opencode-oci-setup
```

### For Local Development
```bash
cd packages/opencode-oci-setup
pnpm build
node dist/cli.js
```

### CLI Options
```bash
opencode-oci-setup [options]

Options:
  -p, --profile <name>      OCI profile name
  -c, --compartment <ocid>  Compartment OCID
  -y, --yes                 Skip confirmations
  -q, --quiet               Minimal output
```

## Setup Flow

1. **Check existing config** - Detects if OCI GenAI is already configured
2. **OCI credentials** - Auto-discover or manual setup
3. **Compartment selection** - Auto-discover or manual OCID
4. **Model selection** - Interactive multi-select with recommendations
5. **Coding optimization** - Optional settings for code generation
6. **Package installation** - Automatic `npm install`
7. **Config generation** - Write `opencode.json`

## Publishing

The package is configured for GitHub Packages:
```json
{
  "publishConfig": {
    "access": "public",
    "registry": "https://npm.pkg.github.com"
  }
}
```

To publish:
```bash
pnpm build
cd packages/opencode-oci-setup
npm publish
```

## Dependencies

- `commander` - CLI framework
- `prompts` - Interactive prompts
- `ora` - Spinners
- `chalk` - Terminal colors
- `open` - Open browser for docs
- `@acedergren/oci-genai-provider` - Provider package (workspace link)

## Important Notes

1. **No manual editing required** - Users don't need to edit package.json or opencode.json manually
2. **Preserves existing config** - Doesn't overwrite other providers in opencode.json
3. **Graceful error handling** - Provides fallback instructions if npm install fails
4. **Security**: Uses `execFileSync` instead of `exec` to prevent shell injection

## Coding-Optimized Settings

When enabled, applies these settings to all models:
```javascript
{
  temperature: 0.2,      // More deterministic code
  maxTokens: 8192,       // Longer code outputs
  frequencyPenalty: 0.1  // Reduce repetition
}
```

## Troubleshooting

### Provider Not Loading in OpenCode
If the OCI GenAI provider appears grayed out:
1. Check package is installed: `ls ~/.config/opencode/node_modules/@acedergren/`
2. For local development, link the package:
   ```bash
   cd ~/.config/opencode
   npm link /path/to/opencode-oci-genai/packages/opencode-integration
   ```
3. Restart OpenCode

### Package Installation Failed
If `npm install` fails during setup:
- Manual installation: `cd ~/.config/opencode && npm install @acedergren/opencode-oci-genai`
- Check npm is installed: `npm --version`
- Check network connectivity to registry
