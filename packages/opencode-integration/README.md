# @acedergren/opencode-oci-genai

> **OpenCode convenience wrapper** for [@acedergren/oci-genai-provider](../oci-genai-provider)

## What is This?

This package is an **optional convenience layer** for using the OCI GenAI provider with OpenCode. It's NOT required — you can use the core provider directly.

**Use this package if you want**:

- ✅ Default export factory function for OpenCode config
- ✅ Automatic environment variable loading
- ✅ Configuration validation with helpful errors
- ✅ Model registry generation
- ✅ OCI-specific helpers

**Use the core provider directly if you**:

- Want to configure everything yourself
- Don't need the convenience helpers
- Are using OpenCode's standard provider config

## Installation

```bash
npm install @acedergren/opencode-oci-genai
```

## Usage

### As OpenCode Provider

Add to `opencode.json`:

```json
{
  "provider": {
    "oci-genai": {
      "npm": "@acedergren/opencode-oci-genai",
      "options": {
        "compartmentId": "ocid1.compartment.oc1...",
        "configProfile": "FRANKFURT"
      }
    }
  }
}
```

The package exports a default factory function that OpenCode will invoke.

### Direct Usage (Alternative)

You can also use this package programmatically:

```typescript
import opencode from '@acedergren/opencode-oci-genai';

const provider = opencode({
  compartmentId: process.env.OCI_COMPARTMENT_ID,
  region: 'eu-frankfurt-1',
});

// Use with Vercel AI SDK
const model = provider.model('cohere.command-r-plus');
```

### Re-exported Core Provider API

Everything from the core provider is re-exported:

```typescript
import { oci, getAllModels, getModelMetadata } from '@acedergren/opencode-oci-genai';

// Use exactly like the core provider
const result = await generateText({
  model: oci('xai.grok-4-maverick'),
  prompt: 'Hello!',
});
```

## Configuration

### Type Definition

```typescript
interface OpenCodeOCIConfig extends OCIConfig {
  // Required
  compartmentId?: string;

  // Optional
  region?: string;
  profile?: string;
  auth?: 'config_file' | 'instance_principal' | 'resource_principal';

  // OpenCode metadata
  enabled?: boolean;
  displayName?: string;
  description?: string;
  priority?: number;
}
```

### Configuration Precedence

1. **User config** (highest priority)
2. **Environment variables**
3. **Defaults**

### Environment Variables

```bash
OCI_COMPARTMENT_ID=ocid1.compartment.oc1...
OCI_REGION=eu-frankfurt-1
OCI_CONFIG_PROFILE=DEFAULT
```

## API Reference

### Default Export

```typescript
export default function opencode(options?: OpenCodeOCIConfig): OCIProvider;
```

The factory function OpenCode invokes. Returns a Vercel AI SDK provider.

### Configuration Helpers

```typescript
export {
  validateConfig, // Validate configuration
  loadConfigFromEnv, // Load from environment
  mergeConfigs, // Merge configs with precedence
} from './config';
```

### Model Registry

```typescript
export {
  getOpenCodeModelRegistry, // Get all models in OpenCode format
  getModelRegistryByFamily, // Get models by family
} from './models';
```

### Core Provider Re-exports

```typescript
export * from '@acedergren/oci-genai-provider';
export { createOCI, oci } from '@acedergren/oci-genai-provider';
```

Everything from the core provider is available.

## What This Package Does NOT Do

- ❌ Implement a different provider (uses core provider)
- ❌ Wrap the OCI SDK (core provider does that)
- ❌ Provide OpenCode CLI commands
- ❌ Replace the core provider

It's purely a convenience layer for OpenCode users.

## When to Use the Core Provider Instead

Use `@acedergren/oci-genai-provider` directly if:

- You're not using OpenCode
- You're using OpenCode but want full control
- You don't need the convenience helpers
- You're building a framework/tool on Vercel AI SDK

## Documentation

- [OpenCode Integration Guide](../../docs/guides/opencode-integration/README.md) - How to use this with OpenCode
- [Core Provider Documentation](../oci-genai-provider/README.md) - Main provider API
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs) - AI SDK reference

## Development

Part of the monorepo. See root README for development setup.

## License

MIT
