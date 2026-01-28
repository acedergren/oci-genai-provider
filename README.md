# OCI Generative AI Provider for Vercel AI SDK

> 🚀 **Community-built Oracle Cloud Infrastructure provider for the Vercel AI SDK** — Use xAI Grok, Meta Llama, Cohere, and Google Gemini models in your AI-powered applications.

[![CI](https://github.com/acedergren/oci-genai-provider/actions/workflows/ci.yml/badge.svg)](https://github.com/acedergren/oci-genai-provider/actions/workflows/ci.yml)
[![Deploy Demo](https://github.com/acedergren/oci-genai-provider/actions/workflows/deploy-cf-pages.yml/badge.svg)](https://github.com/acedergren/oci-genai-provider/actions/workflows/deploy-cf-pages.yml)
[![codecov](https://codecov.io/gh/acedergren/oci-genai-provider/branch/main/graph/badge.svg)](https://codecov.io/gh/acedergren/oci-genai-provider)
[![Tests](https://img.shields.io/badge/tests-121%20passing-green)](https://github.com/acedergren/oci-genai-provider)
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

### [@acedergren/oci-openai-compatible](./packages/oci-openai-compatible)

**OpenAI-compatible wrapper** — For teams migrating from OpenAI with minimal code changes.

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

const response = await client.chat.completions.create({
  model: 'meta.llama-3.3-70b-instruct',
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

**Use this if:**
- You're migrating from OpenAI to OCI
- You want a lightweight, minimal-dependency package
- You prefer OpenAI SDK patterns
- You only need chat completions

**Documentation**: [OpenAI-Compatible README](./packages/oci-openai-compatible/README.md)

## Examples

Ready-to-run examples demonstrating the OCI GenAI Provider:

### 🚀 [Live Demo](https://oci-genai-chatbot.pages.dev)

Try the **SvelteKit Chatbot Demo** live on Cloudflare Pages (Cloudflare Access authentication required).

### [SvelteKit Chatbot](./examples/chatbot-demo/)

Beautiful chatbot with bioluminescence design.

```bash
cd examples/chatbot-demo && pnpm install && pnpm dev
```

### [Next.js Chatbot](./examples/nextjs-chatbot/)

Minimal chatbot using Next.js 15 App Router.

```bash
cd examples/nextjs-chatbot && pnpm install && pnpm dev
```

### [CLI Tool](./examples/cli-tool/)

Command-line interface for terminal usage.

```bash
cd examples/cli-tool && pnpm install && pnpm dev "Hello!"
```

[View all examples →](./examples/)

## Features

- **16+ Models**: xAI Grok 4, Meta Llama 3.3, Cohere Command, Google Gemini
- **Streaming**: Full Server-Sent Events support
- **Tool Calling**: Function calling with AI SDK
- **Multiple Auth**: Config file, instance principal, resource principal
- **Regional**: EU Frankfurt, Stockholm, US Ashburn, and more
- **Type Safe**: Full TypeScript with AI SDK v3
- **Built-in Retry**: Automatic retry with exponential backoff for transient failures
- **Timeout Control**: Configurable request timeouts
- **Rich Errors**: Specific error types (NetworkError, RateLimitError, AuthenticationError)
- **Well Tested**: 121 tests, 80%+ coverage, TDD workflow

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

### User Guides
- **[Core Provider Documentation](./packages/oci-genai-provider/README.md)** - Main provider API reference
- **[OpenAI-Compatible Wrapper](./packages/oci-openai-compatible/README.md)** - Drop-in OpenAI SDK compatibility
- **[Getting Started](./docs/getting-started/README.md)** - Quick start guide
- **[Examples](./examples/)** - Ready-to-run example applications
- **[OpenCode Integration Guide](./docs/guides/opencode-integration/README.md)** - Using with OpenCode
- **[Authentication Guide](./docs/guides/authentication/README.md)** - OCI authentication setup
- **[Troubleshooting Guide](./docs/guides/troubleshooting.md)** - Common issues and solutions
- **[Streaming Guide](./docs/guides/streaming/README.md)** - Streaming responses
- **[Tool Calling Guide](./docs/guides/tool-calling/README.md)** - Function calling
- **[API Reference](./docs/api-reference/)** - Complete API documentation
- **[Architecture](./docs/architecture/)** - System design and decisions

### Contributing & Development
- **[Contributing Guidelines](./CONTRIBUTING.md)** - How to contribute to this project
- **[Development Guide](./DEVELOPMENT.md)** - Setting up development environment
- **[Security Policy](./SECURITY.md)** - Reporting vulnerabilities responsibly
- **[Code of Conduct](./CODE_OF_CONDUCT.md)** - Community standards and expectations
- **[Changelog](./CHANGELOG.md)** - Release notes and version history

## Development

This is a pnpm workspace monorepo:

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run all tests (121 tests)
pnpm test

# Run tests with coverage (80%+ target)
pnpm test:coverage
```

### Package Structure

```
packages/
├── oci-genai-provider/          # Core Vercel AI SDK provider
├── oci-openai-compatible/       # OpenAI-compatible wrapper for OCI
├── opencode-integration/        # Optional OpenCode wrapper
└── test-utils/                  # Shared test utilities
```

## Contributing

We welcome contributions! Please see:

- **[Contributing Guidelines](./CONTRIBUTING.md)** - How to contribute, code standards, and PR process
- **[Development Guide](./DEVELOPMENT.md)** - Local setup, testing, building, and debugging
- **[Code of Conduct](./CODE_OF_CONDUCT.md)** - Community standards
- **[Security Policy](./SECURITY.md)** - How to responsibly report security vulnerabilities

**Quick start for contributors:**

```bash
# Clone and setup
git clone https://github.com/acedergren/oci-genai-provider.git
cd oci-genai-provider
pnpm install

# Create feature branch
git checkout -b feat/your-feature

# Make changes and test
pnpm test
pnpm lint
pnpm type-check

# Commit with conventional commits
git commit -m "feat: add your feature"

# Push and create PR
git push origin feat/your-feature
```

See [DEVELOPMENT.md](./DEVELOPMENT.md) for comprehensive setup and workflow details.

## Legal Disclaimer

**NO AFFILIATION WITH ORACLE CORPORATION**

This project is an independent, community-developed software project and has no official affiliation, endorsement, sponsorship, or connection with Oracle Corporation and/or its subsidiaries or affiliates (collectively, "Oracle"). The use of the term "OCI" or "Oracle Cloud Infrastructure" in this project refers solely to compatibility with Oracle's cloud services and does not imply any relationship with or endorsement by Oracle.

**DISCLAIMER OF WARRANTIES AND LIMITATION OF LIABILITY**

THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS, COPYRIGHT HOLDERS, CONTRIBUTORS, ORACLE CORPORATION, OR ANY OF ITS AFFILIATES BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

BY USING THIS SOFTWARE, YOU ACKNOWLEDGE AND AGREE THAT:

1. Neither the project maintainers nor Oracle Corporation and/or its affiliates make any representations or warranties regarding this software;
2. You assume all risks and responsibilities associated with the use of this software;
3. Neither the project maintainers nor Oracle Corporation and/or its affiliates shall have any liability or responsibility for any direct, indirect, incidental, special, exemplary, or consequential damages arising from your use of this software;
4. This software is provided for convenience and interoperability purposes only and does not constitute professional advice or services;
5. You are solely responsible for compliance with all applicable laws, regulations, and Oracle's terms of service when using this software with Oracle Cloud Infrastructure services.

**INDEPENDENT PROJECT NOTICE**

This is a community project created and maintained independently by Alexander Cedergren. Questions, issues, or support requests should be directed to this project's repository and not to Oracle Corporation or its support channels.

## License

MIT

---

**Community Project**: Created and maintained by [Alexander Cedergren](https://github.com/acedergren) for OCI
**Built with**: Vercel AI SDK, OCI TypeScript SDK, TypeScript 5.3

_This is an independent community project, not an official Oracle product._
