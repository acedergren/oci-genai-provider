# OCI GenAI Provider

Oracle Cloud Infrastructure Generative AI provider for the Vercel AI SDK, with compatibility wrappers and development tools.

## Quick Start

- **Package Manager**: pnpm
- **Build**: `pnpm build`
- **Test**: `pnpm test`
- **Type Check**: `pnpm type-check`

## Setup & Configuration

Detailed guides for project setup and configuration:

- [Authentication Guide](docs/guides/authentication/README.md) — OCI credentials, profiles, and auth methods
- [Publishing Guide](docs/guides/publishing.md) — GitHub Packages release workflow
- [Troubleshooting](docs/guides/troubleshooting.md) — Common OCI and SDK issues
- [Security Policy](SECURITY.md) — Reporting and handling vulnerabilities
- [Code Conventions](docs/architecture/code-conventions.md) — Naming conventions, patterns, and coding guidelines

## Technical References

- [Model Catalog](docs/reference/oci-genai-models/README.md) — Available OCI GenAI models and capabilities
- [Technology Stack](docs/architecture/technology-stack.md) — Workspace dependencies and tooling
- [Major Dependency Migrations](docs/troubleshooting/major-dependency-migrations.md) — Upgrade notes for major dependency changes

## Key Information

- **Active Region**: `eu-frankfurt-1` (FRANKFURT profile)
- **Alternative Regions**: `eu-stockholm-1` (STOCKHOLM), `us-ashburn-1` (ASHBURN)
- **Service**: OCI Generative AI
- **Authentication**: OCI API key from `~/.oci/config`
- **SDK**: OCI SDK for Node.js/TypeScript
- **Package Registry**: GitHub Packages (`@acedergren` scope)

## Project Structure

Monorepo containing the OCI GenAI provider ecosystem for AI development.

```
.
├── packages/
│   ├── oci-genai-provider/        # Core OCI GenAI provider for Vercel AI SDK
│   ├── oci-anthropic-compatible/  # Anthropic API compatibility wrapper
│   ├── oci-openai-compatible/     # OpenAI API compatibility wrapper
│   ├── oci-genai-setup/           # Interactive CLI setup tool
│   └── test-utils/                # Shared test utilities
└── .claude/                        # Local Claude settings
```

**Note:** Example applications have been extracted to a separate repository:

- [oci-genai-examples](https://github.com/acedergren/oci-genai-examples) - Demo apps and integration examples

---

**Last Updated**: 2026-03-09
