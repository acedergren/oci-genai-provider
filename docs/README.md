# Documentation

Complete documentation for the OCI Generative AI provider for Vercel AI SDK.

## What This Project Does

This provider connects the Vercel AI SDK to Oracle Cloud Infrastructure's Generative AI service. It works with any application built on the Vercel AI SDK—Next.js, Remix, SvelteKit, Node.js, or custom implementations.

**Key packages:**
- **[@acedergren/oci-genai-provider](../packages/oci-genai-provider)** — Core provider (works everywhere)
- **[@acedergren/opencode-oci-genai](../packages/opencode-integration)** — Optional OpenCode wrapper
- **[@acedergren/test-utils](../packages/test-utils)** — Shared test utilities

## Start Here

| Guide | Description |
|-------|-------------|
| [Getting Started](getting-started/README.md) | Installation and first request |
| [Authentication](guides/authentication/README.md) | Configure OCI credentials |
| [Core Provider API](../packages/oci-genai-provider/README.md) | Main API reference |

## Guides

### Setup & Configuration
- [Authentication](guides/authentication/README.md) — API keys, instance principal, resource principal
- [IAM Policies](guides/iam-policies/README.md) — Required OCI permissions
- [Troubleshooting](guides/troubleshooting.md) — Common issues and solutions

### Features
- [Streaming](guides/streaming/README.md) — Real-time response streaming
- [Tool Calling](guides/tool-calling/README.md) — Function calling integration
- [OpenCode Integration](guides/opencode-integration/README.md) — Using with OpenCode

### Deployment
- [Publishing](guides/publishing.md) — Release process and npm publishing

## Reference

| Resource | Description |
|----------|-------------|
| [Model Catalog](reference/oci-genai-models/README.md) | Available models and capabilities |
| [OCI SDK](api-reference/oci-sdk/README.md) | OCI TypeScript SDK |
| [Vercel AI SDK](api-reference/vercel-ai-sdk/README.md) | AI SDK v3 interface |

## Tutorials

Step-by-step guides for common tasks:

1. [Basic Chat](tutorials/01-basic-chat.md) — Simple chat implementation
2. [Streaming Responses](tutorials/02-streaming-responses.md) — Real-time output
3. [Tool Calling](tutorials/03-tool-calling.md) — Function integration
4. [OpenCode Integration](tutorials/04-opencode-integration.md) — OpenCode setup
5. [GitHub Bot](tutorials/05-github-bot.md) — Build a GitHub assistant
6. [Production Deployment](tutorials/06-production-deployment.md) — Deploy to OCI

## Framework Integration

- [Next.js](use-cases/nextjs/README.md)
- [Remix](use-cases/remix/README.md)
- [Node.js](use-cases/nodejs/README.md)

## Architecture

- [Overview](architecture/README.md) — System architecture
- [Design Decisions](architecture/design-decisions.md) — Technical choices
- [Code Conventions](architecture/code-conventions.md) — Style and patterns
- [Technology Stack](architecture/technology-stack.md) — Dependencies

## Testing

- [Testing Guide](testing/README.md) — Test organization and practices
- [TDD Verification](TDD-VERIFICATION.md) — Test-driven development checks

## Development

```bash
pnpm install      # Install dependencies
pnpm build        # Build all packages
pnpm test         # Run 121 tests
pnpm type-check   # TypeScript validation
```

See [DEVELOPMENT.md](../DEVELOPMENT.md) for complete setup instructions.

## Contributing

We welcome contributions. See:
- [Contributing Guidelines](../CONTRIBUTING.md)
- [Code of Conduct](../CODE_OF_CONDUCT.md)
- [Security Policy](../SECURITY.md)

---

**Documentation Version**: 1.0.0
**Last Updated**: 2026-01-28
