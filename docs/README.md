# OpenCode OCI GenAI Provider Documentation

Complete documentation for the Oracle Cloud Infrastructure (OCI) Generative AI provider for the Vercel AI SDK.

## Monorepo Structure

This project is organized as a monorepo with three packages:

- **`@acedergren/oci-genai-provider`** - Core OCI GenAI provider (standalone, works with any Vercel AI SDK project)
- **`@acedergren/opencode-oci-genai`** - OpenCode-specific integration and utilities
- **`@acedergren/test-utils`** - Shared test utilities and mocks (private package)

## Quick Navigation

### 🚀 Getting Started

- [Quick Start](getting-started/README.md) - Get up and running in 5 minutes
- [Installation](getting-started/installation.md) - Package installation and setup
- [First Chat](getting-started/first-chat.md) - Your first AI conversation
- [Configuration](getting-started/configuration.md) - Configuration options

### 📚 API Reference

- [OCI SDK](api-reference/oci-sdk/) - OCI TypeScript SDK documentation
- [Vercel AI SDK](api-reference/vercel-ai-sdk/) - AI SDK v3 provider interface
- [Provider API](api-reference/provider-api/) - Our provider API reference

### 📖 Guides

- [Authentication](guides/authentication/) - OCI authentication methods
- [IAM Policies](guides/iam-policies/) - Required IAM policies and setup
- [Streaming](guides/streaming/) - Implementing streaming responses
- [Tool Calling](guides/tool-calling/) - Function calling integration
- [OpenCode Integration](guides/opencode-integration/) - OpenCode setup
- [Deployment](guides/deployment/) - Production deployment
- [Monitoring](guides/monitoring/) - Logging and monitoring

### 🔍 Reference

- [OCI GenAI Models](reference/oci-genai-models/) - Complete model catalog
- [Configuration](reference/configuration/) - Configuration reference
- [Error Codes](reference/error-codes/) - Error handling guide

### 💡 Use Cases

- [Code Generation](use-cases/code-generation/) - Using AI for code tasks
- [Office Automation](use-cases/office-automation/) - Document processing workflows
- [CI/CD Integration](use-cases/cicd-integration/) - Automating with GitHub Actions

### 🎓 Tutorials

1. [Basic Chat](tutorials/01-basic-chat.md) - Simple chat implementation
2. [Streaming Responses](tutorials/02-streaming-responses.md) - Real-time streaming
3. [Tool Calling](tutorials/03-tool-calling.md) - Function integration
4. [OpenCode Integration](tutorials/04-opencode-integration.md) - Full OpenCode setup
5. [GitHub Bot](tutorials/05-github-bot.md) - Build a GitHub bot
6. [Production Deployment](tutorials/06-production-deployment.md) - Deploy to production

### 🏗️ Architecture

- [Overview](architecture/README.md) - System architecture
- [Design Decisions](architecture/design-decisions.md) - Why we built it this way
- [Provider Flow](architecture/provider-flow.md) - Request/response flow

### 🧪 Testing

- [Testing Guide](testing/README.md) - Comprehensive testing documentation
- [Test Suite Specification](plans/2026-01-26-test-suite-specification.md) - 121 tests across all modules
- [TDD Implementation Plan](plans/2026-01-27-core-provider-tdd-implementation.md) - RED-GREEN-REFACTOR cycles

### 🔒 Security

- [Security Best Practices](security/README.md) - Secure your implementation

### 📦 Archive

- [Requirements Specification](archive/requirements-spec.md) - Original requirements
- [Planning Documents](archive/planning-documents/) - Project planning

## Development

### Workspace Commands

This is a pnpm workspace monorepo. Common commands:

```bash
# Install all dependencies
pnpm install

# Build all packages
pnpm build

# Run tests in all packages
pnpm test

# Run tests with coverage
pnpm test:coverage

# Type check all packages
pnpm type-check

# Lint all packages
pnpm lint

# Run tests in specific package
pnpm --filter @acedergren/oci-genai-provider test
```

### Package Dependencies

- `opencode-integration` depends on `oci-genai-provider` (workspace dependency)
- Both packages depend on `test-utils` for testing (workspace dev dependency)

## About This Documentation

This documentation was collected from multiple authoritative sources:

- **Oracle Cloud Infrastructure** - Official OCI documentation and API references
- **Vercel AI SDK** - AI SDK v3 documentation and examples
- **Community Examples** - Real-world implementations from GitHub
- **Project Planning** - Internal architecture and design documents

All documentation includes source attribution for traceability.

## Documentation Quality

- ✓ Zero "TBD" or "TODO" placeholders
- ✓ All code examples tested
- ✓ All internal links validated
- ✓ Source attribution included
- ✓ Updated monthly for API changes
- ✓ 121 comprehensive tests (80%+ coverage target)
- ✓ TDD-based development workflow

## Contributing

See [Contributing Guidelines](../CONTRIBUTING.md) for information on improving this documentation.

For development setup:

1. Clone the repository
2. Run `pnpm install` (requires pnpm 8+)
3. Review [Testing Guide](testing/README.md) for test practices
4. Follow [TDD Implementation Plan](plans/2026-01-27-core-provider-tdd-implementation.md) for new features

---

**Last Updated**: 2026-01-27
**Documentation Version**: 1.0.0
**Provider Version**: 0.1.0 (in development)
**Monorepo Architecture**: pnpm workspaces
