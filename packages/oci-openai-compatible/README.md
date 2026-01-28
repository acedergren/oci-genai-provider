# @acedergren/oci-openai-compatible

OpenAI-compatible wrapper for Oracle Cloud Infrastructure (OCI) Generative AI Service.

[![npm version](https://img.shields.io/npm/v/@acedergren/oci-openai-compatible.svg)](https://www.npmjs.com/package/@acedergren/oci-openai-compatible)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

This package provides a lightweight OpenAI-compatible interface for OCI Generative AI models, enabling teams familiar with OpenAI's API to seamlessly migrate to OCI with minimal code changes.

**Key Features:**
- ✅ Drop-in OpenAI SDK compatibility
- ✅ Minimal dependencies (no OCI SDK overhead)
- ✅ Simple API key authentication
- ✅ TypeScript support with full type definitions
- ✅ Streaming support
- ✅ Supports 6 OCI regions with OpenAI-compatible endpoints

## When to Use This Package

**Use `oci-openai-compatible` if:**
- You're migrating from OpenAI to OCI
- You want minimal bundle size (no OCI SDK)
- You prefer simple API key authentication
- You're familiar with OpenAI SDK patterns

**Use `@acedergren/oci-genai-provider` (native provider) if:**
- You need instance principal or resource principal auth
- You want access to all OCI regions (not just 6)
- You need advanced OCI-specific features
- You're building OCI-native applications

## Installation

```bash
pnpm add @acedergren/oci-openai-compatible
# or
npm install @acedergren/oci-openai-compatible
# or
yarn add @acedergren/oci-openai-compatible
```

## Quick Start

### Basic Usage

```typescript
import { createOCIOpenAI } from '@acedergren/oci-openai-compatible';

const client = createOCIOpenAI({
  region: 'us-ashburn-1',
  apiKey: process.env.OCI_API_KEY,
  compartmentId: process.env.OCI_COMPARTMENT_ID,
});

const response = await client.chat.completions.create({
  model: 'meta.llama-3.3-70b-instruct',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is OCI?' },
  ],
});

console.log(response.choices[0].message.content);
```

### Using Default Instance

```typescript
import { ociOpenAI } from '@acedergren/oci-openai-compatible';

// Uses environment variables:
// - OCI_REGION (defaults to us-ashburn-1)
// - OCI_API_KEY
// - OCI_COMPARTMENT_ID

const response = await ociOpenAI.chat.completions.create({
  model: 'meta.llama-3.3-70b-instruct',
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

### Streaming

```typescript
const stream = await client.chat.completions.create({
  model: 'meta.llama-3.3-70b-instruct',
  messages: [{ role: 'user', content: 'Write a poem about clouds.' }],
  stream: true,
  temperature: 0.9,
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || '';
  process.stdout.write(content);
}
```

## Configuration

### OCIOpenAIConfig

```typescript
interface OCIOpenAIConfig {
  /** OCI region (must support OpenAI-compatible endpoints) */
  region?: OCIRegion;

  /** OCI API key for authentication */
  apiKey?: string;

  /** OCI compartment OCID */
  compartmentId?: string;

  /** Custom endpoint URL (for testing) */
  endpoint?: string;

  /** Authentication method (default: 'api_key') */
  auth?: 'api_key' | 'instance_principal' | 'resource_principal';
}
```

## Supported Regions

| Region | Location | Endpoint |
|--------|----------|----------|
| `us-ashburn-1` | US East (Ashburn) | `inference.generativeai.us-ashburn-1.oci.oraclecloud.com` |
| `us-chicago-1` | US East (Chicago) | `inference.generativeai.us-chicago-1.oci.oraclecloud.com` |
| `us-phoenix-1` | US West (Phoenix) | `inference.generativeai.us-phoenix-1.oci.oraclecloud.com` |
| `eu-frankfurt-1` | Europe (Frankfurt) | `inference.generativeai.eu-frankfurt-1.oci.oraclecloud.com` |
| `ap-hyderabad-1` | Asia Pacific (Hyderabad) | `inference.generativeai.ap-hyderabad-1.oci.oraclecloud.com` |
| `ap-osaka-1` | Asia Pacific (Osaka) | `inference.generativeai.ap-osaka-1.oci.oraclecloud.com` |

## Supported Models

- `meta.llama-3.3-70b-instruct` - Meta Llama 3.3 70B
- `meta.llama-3.2-90b-vision-instruct` - Meta Llama 3.2 90B Vision
- `meta.llama-3.1-405b-instruct` - Meta Llama 3.1 405B
- `meta.llama-3.1-70b-instruct` - Meta Llama 3.1 70B
- `xai.grok-3` - xAI Grok 3
- `xai.grok-3-mini` - xAI Grok 3 Mini
- `openai.gpt-oss` - OpenAI GPT OSS

## Migration from OpenAI

Replace OpenAI imports:

```diff
- import OpenAI from 'openai';
+ import { createOCIOpenAI } from '@acedergren/oci-openai-compatible';

- const client = new OpenAI({
-   apiKey: process.env.OPENAI_API_KEY,
- });
+ const client = createOCIOpenAI({
+   region: 'us-ashburn-1',
+   apiKey: process.env.OCI_API_KEY,
+   compartmentId: process.env.OCI_COMPARTMENT_ID,
+ });
```

Update model IDs:

```diff
  const response = await client.chat.completions.create({
-   model: 'gpt-4',
+   model: 'meta.llama-3.3-70b-instruct',
    messages: [...],
  });
```

## Environment Variables

```bash
# Required
export OCI_COMPARTMENT_ID="ocid1.compartment.oc1..yourcompartmentid"

# Optional (defaults to us-ashburn-1)
export OCI_REGION="eu-frankfurt-1"

# Optional (for API key auth)
export OCI_API_KEY="your-api-key"
```

## API Documentation

Full OpenAI SDK documentation applies. See:
- [OpenAI Node.js SDK](https://github.com/openai/openai-node)
- [OCI OpenAI Compatibility Docs](https://docs.oracle.com/en-us/iaas/Content/generative-ai/oci-openai.htm)

## Limitations

- **Chat completions only**: OCI's OpenAI-compatible endpoints currently support `/chat/completions` only
- **Limited regions**: Only 6 regions support OpenAI-compatible endpoints (vs all OCI regions for native provider)
- **API key auth only**: Only `api_key` authentication is supported. The `auth` config field accepts other values for type compatibility, but `instance_principal` and `resource_principal` are not implemented. Use `@acedergren/oci-genai-provider` for advanced OCI auth methods

## Examples

See [examples/](./examples/) directory for:
- Basic chat completion
- Streaming responses
- Multiple regions
- Custom endpoints

## Related Packages

- [`@acedergren/oci-genai-provider`](../oci-genai-provider) - Native OCI provider with full ProviderV3 support
- [`@acedergren/opencode-oci-genai`](../opencode-integration) - OpenCode CLI integration

## License

MIT

## Contributing

Issues and PRs welcome! See [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Support

- [GitHub Issues](https://github.com/acedergren/opencode-oci-genai/issues)
- [OCI Documentation](https://docs.oracle.com/en-us/iaas/Content/generative-ai/home.htm)
