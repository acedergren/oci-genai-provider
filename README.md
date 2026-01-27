# OCI Generative AI Provider for Vercel AI SDK

> 🚀 **Official Oracle Cloud Infrastructure provider for the Vercel AI SDK** — Use xAI Grok, Meta Llama, Cohere, and Google Gemini models in your AI-powered applications.

[![Tests](https://img.shields.io/badge/tests-117%20passing-green)](https://github.com/acedergren/opencode-oci-genai)
[![Coverage](https://img.shields.io/badge/coverage-80%25%2B-brightgreen)](https://github.com/acedergren/opencode-oci-genai)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

## What is This?

This is a **Vercel AI SDK provider** that enables OCI Generative AI models in any application using the Vercel AI SDK. It works with:

- ✅ Next.js, Remix, SvelteKit, and any other framework
- ✅ Node.js applications
- ✅ OpenCode (with optional convenience package)
- ✅ Any tool built on Vercel AI SDK

## Packages

### [@acedergren/oci-genai-provider](./packages/oci-genai-provider)

**The core provider** — Use this in your applications.

```bash
npm install @acedergren/oci-genai-provider ai
```

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { generateText } from 'ai';

const result = await generateText({
  model: oci('cohere.command-r-plus'),
  prompt: 'Explain quantum computing',
});
```

**Documentation**: [Core Provider README](./packages/oci-genai-provider/README.md)

### [@acedergren/opencode-oci-genai](./packages/opencode-integration)

**Optional OpenCode integration** — Convenience layer for OpenCode users.

```bash
npm install @acedergren/opencode-oci-genai
```

```json
// opencode.json
{
  "provider": {
    "oci-genai": {
      "npm": "@acedergren/opencode-oci-genai"
    }
  }
}
```

**Documentation**: [OpenCode Integration Guide](./docs/guides/opencode-integration/README.md)

## Features

- **16+ Models**: xAI Grok 4, Meta Llama 3.3, Cohere Command, Google Gemini
- **Streaming**: Full Server-Sent Events support
- **Tool Calling**: Function calling with AI SDK
- **Multiple Auth**: Config file, instance principal, resource principal
- **Regional**: EU Frankfurt, Stockholm, US Ashburn, and more
- **Type Safe**: Full TypeScript with AI SDK v3
- **Well Tested**: 117 tests, 80%+ coverage, TDD workflow

## Quick Start

### 1. Install Dependencies

```bash
npm install @acedergren/oci-genai-provider ai
```

### 2. Configure OCI Credentials

```bash
# ~/.oci/config
[DEFAULT]
user=ocid1.user.oc1..your_user_id
fingerprint=your_fingerprint
key_file=~/.oci/oci_api_key.pem
tenancy=ocid1.tenancy.oc1..your_tenancy_id
region=eu-frankfurt-1
```

### 3. Set Environment Variable

```bash
export OCI_COMPARTMENT_ID="ocid1.compartment.oc1..your_id"
```

### 4. Use in Your App

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { generateText, streamText } from 'ai';

// Generate text
const result = await generateText({
  model: oci('xai.grok-4-maverick'),
  prompt: 'Write a haiku about TypeScript',
});

// Stream responses
const stream = streamText({
  model: oci('meta.llama-3.3-70b-instruct'),
  prompt: 'Explain React hooks',
});

for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}
```

## Available Models

| Family            | Model ID                      | Context | Speed        | Tools | Vision |
| ----------------- | ----------------------------- | ------- | ------------ | ----- | ------ |
| **xAI Grok**      | `xai.grok-4-maverick`         | 131K    | ⚡ Very Fast | ✅    | ❌     |
| **Meta Llama**    | `meta.llama-3.3-70b-instruct` | 128K    | ⚡ Fast      | ✅    | ❌     |
| **Cohere**        | `cohere.command-r-plus`       | 131K    | ⚡ Fast      | ✅    | ❌     |
| **Google Gemini** | `google.gemini-2.5-flash`     | 1M      | ⚡ Fast      | ✅    | ✅     |

[Full model list →](./packages/oci-genai-provider/README.md#available-models)

## Documentation

- **[Core Provider Documentation](./packages/oci-genai-provider/README.md)** - Main provider API reference
- **[OpenCode Integration Guide](./docs/guides/opencode-integration/README.md)** - Using with OpenCode
- **[Authentication Guide](./docs/guides/authentication/README.md)** - OCI authentication setup
- **[Streaming Guide](./docs/guides/streaming/README.md)** - Streaming responses
- **[Tool Calling Guide](./docs/guides/tool-calling/README.md)** - Function calling
- **[API Reference](./docs/api-reference/)** - Complete API documentation
- **[Architecture](./docs/architecture/)** - System design and decisions

## Development

This is a pnpm workspace monorepo:

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run all tests (117 tests)
pnpm test

# Run tests with coverage (80%+ target)
pnpm test:coverage
```

### Package Structure

```
packages/
├── oci-genai-provider/      # Core Vercel AI SDK provider
├── opencode-integration/    # Optional OpenCode wrapper
└── test-utils/              # Shared test utilities
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## License

MIT

---

**Maintained by**: Alexander Cedergren @ Oracle
**Built with**: Vercel AI SDK, OCI TypeScript SDK, TypeScript 5.3
