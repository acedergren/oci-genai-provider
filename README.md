```
 ██████╗  ██████╗██╗     ██████╗ ███████╗███╗   ██╗ █████╗ ██╗
██╔═══██╗██╔════╝██║    ██╔════╝ ██╔════╝████╗  ██║██╔══██╗██║
██║   ██║██║     ██║    ██║  ███╗█████╗  ██╔██╗ ██║███████║██║
██║   ██║██║     ██║    ██║   ██║██╔══╝  ██║╚██╗██║██╔══██║██║
╚██████╔╝╚██████╗██║    ╚██████╔╝███████╗██║ ╚████║██║  ██║██║
 ╚═════╝  ╚═════╝╚═╝     ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝
██████╗ ██████╗  ██████╗ ██╗   ██╗██╗██████╗ ███████╗██████╗
██╔══██╗██╔══██╗██╔═══██╗██║   ██║██║██╔══██╗██╔════╝██╔══██╗
██████╔╝██████╔╝██║   ██║██║   ██║██║██║  ██║█████╗  ██████╔╝
██╔═══╝ ██╔══██╗██║   ██║╚██╗ ██╔╝██║██║  ██║██╔══╝  ██╔══██╗
██║     ██║  ██║╚██████╔╝ ╚████╔╝ ██║██████╔╝███████╗██║  ██║
╚═╝     ╚═╝  ╚═╝ ╚═════╝   ╚═══╝  ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝
```

# OCI Generative AI Provider for Vercel AI SDK

> **Community Project** — This is an independent, community-maintained project with no official affiliation with Oracle Corporation. Use of Oracle trademarks is for identification purposes only.

**Bring Oracle Cloud's AI models to your applications.** This community-built provider connects the Vercel AI SDK to OCI Generative AI, giving you access to xAI Grok, Meta Llama, Cohere, and Google Gemini models through a familiar interface.

