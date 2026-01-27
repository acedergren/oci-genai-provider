# @acedergren/opencode-oci-genai

OpenCode integration for Oracle Cloud Infrastructure (OCI) Generative AI provider.

> **Note:** This package is currently under development. See [Implementation Plan](../../docs/plans/2026-01-27-opencode-integration-implementation.md) for roadmap.

## Overview

This package provides OpenCode-specific wrappers and utilities for the core [`@acedergren/oci-genai-provider`](../oci-genai-provider) package, making it easy to use OCI GenAI models within OpenCode applications.

## Installation

```bash
npm install @acedergren/opencode-oci-genai
```

Or with pnpm:

```bash
pnpm add @acedergren/opencode-oci-genai
```

## Quick Start

### Auto-Registration

```typescript
import { autoRegisterOCIProvider } from '@acedergren/opencode-oci-genai';

// Automatically registers with environment variables
autoRegisterOCIProvider();
```

### Manual Registration

```typescript
import { registerOCIProvider } from '@acedergren/opencode-oci-genai';

registerOCIProvider({
  region: 'eu-frankfurt-1',
  compartmentId: process.env.OCI_COMPARTMENT_ID,
  displayName: 'OCI GenAI',
  description: 'Oracle Cloud Infrastructure Generative AI',
  enabled: true,
  priority: 100,
});
```

## Configuration

### Environment Variables

```bash
OCI_REGION=eu-frankfurt-1
OCI_COMPARTMENT_ID=ocid1.compartment.oc1..your-id
OCI_CONFIG_PROFILE=DEFAULT
```

### OpenCode Config File

Create `opencode.json` in your project root:

```json
{
  "providers": {
    "oci": {
      "displayName": "OCI GenAI",
      "description": "Oracle Cloud Infrastructure Generative AI",
      "region": "eu-frankfurt-1",
      "compartmentId": "ocid1.compartment.oc1..your-id",
      "enabled": true,
      "priority": 100
    }
  }
}
```

## Features (Planned)

This package will provide:

- ✅ **Provider Registration** - Easy registration with OpenCode
- ✅ **Configuration Helpers** - Simplified config management
- ✅ **Model Selection** - Utilities for choosing the best model
- ✅ **OpenCode Integration** - Seamless OpenCode compatibility

## Core Provider

This package re-exports the entire core provider API:

```typescript
// All exports from @acedergren/oci-genai-provider are available
import { oci, createOCI, getAllModels } from '@acedergren/opencode-oci-genai';

// Use the same way as the core provider
const result = await generateText({
  model: oci('cohere.command-r-plus'),
  prompt: 'Hello!',
});
```

For full core provider documentation, see [@acedergren/oci-genai-provider](../oci-genai-provider/README.md).

## Development

This package is part of a monorepo:

```bash
# Clone the monorepo
git clone https://github.com/acedergren/opencode-oci-genai.git
cd opencode-oci-genai

# Install dependencies (requires pnpm 8+)
pnpm install

# Build all packages (opencode-integration depends on oci-genai-provider)
pnpm build

# Run tests
pnpm --filter @acedergren/opencode-oci-genai test
```

### Implementation Status

See [OpenCode Integration Implementation Plan](../../docs/plans/2026-01-27-opencode-integration-implementation.md) for detailed implementation roadmap.

**Planned Tasks:**

1. OpenCode Configuration Types
2. Provider Registration Functions
3. Configuration Helpers
4. Convenience Utilities
5. Main Export & Documentation
6. Build & Verify

## Dependencies

- **`@acedergren/oci-genai-provider`** (workspace dependency) - Core provider implementation
- All dependencies from the core provider

## License

MIT

## Links

- [Documentation](https://github.com/acedergren/opencode-oci-genai/tree/main/docs)
- [Implementation Plan](https://github.com/acedergren/opencode-oci-genai/tree/main/docs/plans/2026-01-27-opencode-integration-implementation.md)
- [Core Provider](https://github.com/acedergren/opencode-oci-genai/tree/main/packages/oci-genai-provider)
- [Issues](https://github.com/acedergren/opencode-oci-genai/issues)