[![CI](https://github.com/acedergren/oci-genai-provider/actions/workflows/ci.yml/badge.svg)](https://github.com/acedergren/oci-genai-provider/actions/workflows/ci.yml)
[![Deploy Demo](https://github.com/acedergren/oci-genai-provider/actions/workflows/deploy-cf-pages.yml/badge.svg)](https://github.com/acedergren/oci-genai-provider/actions/workflows/deploy-cf-pages.yml)
[![codecov](https://codecov.io/gh/acedergren/oci-genai-provider/branch/main/graph/badge.svg)](https://codecov.io/gh/acedergren/oci-genai-provider)
[![Tests](https://img.shields.io/badge/tests-121%20passing-green)](https://github.com/acedergren/oci-genai-provider)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

## Why This Provider?

If you're building AI-powered applications with the Vercel AI SDK and want to use Oracle Cloud Infrastructure's Generative AI service, this provider bridges that gap. It works with Next.js, Remix, SvelteKit, Node.js, and any framework that supports the Vercel AI SDK.

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { generateText } from 'ai';

const result = await generateText({
  model: oci('cohere.command-r-plus'),
  prompt: 'Explain quantum computing',
});
```

That's it. Your existing AI SDK code works with OCI models.

## Choose Your Package

### Core Provider (Most Users)

**[@acedergren/oci-genai-provider](./packages/oci-genai-provider)** — The foundation. Install this if you're using Next.js, Remix, SvelteKit, Node.js, or any Vercel AI SDK application.

```bash
npm install @acedergren/oci-genai-provider ai
```

[Core Provider Documentation](./packages/oci-genai-provider/README.md)

### OpenAI-Compatible Wrapper (Migration Path)

**[@acedergren/oci-openai-compatible](./packages/oci-openai-compatible)** — For teams migrating from OpenAI. Provides an OpenAI SDK-compatible interface with minimal code changes.

```bash
npm install @acedergren/oci-openai-compatible
```

```typescript
import { createOCIOpenAI } from '@acedergren/oci-openai-compatible';

const client = createOCIOpenAI({
  region: 'us-ashburn-1',
  apiKey: process.env.OCI_API_KEY,
  compartmentId: process.env.OCI_COMPARTMENT_ID,
});

// Same API as OpenAI SDK
const response = await client.chat.completions.create({
  model: 'meta.llama-3.3-70b-instruct',
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

[OpenAI-Compatible Documentation](./packages/oci-openai-compatible/README.md)

## Getting Started

### 1. Install the provider

```bash
npm install @acedergren/oci-genai-provider ai
```

### 2. Configure OCI credentials

Create or update `~/.oci/config`:

```ini
[DEFAULT]
user=ocid1.user.oc1..your_user_id
fingerprint=your_fingerprint
key_file=~/.oci/oci_api_key.pem
tenancy=ocid1.tenancy.oc1..your_tenancy_id
region=eu-frankfurt-1
```

### 3. Set your compartment ID

```bash
export OCI_COMPARTMENT_ID="ocid1.compartment.oc1..your_id"
```

### 4. Start building

```typescript
import { oci } from '@acedergren/oci-genai-provider';
import { generateText, streamText } from 'ai';

// Generate complete responses
const result = await generateText({
  model: oci.languageModel('openai.gpt-oss-120b'),
  prompt: 'Write a haiku about TypeScript',
});

// Stream responses token by token
const stream = streamText({
  model: oci.languageModel('xai.grok-4.20-0309-reasoning'),
  prompt: 'Explain React hooks',
});

for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}
```

## Available Models

| Family             | Model ID                                                          | Context | Tools | Vision   |
| ------------------ | ----------------------------------------------------------------- | ------- | ----- | -------- |
| **xAI Grok**       | `xai.grok-4.20-0309-reasoning` / `xai.grok-4.20-multi-agent-0309` | 2M      | Yes   | Yes/No\* |
| **Meta Llama**     | `meta.llama-3.3-70b-instruct`                                     | 128K    | Yes   | No       |
| **Cohere**         | `cohere.command-a-reasoning-08-2025`                              | 256K    | Yes   | No       |
| **Google Gemini**  | `google.gemini-2.5-flash`                                         | 1M      | Yes   | Yes      |
| **OpenAI GPT-OSS** | `openai.gpt-oss-120b`                                             | 128K    | Yes   | No       |

`*` Oracle’s `xai.grok-4.20-multi-agent-0309` release note documents the multi-agent workflow SKU, but not a full vision matrix; this package treats it conservatively as non-vision until Oracle publishes a model card with more detail.

[See all 16+ models](./packages/oci-genai-provider/README.md#available-models)

## Features

- **16+ AI Models** — Access xAI Grok 4, Meta Llama 3.3, Cohere Command, and Google Gemini
- **Streaming** — Full Server-Sent Events support for real-time responses
- **Tool Calling** — Function calling integration with the AI SDK
- **Multiple Auth Methods** — Config file, instance principal, or resource principal
- **Regional Support** — EU Frankfurt, Stockholm, US Ashburn, and more
- **Built-in Resilience** — Automatic retry with exponential backoff
- **Rich Error Handling** — Specific error types for network, rate limit, and auth issues
- **Well Tested** — 121 tests with 80%+ coverage, developed with TDD

## Examples

### Live Demo

**[oci-genai-chatbot.pages.dev](https://oci-genai-chatbot.pages.dev)** — Try the SvelteKit chatbot with bioluminescence design (requires Cloudflare Access).

### Run Examples

Examples are maintained in a separate repository to keep this provider focused and lean:

**[oci-genai-examples](https://github.com/acedergren/oci-genai-examples)** — Complete example collection including:

- SvelteKit chatbot with beautiful UI
- Next.js 15 App Router chatbot
- Command-line interface
- RAG with semantic search
- Multi-turn conversations
- Streaming responses
- Tool calling examples

## Documentation

**Start Here**

- [Getting Started](./docs/getting-started/README.md)
- [Authentication Guide](./docs/guides/authentication/README.md)
- [Core Provider API](./packages/oci-genai-provider/README.md)

**Guides**

- [Streaming Responses](./docs/guides/streaming/README.md)
- [Tool Calling](./docs/guides/tool-calling/README.md)
- [Troubleshooting](./docs/guides/troubleshooting.md)

**Reference**

- [Model Catalog](./docs/reference/oci-genai-models/README.md)
- [IAM Policies](./docs/guides/iam-policies/README.md)
- [Architecture](./docs/architecture/)

**Contributing**

- [Contributing Guidelines](./CONTRIBUTING.md)
- [Development Guide](./DEVELOPMENT.md)
- [Security Policy](./SECURITY.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)

## Development

This is a pnpm workspace monorepo:

```bash
pnpm install      # Install dependencies
pnpm build        # Build all packages
pnpm test         # Run 121 tests
pnpm test:coverage # Generate coverage report
```

### Project Structure

```
packages/
├── oci-genai-provider/     # Core Vercel AI SDK provider
├── oci-openai-compatible/  # OpenAI-compatible wrapper
├── oci-genai-setup/        # Setup CLI tool
└── test-utils/             # Shared test utilities
```

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines and [DEVELOPMENT.md](./DEVELOPMENT.md) for setup instructions.

```bash
git clone https://github.com/acedergren/oci-genai-provider.git
cd oci-genai-provider
pnpm install
pnpm test
```

## Legal

**Community Project** — This is an independent, community-maintained project. It is **not affiliated with, endorsed by, or sponsored by Oracle Corporation**. "OCI" and "Oracle Cloud Infrastructure" are trademarks of Oracle Corporation, used here solely for identification purposes to describe compatibility with Oracle's services.

**License** — MIT

**Disclaimer** — This software is provided "as is" without warranty of any kind. Neither the authors nor Oracle Corporation bear any liability for damages arising from its use. Users are responsible for compliance with all applicable laws and Oracle's terms of service when using this software with Oracle Cloud Infrastructure.

---

**Created by** [Alexander Cedergren](https://github.com/acedergren)
**Built with** Vercel AI SDK, OCI TypeScript SDK, TypeScript 5.3
